import Campaign from "../models/Campaign.js";
import InstagramAccount from "../models/InstagramAccount.js";
import Analytics from "../models/Analytics.js";
import {
  sendInstagramDM,
  sendDMWithButton,
  sendDMWithLinkFallback,
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
  if (mode === "subscribe" && token === env.IG_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.status(403).send("Forbidden");
};

export const handleWebhook = async (req, res) => {
  res.status(200).send("EVENT_RECEIVED");
  processWebhookEvent(req.body).catch((err) =>
    logger.error("Webhook error", err),
  );
};

export const processWebhookEvent = async (body) => {
  try {
    logger.info("Webhook:", JSON.stringify(body).substring(0, 800));
    if (body.object !== "instagram") return;

    for (const entry of body.entry || []) {
      const igAccountId = entry.id;
      for (const change of entry.changes || []) {
        if (change.field === "comments") {
          await processCommentEvent(igAccountId, change.value);
        }
      }
      for (const me of entry.messaging || []) {
        await processMessagingEvent(igAccountId, me);
      }
    }
  } catch (error) {
    logger.error("Webhook processing error", error);
  }
};

async function getAccount(igAccountId) {
  return InstagramAccount.findOne({
    $or: [{ igUserId: igAccountId }, { pageId: igAccountId }],
    isConnected: true,
  }).select("+accessToken +pageAccessToken +instagramUserToken");
}

async function processMessagingEvent(igAccountId, event) {
  try {
    const senderId = event.sender?.id;
    if (!senderId || senderId === igAccountId) return;

    const account = await getAccount(igAccountId);
    if (!account) return;

    if (event.message?.is_echo) return;

    if (event.postback) {
      await handlePostback(account, senderId, event.postback);
      return;
    }

    if (event.message?.text) {
      await handleTextMessage(account, senderId, event.message.text);
    }
  } catch (error) {
    logger.error("Messaging event error", error);
  }
}

async function handlePostback(account, senderId, postback) {
  try {
    logger.info(`Postback from ${senderId}`);

    const campaigns = await Campaign.find({
      instagramAccount: account._id,
      isActive: true,
      "followFlow.enabled": true,
      "pendingFollowChecks.userId": senderId,
    });

    for (const campaign of campaigns) {
      const pending = campaign.pendingFollowChecks.find(
        (p) => p.userId === senderId,
      );
      if (pending && !pending.buttonClicked) {
        pending.buttonClicked = true;
        pending.lastMessageAt = new Date();
        campaign.stats.buttonClicks += 1;
        campaign.markModified("pendingFollowChecks");
        await campaign.save();

        await Analytics.create({
          user: campaign.user,
          campaign: campaign._id,
          event: "follow_button_clicked",
          fromUserId: senderId,
          fromUsername: pending.username,
        });

        logger.info(`Button clicked by @${pending.username}`);
      }
    }
  } catch (error) {
    logger.error("Postback error", error);
  }
}

async function handleTextMessage(account, senderId, messageText) {
  try {
    logger.info(`Message from ${senderId}: "${messageText.substring(0, 50)}"`);

    const flowCampaigns = await Campaign.find({
      instagramAccount: account._id,
      isActive: true,
      "followFlow.enabled": true,
      "pendingFollowChecks.userId": senderId,
    });

    logger.info(`Found ${flowCampaigns.length} pending follow flow campaigns`);

    for (const campaign of flowCampaigns) {
      await handleFollowFlowReply({ campaign, account, senderId, messageText });
    }

    const upperText = messageText.trim().toUpperCase();
    if (
      upperText === "SEND" ||
      upperText === "LINK" ||
      upperText === "READY" ||
      upperText === "YES"
    ) {
      const linkCampaigns = await Campaign.find({
        instagramAccount: account._id,
        isActive: true,
        dmLink: { $ne: "" },
        linkDeliveryMode: { $in: ["reply_first", "delayed"] },
      });

      for (const campaign of linkCampaigns) {
        await handleLinkRequest({ campaign, account, senderId });
      }
    }
  } catch (error) {
    logger.error("Text message error", error);
  }
}

async function handleFollowFlowReply({
  campaign,
  account,
  senderId,
  messageText,
}) {
  try {
    const pending = campaign.pendingFollowChecks.find(
      (p) => p.userId === senderId,
    );
    if (!pending || pending.verified) return;

    const tokenToUse = account.instagramUserToken || account.pageAccessToken;

    if (!pending.buttonClicked) {
      logger.info(`@${pending.username} replied but DIDNT click button yet`);

      if (pending.retryCount >= campaign.followFlow.maxRetries) {
        logger.info(`Max retries reached for @${pending.username}, removing`);
        campaign.pendingFollowChecks = campaign.pendingFollowChecks.filter(
          (p) => p.userId !== senderId,
        );
        campaign.markModified("pendingFollowChecks");
        await campaign.save();
        return;
      }

      pending.retryCount += 1;
      pending.lastMessageAt = new Date();
      campaign.markModified("pendingFollowChecks");

      const retryMsg = (
        campaign.followFlow.retryMessage ||
        "Please tap the Follow button first, then reply again!"
      ).replace(/\{\{username\}\}/g, pending.username);

      await sendDMWithButton(
        account.igUserId,
        senderId,
        retryMsg,
        campaign.followFlow.followButtonText || "Follow Us",
        campaign.followFlow.profileUrl,
        tokenToUse,
        null,
      );

      await Analytics.create({
        user: campaign.user,
        campaign: campaign._id,
        event: "follow_retry_sent",
        fromUserId: senderId,
        fromUsername: pending.username,
        metadata: { retryCount: pending.retryCount, replyText: messageText },
      });

      await campaign.save();
      logger.info(`Retry ${pending.retryCount} sent to @${pending.username}`);
      return;
    }

    logger.info(
      `@${pending.username} clicked button + replied. Verifying and sending resource`,
    );

    pending.verified = true;

    if (!campaign.verifiedFollowers.includes(senderId)) {
      campaign.verifiedFollowers.push(senderId);
      campaign.stats.verifiedFollows += 1;
    }
    campaign.markModified("verifiedFollowers");
    campaign.markModified("pendingFollowChecks");

    await Analytics.create({
      user: campaign.user,
      campaign: campaign._id,
      event: "follow_verified",
      fromUserId: senderId,
      fromUsername: pending.username,
      commentId: pending.commentId,
      metadata: {
        method: "button_clicked_and_replied",
        replyText: messageText,
      },
    });

    const baseMsg = (
      campaign.followFlow.afterFollowMessage ||
      "Awesome! Here is your resource:"
    ).replace(/\{\{username\}\}/g, pending.username);

    const dmResult = await sendDMWithLinkFallback({
      igUserId: account.igUserId,
      recipientId: senderId,
      message: baseMsg,
      link: campaign.dmLink,
      accessToken: tokenToUse,
      commentId: null,
      linkDeliveryMode: campaign.linkDeliveryMode || "no_https",
    });

    if (dmResult.success) {
      campaign.stats.dmsSent += 1;
      campaign.stats.followConversions += 1;
      if (dmResult.wasBlocked) campaign.stats.linkBlocked += 1;

      await Analytics.create({
        user: campaign.user,
        campaign: campaign._id,
        event: "follow_conversion",
        fromUserId: senderId,
        fromUsername: pending.username,
        metadata: {
          messageId: dmResult.data?.message_id,
          linkMode: dmResult.mode,
        },
      });

      await recordDMHistory({
        user: campaign.user,
        campaign: campaign._id,
        recipientId: senderId,
        recipientUsername: pending.username,
        templateUsed: -1,
      });

      logger.info(`Resource sent to @${pending.username} (${dmResult.mode})`);
    } else {
      campaign.stats.dmsFailed += 1;
      logger.error(
        `Resource DM failed for @${pending.username}: ${dmResult.error}`,
      );
    }

    campaign.pendingFollowChecks = campaign.pendingFollowChecks.filter(
      (p) => p.userId !== senderId,
    );
    campaign.markModified("pendingFollowChecks");
    await campaign.save();
  } catch (error) {
    logger.error("Follow flow reply error", error);
  }
}

async function handleLinkRequest({ campaign, account, senderId }) {
  try {
    const isRecent = campaign.processedComments.some(
      (pc) =>
        pc.userId === senderId &&
        pc.dmSent &&
        pc.processedAt &&
        Date.now() - new Date(pc.processedAt).getTime() < 86400000,
    );

    const isVerified =
      Array.isArray(campaign.verifiedFollowers) &&
      campaign.verifiedFollowers.includes(senderId);

    if (!isRecent && !isVerified) return;

    const alreadySent = campaign.processedComments.some(
      (pc) =>
        pc.userId === senderId &&
        pc.matchedKeyword === "link_sent" &&
        pc.processedAt &&
        Date.now() - new Date(pc.processedAt).getTime() < 3600000,
    );

    if (alreadySent) return;

    const tokenToUse = account.instagramUserToken || account.pageAccessToken;
    const cleanLink = (campaign.dmLink || "")
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "");

    const result = await sendInstagramDM(
      account.igUserId,
      senderId,
      `Here you go!\n\n${cleanLink}`,
      tokenToUse,
      null,
    );

    if (result.success) {
      campaign.stats.dmsSent += 1;
      campaign.processedComments.push({
        commentId: `link_${Date.now()}_${senderId}`,
        userId: senderId,
        username: "",
        text: "SEND",
        matchedKeyword: "link_sent",
        dmSent: true,
        dmSentAt: new Date(),
        processedAt: new Date(),
      });
      if (campaign.processedComments.length > 500) {
        campaign.processedComments = campaign.processedComments.slice(-500);
      }
      await campaign.save();
      logger.info(`Link sent to ${senderId}`);
    } else {
      const bioMsg = "Check my bio for the link!";
      await sendInstagramDM(
        account.igUserId,
        senderId,
        bioMsg,
        tokenToUse,
        null,
      );
      campaign.stats.linkBlocked += 1;
      await campaign.save();
    }
  } catch (error) {
    logger.error("Link request error", error);
  }
}

