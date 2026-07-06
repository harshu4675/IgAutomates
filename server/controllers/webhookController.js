import Campaign from "../models/Campaign.js";
import InstagramAccount from "../models/InstagramAccount.js";
import Analytics from "../models/Analytics.js";
import { sendInstagramDM } from "../services/instagramService.js";
import env from "../config/env.js";
import logger from "../utils/logger.js";

export const verifyWebhook = (req, res) => {
  console.log("=== WEBHOOK REQUEST DEBUG ===");
  console.log("Full URL:", req.originalUrl);
  console.log("Query object:", JSON.stringify(req.query));
  console.log("Query keys:", Object.keys(req.query));
  console.log("Headers:", JSON.stringify(req.headers));
  console.log("===========================");

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  logger.info(
    `Webhook verification attempt - Mode: ${mode}, Token: ${token}, Challenge: ${challenge}`,
  );
  logger.info(`Expected token: ${env.IG_VERIFY_TOKEN}`);
  logger.info(`Token match: ${token === env.IG_VERIFY_TOKEN}`);

  if (mode === "subscribe" && token === env.IG_VERIFY_TOKEN) {
    logger.info("Webhook verified successfully - sending challenge");
    return res.status(200).send(challenge);
  }

  logger.warn(
    `Webhook verification failed - Mode: ${mode}, Token match: ${token === env.IG_VERIFY_TOKEN}`,
  );
  return res.status(403).send("Forbidden");
};

export const handleWebhook = async (req, res) => {
  res.status(200).send("EVENT_RECEIVED");
  processWebhookEvent(req.body).catch((err) => {
    logger.error("Webhook processing error", err);
  });
};

export const processWebhookEvent = async (body) => {
  try {
    logger.info(
      "Webhook POST received:",
      JSON.stringify(body).substring(0, 500),
    );

    if (body.object !== "instagram") {
      logger.warn(`Received non-instagram webhook: ${body.object}`);
      return;
    }

    for (const entry of body.entry || []) {
      const igAccountId = entry.id;

      for (const change of entry.changes || []) {
        if (change.field === "comments") {
          await processCommentEvent(igAccountId, change.value);
        }
      }

      for (const messagingEvent of entry.messaging || []) {
        logger.info(
          "Messaging event received:",
          JSON.stringify(messagingEvent).substring(0, 300),
        );
      }
    }
  } catch (error) {
    logger.error("Webhook processing error", error);
  }
};

async function processCommentEvent(igAccountId, commentData) {
  try {
    const { id: commentId, text: commentText, from, media } = commentData;

    if (!from || !from.id || from.id === igAccountId) {
      logger.info("Skipping comment from account owner");
      return;
    }

    if (!commentText || !media?.id) {
      logger.warn("Invalid comment data received");
      return;
    }

    const postId = media.id;
    const commenterId = from.id;
    const commenterUsername = from.username || "unknown";

    logger.info(
      `Comment received on post ${postId}: "${commentText}" from @${commenterUsername}`,
    );
    const account = await InstagramAccount.findOne({
      $or: [{ igUserId: igAccountId }, { pageId: igAccountId }],
      isConnected: true,
    }).select("+accessToken +pageAccessToken +instagramUserToken");

    if (!account) {
      logger.warn(`No connected account found for IG ID: ${igAccountId}`);
      return;
    }

    const campaigns = await Campaign.find({
      instagramAccount: account._id,
      igPostId: postId,
      isActive: true,
    });

    if (campaigns.length === 0) {
      logger.info(`No active campaigns for post ${postId}`);
      return;
    }

    logger.info(
      `Found ${campaigns.length} active campaign(s) for post ${postId}`,
    );

    for (const campaign of campaigns) {
      await processCampaignMatch({
        campaign,
        account,
        commentId,
        commentText,
        commenterId,
        commenterUsername,
        isTest: false,
      });
    }
  } catch (error) {
    logger.error("Error processing comment event", error);
  }
}

