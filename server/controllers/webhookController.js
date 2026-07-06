import Campaign from "../models/Campaign.js";
import InstagramAccount from "../models/InstagramAccount.js";
import Analytics from "../models/Analytics.js";
import {
  sendInstagramDM,
  replyToComment,
  getDelayMilliseconds,
  sleep,
  pickDMTemplate,
} from "../services/instagramService.js";
import { isCampaignScheduleActive } from "../services/scheduleService.js";
import {
  checkRateLimits,
  incrementRateLimitCounters,
  recordDMHistory,
} from "../services/rateLimitService.js";
import env from "../config/env.js";
import logger from "../utils/logger.js";

export const verifyWebhook = (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  logger.info(
    `Webhook verification attempt - Mode: ${mode}, Token: ${token}, Challenge: ${challenge}`,
  );

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
        await processMessagingEvent(igAccountId, messagingEvent);
      }
    }
  } catch (error) {
    logger.error("Webhook processing error", error);
  }
};

async function processMessagingEvent(igAccountId, messagingEvent) {
  try {
    logger.info(
      "Messaging event received:",
      JSON.stringify(messagingEvent).substring(0, 300),
    );

    const senderId = messagingEvent.sender?.id;
    const messageText = messagingEvent.message?.text;

    if (!senderId || !messageText) return;

    if (senderId === igAccountId) {
      logger.info("Skipping own message echo");
      return;
    }

    const account = await InstagramAccount.findOne({
      $or: [{ igUserId: igAccountId }, { pageId: igAccountId }],
      isConnected: true,
    }).select("+accessToken +pageAccessToken +instagramUserToken");

    if (!account) {
      logger.warn(`No account found for messaging event: ${igAccountId}`);
      return;
    }

    const campaigns = await Campaign.find({
      instagramAccount: account._id,
      isActive: true,
      requireFollow: true,
      "pendingFollowUsers.userId": senderId,
    });

    if (campaigns.length === 0) return;

    for (const campaign of campaigns) {
      await handleFollowConversion({
        campaign,
        account,
        senderId,
        messageText,
      });
    }
  } catch (error) {
    logger.error("Error processing messaging event", error);
  }
}