async function processCommentEvent(igAccountId, commentData) {
  try {
    const { id: commentId, text: commentText, from, media } = commentData;
    if (!from || !from.id || from.id === igAccountId) return;
    if (!commentText || !media?.id) return;

    const postId = media.id;
    const commenterId = from.id;
    const commenterUsername = from.username || "unknown";

    logger.info(
      `Comment on ${postId}: "${commentText}" from @${commenterUsername}`,
    );

    const account = await getAccount(igAccountId);
    if (!account) return;

    const campaigns = await Campaign.find({
      instagramAccount: account._id,
      igPostId: postId,
      isActive: true,
    });

    if (campaigns.length === 0) return;

    for (const campaign of campaigns) {
      await processCampaignTrigger({
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
    logger.error("Comment event error", error);
  }
}

async function processCampaignTrigger({
  campaign,
  account,
  commentId,
  commentText,
  commenterId,
  commenterUsername,
  isTest = false,
}) {
  try {
    if (campaign.processedComments.some((pc) => pc.commentId === commentId))
      return;

    campaign.stats.totalComments += 1;

    const matchResult = checkKeywordMatch(
      commentText,
      campaign.keywords?.length > 0
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
        campaign.stats.scheduleSkips += 1;
        await campaign.save();
        return;
      }
      const rateLimitCheck = await checkRateLimits(campaign, commenterId);
      if (!rateLimitCheck.allowed) {
        campaign.stats.rateLimitSkips += 1;
        await campaign.save();
        return;
      }
    }

    const tokenToUse = account.instagramUserToken || account.pageAccessToken;
    let publicReplySent = false;
    let dmSent = false;
    let wasFollower = false;

    if (
      campaign.publicReply?.enabled &&
      campaign.publicReply?.message &&
      !isTest
    ) {
      const replyResult = await replyToComment(
        commentId,
        campaign.publicReply.message,
        tokenToUse,
      );
      if (replyResult.success) {
        publicReplySent = true;
        campaign.stats.publicRepliesSent += 1;
      }
    }

    const delayMs = getDelayMilliseconds(campaign.dmDelay || "short");
    if (delayMs > 0 && !isTest) await sleep(delayMs);

    const followFlowActive = campaign.followFlow?.enabled === true;

    logger.info(
      `FollowFlow: ${followFlowActive}, user: ${commenterUsername}, userId: ${commenterId}`,
    );

    if (followFlowActive && !isTest) {
      const isVerified =
        Array.isArray(campaign.verifiedFollowers) &&
        campaign.verifiedFollowers.includes(commenterId);

      logger.info(
        `Verified status for ${commenterId}: ${isVerified} (list size: ${campaign.verifiedFollowers?.length || 0})`,
      );

      if (isVerified) {
        wasFollower = true;
        logger.info(`@${commenterUsername} is VERIFIED. Sending direct DM`);

        const baseMsg = (
          campaign.followFlow.followerMessage ||
          "Thanks! Here is your resource:"
        ).replace(/\{\{username\}\}/g, commenterUsername);

        const dmResult = await sendDMWithLinkFallback({
          igUserId: account.igUserId,
          recipientId: commenterId,
          message: baseMsg,
          link: campaign.dmLink,
          accessToken: tokenToUse,
          commentId: commentId,
          linkDeliveryMode: campaign.linkDeliveryMode || "no_https",
        });

        if (dmResult.success) {
          dmSent = true;
          campaign.stats.dmsSent += 1;
          if (dmResult.wasBlocked) campaign.stats.linkBlocked += 1;
          await incrementRateLimitCounters(campaign);
          await recordDMHistory({
            user: campaign.user,
            campaign: campaign._id,
            recipientId: commenterId,
            recipientUsername: commenterUsername,
            templateUsed: -1,
          });
          await Analytics.create({
            user: campaign.user,
            campaign: campaign._id,
            event: "dm_sent",
            commentId,
            fromUserId: commenterId,
            fromUsername: commenterUsername,
            metadata: { context: "verified_follower", linkMode: dmResult.mode },
          });
          logger.info(
            `DM sent to verified @${commenterUsername} (${dmResult.mode})`,
          );
        } else {
          campaign.stats.dmsFailed += 1;
          logger.error(
            `DM failed for verified @${commenterUsername}: ${dmResult.error}`,
          );
        }
      } else {
        const alreadyPending = campaign.pendingFollowChecks.some(
          (p) => p.userId === commenterId,
        );

        if (!alreadyPending) {
          logger.info(`Sending follow button to @${commenterUsername}`);

          const followMsg = (
            campaign.followFlow.nonFollowerMessage || "Please follow us first!"
          ).replace(/\{\{username\}\}/g, commenterUsername);

          const buttonResult = await sendDMWithButton(
            account.igUserId,
            commenterId,
            followMsg,
            campaign.followFlow.followButtonText || "Follow Us",
            campaign.followFlow.profileUrl,
            tokenToUse,
            commentId,
          );

          if (buttonResult.success) {
            campaign.stats.followRequests += 1;
            campaign.pendingFollowChecks.push({
              userId: commenterId,
              username: commenterUsername,
              commentId,
              retryCount: 0,
              lastMessageAt: new Date(),
              buttonClicked: false,
              verified: false,
            });
            campaign.markModified("pendingFollowChecks");

            await Analytics.create({
              user: campaign.user,
              campaign: campaign._id,
              event: "follow_button_sent",
              commentId,
              fromUserId: commenterId,
              fromUsername: commenterUsername,
              metadata: { messageId: buttonResult.data?.message_id },
            });
            logger.info(`Follow button sent to @${commenterUsername}`);
          } else {
            campaign.stats.dmsFailed += 1;
            logger.error(
              `Button failed for @${commenterUsername}: ${buttonResult.error}`,
            );
          }
        } else {
          logger.info(`@${commenterUsername} already pending, skip`);
        }
      }
    } else {
      logger.info(`Normal DM to @${commenterUsername} (no follow flow)`);

      const templateResult = pickDMTemplate(campaign);
      const baseContent = templateResult.message.replace(
        /\{\{username\}\}/g,
        commenterUsername,
      );

      let dmResult;
      if (isTest) {
        dmResult = {
          success: true,
          data: { message_id: `test_${Date.now()}` },
          linkIncluded: !!campaign.dmLink,
          mode: "test",
        };
      } else {
        dmResult = await sendDMWithLinkFallback({
          igUserId: account.igUserId,
          recipientId: commenterId,
          message: baseContent,
          link: campaign.dmLink,
          accessToken: tokenToUse,
          commentId: commentId,
          linkDeliveryMode: campaign.linkDeliveryMode || "no_https",
        });
      }

      if (dmResult.success) {
        dmSent = true;
        campaign.stats.dmsSent += 1;
        if (dmResult.wasBlocked) campaign.stats.linkBlocked += 1;

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
            linkMode: dmResult.mode,
          },
        });
        logger.info(`DM sent to @${commenterUsername} (${dmResult.mode})`);
      } else {
        campaign.stats.dmsFailed += 1;
        logger.error(`DM failed for @${commenterUsername}: ${dmResult.error}`);
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
      wasFollower,
      processedAt: new Date(),
    });

    if (campaign.processedComments.length > 500) {
      campaign.processedComments = campaign.processedComments.slice(-500);
    }

    await campaign.save();
  } catch (error) {
    logger.error(`Campaign trigger error: ${campaign._id}`, error);
  }
}