async function processCampaignMatch({
  campaign,
  account,
  commentId,
  commentText,
  commenterId,
  commenterUsername,
  isTest = false,
}) {
  try {
    const alreadyProcessed = campaign.processedComments.some(
      (pc) => pc.commentId === commentId,
    );

    if (alreadyProcessed) {
      logger.info(
        `Comment ${commentId} already processed for campaign ${campaign._id}`,
      );
      return;
    }

    campaign.stats.totalComments += 1;

    const keywordMatched = checkKeywordMatch(
      commentText,
      campaign.keyword,
      campaign.matchType,
    );

    await Analytics.create({
      user: campaign.user,
      campaign: campaign._id,
      event: "comment_received",
      commentId,
      commentText,
      fromUserId: commenterId,
      fromUsername: commenterUsername,
    });

    if (!keywordMatched) {
      await campaign.save();
      logger.info(
        `No keyword match for "${campaign.keyword}" in "${commentText}"`,
      );
      return;
    }

    campaign.stats.keywordMatches += 1;

    await Analytics.create({
      user: campaign.user,
      campaign: campaign._id,
      event: "keyword_matched",
      commentId,
      commentText,
      fromUserId: commenterId,
      fromUsername: commenterUsername,
      metadata: { keyword: campaign.keyword },
    });

    logger.info(
      `Keyword "${campaign.keyword}" matched! ${isTest ? "[TEST MODE - Skipping actual DM]" : `Sending DM to @${commenterUsername}`}`,
    );

    let dmContent = campaign.dmMessage.replace(
      /\{\{username\}\}/g,
      commenterUsername,
    );

    if (campaign.dmLink) {
      dmContent += `\n\n${campaign.dmLink}`;
    }

    let dmResult;
    if (isTest) {
      dmResult = {
        success: true,
        data: { message_id: `test_msg_${Date.now()}` },
        isTest: true,
      };
      logger.info(
        `[TEST MODE] Simulated DM to @${commenterUsername}: ${dmContent.substring(0, 100)}`,
      );
    } else {
      const tokenToUse = account.instagramUserToken || account.pageAccessToken;

      dmResult = await sendInstagramDM(
        account.igUserId,
        commenterId,
        dmContent,
        tokenToUse,
        commentId,
      );
    }

    if (dmResult.success) {
      campaign.stats.dmsSent += 1;

      await Analytics.create({
        user: campaign.user,
        campaign: campaign._id,
        event: "dm_sent",
        commentId,
        commentText,
        fromUserId: commenterId,
        fromUsername: commenterUsername,
        metadata: {
          messageId: dmResult.data?.message_id,
          isTest: isTest || false,
        },
      });

      logger.info(
        `DM ${isTest ? "simulated" : "sent"} successfully to @${commenterUsername}`,
      );
    } else {
      campaign.stats.dmsFailed += 1;

      await Analytics.create({
        user: campaign.user,
        campaign: campaign._id,
        event: "dm_failed",
        commentId,
        commentText,
        fromUserId: commenterId,
        fromUsername: commenterUsername,
        metadata: { error: dmResult.error },
      });

      logger.error(`DM failed to @${commenterUsername}: ${dmResult.error}`);
    }

    campaign.processedComments.push({
      commentId,
      userId: commenterId,
      username: commenterUsername,
      text: commentText,
      dmSent: dmResult.success,
      dmSentAt: dmResult.success ? new Date() : null,
      processedAt: new Date(),
    });

    if (campaign.processedComments.length > 500) {
      campaign.processedComments = campaign.processedComments.slice(-500);
    }

    await campaign.save();
  } catch (error) {
    logger.error(`Error processing campaign match: ${campaign._id}`, error);
  }
}

function checkKeywordMatch(text, keyword, matchType) {
  const normalizedText = text.toLowerCase().trim();
  const normalizedKeyword = keyword.toLowerCase().trim();

  if (matchType === "exact") {
    return normalizedText === normalizedKeyword;
  }

  return normalizedText.includes(normalizedKeyword);
}

export const testWebhook = async (req, res) => {
  try {
    const { campaignId, username, commentText } = req.body;

    if (!campaignId || !username || !commentText) {
      return res.status(400).json({
        success: false,
        message: "campaignId, username, and commentText are required",
      });
    }

    const campaign = await Campaign.findOne({
      _id: campaignId,
      user: req.user._id,
    }).populate("instagramAccount");

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    const account = await InstagramAccount.findById(
      campaign.instagramAccount._id,
    ).select("+accessToken +pageAccessToken +instagramUserToken");

    const testCommentId = `test_${Date.now()}`;
    const testUserId = `test_user_${Date.now()}`;

    await processCampaignMatch({
      campaign,
      account,
      commentId: testCommentId,
      commentText,
      commenterId: testUserId,
      commenterUsername: username,
      isTest: true,
    });

    return res.status(200).json({
      success: true,
      message:
        "Test comment processed successfully. Check analytics for results.",
    });
  } catch (error) {
    logger.error("Test webhook error", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