async function handleFollowConversion({
  campaign,
  account,
  senderId,
  messageText,
}) {
  try {
    const pendingUser = campaign.pendingFollowUsers.find(
      (p) => p.userId === senderId,
    );

    if (!pendingUser) return;

    logger.info(
      `Follow conversion for @${pendingUser.username} on campaign ${campaign._id}`,
    );

    const tokenToUse = account.instagramUserToken || account.pageAccessToken;

    const templateResult = pickDMTemplate(campaign);
    let dmContent = templateResult.message.replace(
      /\{\{username\}\}/g,
      pendingUser.username,
    );

    if (campaign.dmLink) {
      dmContent += `\n\n${campaign.dmLink}`;
    }

    const dmResult = await sendInstagramDM(
      account.igUserId,
      senderId,
      dmContent,
      tokenToUse,
      null,
    );

    if (dmResult.success) {
      campaign.stats.dmsSent += 1;
      campaign.stats.followConversions += 1;

      if (templateResult.index >= 0) {
        campaign.lastTemplateIndex = templateResult.index;
        if (campaign.dmTemplates[templateResult.index]) {
          campaign.dmTemplates[templateResult.index].timesUsed += 1;
        }
      }

      await Analytics.create({
        user: campaign.user,
        campaign: campaign._id,
        event: "follow_conversion",
        fromUserId: senderId,
        fromUsername: pendingUser.username,
        commentId: pendingUser.commentId,
        metadata: {
          messageId: dmResult.data?.message_id,
          replyText: messageText,
          templateUsed: templateResult.index,
        },
      });

      await recordDMHistory({
        user: campaign.user,
        campaign: campaign._id,
        recipientId: senderId,
        recipientUsername: pendingUser.username,
        templateUsed: templateResult.index,
      });

      logger.info(`Follow conversion DM sent to @${pendingUser.username}`);
    } else {
      campaign.stats.dmsFailed += 1;

      await Analytics.create({
        user: campaign.user,
        campaign: campaign._id,
        event: "dm_failed",
        fromUserId: senderId,
        fromUsername: pendingUser.username,
        metadata: { error: dmResult.error, context: "follow_conversion" },
      });
    }

    campaign.pendingFollowUsers = campaign.pendingFollowUsers.filter(
      (p) => p.userId !== senderId,
    );

    await campaign.save();
  } catch (error) {
    logger.error(`Follow conversion error for campaign ${campaign._id}`, error);
  }
}

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

    const matchResult = checkKeywordMatch(
      commentText,
      campaign.keywords && campaign.keywords.length > 0
        ? campaign.keywords
        : campaign.keyword
          ? [campaign.keyword]
          : [],
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

    if (!matchResult.matched) {
      await campaign.save();
      logger.info(
        `No keyword match for campaign "${campaign.name}" in "${commentText}"`,
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
      metadata: {
        matchedKeyword: matchResult.matchedKeyword,
        matchType: campaign.matchType,
      },
    });

    logger.info(
      `Matched "${matchResult.matchedKeyword}" for @${commenterUsername}`,
    );

    if (!isTest) {
      const scheduleCheck = isCampaignScheduleActive(campaign);

      if (!scheduleCheck.active) {
        logger.info(
          `Schedule skip for @${commenterUsername}: ${scheduleCheck.message}`,
        );

        campaign.stats.scheduleSkips += 1;

        await Analytics.create({
          user: campaign.user,
          campaign: campaign._id,
          event: "schedule_skip",
          commentId,
          commentText,
          fromUserId: commenterId,
          fromUsername: commenterUsername,
          metadata: {
            reason: scheduleCheck.reason,
            message: scheduleCheck.message,
          },
        });

        campaign.processedComments.push({
          commentId,
          userId: commenterId,
          username: commenterUsername,
          text: commentText,
          matchedKeyword: matchResult.matchedKeyword,
          dmSent: false,
          skipReason: `schedule: ${scheduleCheck.reason}`,
          processedAt: new Date(),
        });

        await campaign.save();
        return;
      }

      const rateLimitCheck = await checkRateLimits(campaign, commenterId);

      if (!rateLimitCheck.allowed) {
        logger.info(
          `Rate limit skip for @${commenterUsername}: ${rateLimitCheck.message}`,
        );

        campaign.stats.rateLimitSkips += 1;

        const eventType =
          rateLimitCheck.reason === "user_cooldown"
            ? "cooldown_skip"
            : rateLimitCheck.reason === "repeat_user"
              ? "repeat_user_skip"
              : "rate_limit_skip";

        await Analytics.create({
          user: campaign.user,
          campaign: campaign._id,
          event: eventType,
          commentId,
          commentText,
          fromUserId: commenterId,
          fromUsername: commenterUsername,
          metadata: {
            reason: rateLimitCheck.reason,
            message: rateLimitCheck.message,
          },
        });

        campaign.processedComments.push({
          commentId,
          userId: commenterId,
          username: commenterUsername,
          text: commentText,
          matchedKeyword: matchResult.matchedKeyword,
          dmSent: false,
          skipReason: rateLimitCheck.reason,
          processedAt: new Date(),
        });

        await campaign.save();
        return;
      }
    }

    const tokenToUse = account.instagramUserToken || account.pageAccessToken;
    let publicReplySent = false;
    let followMessageSent = false;
    let dmSent = false;
    let dmResult = null;

    if (campaign.publicReply?.enabled && campaign.publicReply?.message) {
      if (isTest) {
        logger.info(
          `[TEST MODE] Would send public reply: ${campaign.publicReply.message}`,
        );
        publicReplySent = true;
      } else {
        const replyResult = await replyToComment(
          commentId,
          campaign.publicReply.message,
          tokenToUse,
        );

        if (replyResult.success) {
          publicReplySent = true;
          campaign.stats.publicRepliesSent += 1;

          await Analytics.create({
            user: campaign.user,
            campaign: campaign._id,
            event: "public_reply_sent",
            commentId,
            commentText,
            fromUserId: commenterId,
            fromUsername: commenterUsername,
            metadata: { replyText: campaign.publicReply.message },
          });
        } else {
          await Analytics.create({
            user: campaign.user,
            campaign: campaign._id,
            event: "public_reply_failed",
            commentId,
            commentText,
            fromUserId: commenterId,
            fromUsername: commenterUsername,
            metadata: { error: replyResult.error },
          });
        }
      }
    }

    const delayMs = getDelayMilliseconds(campaign.dmDelay || "short");

    if (delayMs > 0 && !isTest) {
      logger.info(
        `Delaying DM by ${delayMs}ms (${campaign.dmDelay}) for @${commenterUsername}`,
      );

      await Analytics.create({
        user: campaign.user,
        campaign: campaign._id,
        event: "dm_delayed",
        commentId,
        commentText,
        fromUserId: commenterId,
        fromUsername: commenterUsername,
        metadata: { delayMs, delayType: campaign.dmDelay },
      });

      await sleep(delayMs);
    }

    if (campaign.requireFollow && !isTest) {
      const alreadyPending = campaign.pendingFollowUsers.some(
        (p) => p.userId === commenterId,
      );

      if (!alreadyPending) {
        const followMsgResult = await sendInstagramDM(
          account.igUserId,
          commenterId,
          campaign.followMessage.replace(
            /\{\{username\}\}/g,
            commenterUsername,
          ),
          tokenToUse,
          commentId,
        );

        if (followMsgResult.success) {
          followMessageSent = true;
          campaign.stats.followRequests += 1;

          campaign.pendingFollowUsers.push({
            userId: commenterId,
            username: commenterUsername,
            commentId,
            followMessageSentAt: new Date(),
          });

          if (campaign.pendingFollowUsers.length > 200) {
            campaign.pendingFollowUsers =
              campaign.pendingFollowUsers.slice(-200);
          }

          await Analytics.create({
            user: campaign.user,
            campaign: campaign._id,
            event: "follow_message_sent",
            commentId,
            commentText,
            fromUserId: commenterId,
            fromUsername: commenterUsername,
            metadata: { messageId: followMsgResult.data?.message_id },
          });

          logger.info(`Follow request sent to @${commenterUsername}`);
        } else {
          await Analytics.create({
            user: campaign.user,
            campaign: campaign._id,
            event: "dm_failed",
            commentId,
            commentText,
            fromUserId: commenterId,
            fromUsername: commenterUsername,
            metadata: {
              error: followMsgResult.error,
              context: "follow_message",
            },
          });
        }
      }
    } else {
      const templateResult = pickDMTemplate(campaign);
      let dmContent = templateResult.message.replace(
        /\{\{username\}\}/g,
        commenterUsername,
      );

      if (campaign.dmLink) {
        dmContent += `\n\n${campaign.dmLink}`;
      }

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
        dmResult = await sendInstagramDM(
          account.igUserId,
          commenterId,
          dmContent,
          tokenToUse,
          commentId,
        );
      }

      if (dmResult.success) {
        dmSent = true;
        campaign.stats.dmsSent += 1;

        if (templateResult.index >= 0) {
          campaign.lastTemplateIndex = templateResult.index;
          if (campaign.dmTemplates[templateResult.index]) {
            campaign.dmTemplates[templateResult.index].timesUsed += 1;
          }
        }

        if (!isTest) {
          await incrementRateLimitCounters(campaign);
          await recordDMHistory({
            user: campaign.user,
            campaign: campaign._id,
            recipientId: commenterId,
            recipientUsername: commenterUsername,
            templateUsed: templateResult.index,
          });
        }

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
            matchedKeyword: matchResult.matchedKeyword,
            templateUsed: templateResult.index,
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
    }

    campaign.processedComments.push({
      commentId,
      userId: commenterId,
      username: commenterUsername,
      text: commentText,
      matchedKeyword: matchResult.matchedKeyword || "",
      dmSent,
      dmSentAt: dmSent ? new Date() : null,
      publicReplySent,
      followMessageSent,
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

function checkKeywordMatch(text, keywords, matchType) {
  const normalizedText = String(text || "")
    .toLowerCase()
    .trim();

  if (matchType === "any") {
    return { matched: true, matchedKeyword: "any" };
  }

  if (!Array.isArray(keywords) || keywords.length === 0) {
    return { matched: false, matchedKeyword: null };
  }

  const normalizedKeywords = keywords
    .map((k) => String(k).toLowerCase().trim())
    .filter(Boolean);

  for (const kw of normalizedKeywords) {
    let isMatch = false;

    switch (matchType) {
      case "exact":
        isMatch = normalizedText === kw;
        break;
      case "starts_with":
        isMatch = normalizedText.startsWith(kw);
        break;
      case "ends_with":
        isMatch = normalizedText.endsWith(kw);
        break;
      case "contains":
      default:
        isMatch = normalizedText.includes(kw);
        break;
    }

    if (isMatch) {
      return { matched: true, matchedKeyword: kw };
    }
  }

  return { matched: false, matchedKeyword: null };
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