function checkKeywordMatch(text, keywords, matchType) {
  const t = String(text || "")
    .toLowerCase()
    .trim();
  if (matchType === "any") return { matched: true, matchedKeyword: "any" };
  if (!Array.isArray(keywords) || keywords.length === 0)
    return { matched: false, matchedKeyword: null };

  for (const kw of keywords
    .map((k) => String(k).toLowerCase().trim())
    .filter(Boolean)) {
    let isMatch = false;
    switch (matchType) {
      case "exact":
        isMatch = t === kw;
        break;
      case "starts_with":
        isMatch = t.startsWith(kw);
        break;
      case "ends_with":
        isMatch = t.endsWith(kw);
        break;
      default:
        isMatch = t.includes(kw);
        break;
    }
    if (isMatch) return { matched: true, matchedKeyword: kw };
  }
  return { matched: false, matchedKeyword: null };
}

export const testWebhook = async (req, res) => {
  try {
    const { campaignId, username, commentText } = req.body;
    if (!campaignId || !username || !commentText) {
      return res.status(400).json({
        success: false,
        message: "campaignId, username, and commentText required",
      });
    }

    const campaign = await Campaign.findOne({
      _id: campaignId,
      user: req.user._id,
    }).populate("instagramAccount");
    if (!campaign)
      return res
        .status(404)
        .json({ success: false, message: "Campaign not found" });

    const account = await InstagramAccount.findById(
      campaign.instagramAccount._id,
    ).select("+accessToken +pageAccessToken +instagramUserToken");

    await processCampaignTrigger({
      campaign,
      account,
      commentId: `test_${Date.now()}`,
      commentText,
      commenterId: `test_user_${Date.now()}`,
      commenterUsername: username,
      isTest: true,
    });

    return res.status(200).json({ success: true, message: "Test processed." });
  } catch (error) {
    logger.error("Test error", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
