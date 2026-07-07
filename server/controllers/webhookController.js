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
  processWebhookEvent(req.body).catch((err) => {
    logger.error("Webhook processing error", err);
  });
};

export const processWebhookEvent = async (body) => {
  try {
    logger.info("Webhook received:", JSON.stringify(body).substring(0, 800));

    if (body.object !== "instagram") return;

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
    const senderId = messagingEvent.sender?.id;

    if (!senderId || senderId === igAccountId) {
      logger.info(`Skipping message from account owner or invalid sender`);
      return;
    }

    const account = await InstagramAccount.findOne({
      $or: [{ igUserId: igAccountId }, { pageId: igAccountId }],
      isConnected: true,
    }).select("+accessToken +pageAccessToken +instagramUserToken");

    if (!account) {
      logger.warn(`No account found for IG ID: ${igAccountId}`);
      return;
    }

    if (messagingEvent.postback) {
      await handlePostback(account, senderId, messagingEvent.postback);
      return;
    }

    if (messagingEvent.message) {
      const msg = messagingEvent.message;

      if (msg.is_echo) {
        logger.info(`Skipping echo message`);
        return;
      }

      if (msg.attachments && msg.attachments.length > 0) {
        await handleAttachmentMessage(account, senderId, msg);
        return;
      }

      if (msg.text) {
        await handleTextMessage(account, senderId, msg.text);
        return;
      }
    }

    logger.info(
      `Unhandled messaging event: ${JSON.stringify(messagingEvent).substring(0, 200)}`,
    );
  } catch (error) {
    logger.error("Error processing messaging event", error);
  }
}

async function handleAttachmentMessage(account, senderId, message) {
  try {
    logger.info(
      `Attachment message from ${senderId}: ${JSON.stringify(message.attachments).substring(0, 300)}`,
    );

    for (const attachment of message.attachments) {
      const type = attachment.type;
      const payload = attachment.payload || {};

      let mediaId = null;
      let source = null;

      if (type === "ig_reel" || type === "reel") {
        mediaId =
          payload.reel_video_id ||
          payload.media_id ||
          extractMediaIdFromUrl(payload.url);
        source = "share";
      } else if (type === "share") {
        mediaId =
          payload.media_id || payload.id || extractMediaIdFromUrl(payload.url);
        source = "share";
      } else if (type === "story_mention") {
        mediaId =
          payload.story_id ||
          payload.media_id ||
          extractMediaIdFromUrl(payload.url);
        source = "story_mention";
      }

      if (!mediaId) {
        logger.warn(`Could not extract media ID from attachment type: ${type}`);
        continue;
      }

      logger.info(
        `Detected ${source} for media ${mediaId} from user ${senderId}`,
      );

      await processShareEvent({
        account,
        senderId,
        mediaId,
        source,
      });
    }
  } catch (error) {
    logger.error("Error handling attachment message", error);
  }
}

function extractMediaIdFromUrl(url) {
  if (!url || typeof url !== "string") return null;
  try {
    const patterns = [
      /\/p\/([A-Za-z0-9_-]+)/,
      /\/reel\/([A-Za-z0-9_-]+)/,
      /\/tv\/([A-Za-z0-9_-]+)/,
      /media_id=(\d+)/,
      /\/(\d{15,})/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
  } catch (e) {
    return null;
  }
  return null;
}

async function processShareEvent({ account, senderId, mediaId, source }) {
  try {
    const campaigns = await Campaign.find({
      instagramAccount: account._id,
      igPostId: mediaId,
      isActive: true,
      "shareTrigger.enabled": true,
    });

    if (campaigns.length === 0) {
      logger.info(`No active share campaigns for media ${mediaId}`);
      return;
    }

    logger.info(
      `Found ${campaigns.length} share campaigns for media ${mediaId}`,
    );

    let userProfile = { username: `user_${senderId.substring(0, 8)}` };
    try {
      const profile = await getUserProfileQuick(
        senderId,
        account.instagramUserToken || account.pageAccessToken,
      );
      if (profile.username) userProfile = profile;
    } catch (e) {
      logger.warn("Could not fetch user profile for share");
    }

    for (const campaign of campaigns) {
      const shareType = source === "story_mention" ? "story_mention" : "share";

      if (
        source === "story_mention" &&
        !campaign.shareTrigger.triggerOnStoryMention
      ) {
        logger.info(
          `Story mention triggers disabled for campaign ${campaign._id}`,
        );
        continue;
      }

      if (source === "share" && !campaign.shareTrigger.triggerOnDMShare) {
        logger.info(`DM share triggers disabled for campaign ${campaign._id}`);
        continue;
      }

      campaign.stats.sharesReceived += 1;

      await Analytics.create({
        user: campaign.user,
        campaign: campaign._id,
        event:
          source === "story_mention"
            ? "story_mention_received"
            : "share_received",
        fromUserId: senderId,
        fromUsername: userProfile.username,
        source: shareType,
        metadata: { mediaId },
      });

      await processCampaignTrigger({
        campaign,
        account,
        commentId: `share_${Date.now()}_${senderId}`,
        commentText: campaign.shareTrigger.shareMessage || "shared",
        commenterId: senderId,
        commenterUsername: userProfile.username,
        source: shareType,
        isTest: false,
        skipKeywordCheck: true,
      });
    }
  } catch (error) {
    logger.error("Error processing share event", error);
  }
}

async function getUserProfileQuick(userId, accessToken) {
  try {
    const axios = (await import("axios")).default;
    const response = await axios.get(
      `https://graph.instagram.com/v21.0/${userId}`,
      {
        params: {
          access_token: accessToken,
          fields: "username,name",
        },
      },
    );
    return response.data;
  } catch (error) {
    return { username: null };
  }
}

async function handlePostback(account, senderId, postback) {
  try {
    logger.info(
      `Postback from ${senderId}: ${JSON.stringify(postback).substring(0, 200)}`,
    );

    const campaigns = await Campaign.find({
      instagramAccount: account._id,
      isActive: true,
      "followFlow.enabled": true,
      "pendingFollowChecks.userId": senderId,
    });

    logger.info(`Found ${campaigns.length} pending campaigns for postback`);

    for (const campaign of campaigns) {
      const pendingCheck = campaign.pendingFollowChecks.find(
        (p) => p.userId === senderId,
      );

      if (pendingCheck && !pendingCheck.buttonClicked) {
        pendingCheck.buttonClicked = true;
        campaign.stats.buttonClicks += 1;

        await Analytics.create({
          user: campaign.user,
          campaign: campaign._id,
          event: "follow_button_clicked",
          fromUserId: senderId,
          fromUsername: pendingCheck.username,
          source: pendingCheck.source || "comment",
          metadata: { commentId: pendingCheck.commentId },
        });

        await campaign.save();
        logger.info(
          `Button clicked by @${pendingCheck.username} on campaign ${campaign._id}`,
        );
      }
    }
  } catch (error) {
    logger.error("Error handling postback", error);
  }
}

async function handleTextMessage(account, senderId, messageText) {
  try {
    logger.info(
      `Text message from ${senderId}: "${messageText.substring(0, 100)}"`,
    );

    const legacyCampaigns = await Campaign.find({
      instagramAccount: account._id,
      isActive: true,
      requireFollow: true,
      "pendingFollowUsers.userId": senderId,
    });

    for (const campaign of legacyCampaigns) {
      await handleLegacyFollowConversion({
        campaign,
        account,
        senderId,
        messageText,
      });
    }

    const flowCampaigns = await Campaign.find({
      instagramAccount: account._id,
      isActive: true,
      "followFlow.enabled": true,
      "pendingFollowChecks.userId": senderId,
    });

    logger.info(
      `Found ${flowCampaigns.length} follow flow campaigns for user ${senderId}`,
    );

    for (const campaign of flowCampaigns) {
      await handleFollowFlowReply({
        campaign,
        account,
        senderId,
        messageText,
      });
    }

    const upperText = messageText.trim().toUpperCase();
    const isLinkRequest =
      upperText === "SEND" ||
      upperText === "LINK" ||
      upperText === "YES" ||
      upperText === "READY";

    if (isLinkRequest) {
      const replyFirstCampaigns = await Campaign.find({
        instagramAccount: account._id,
        isActive: true,
        linkDeliveryMode: "reply_first",
        dmLink: { $ne: "" },
      });

      logger.info(
        `Found ${replyFirstCampaigns.length} reply_first campaigns to check`,
      );

      for (const campaign of replyFirstCampaigns) {
        await handleReplyFirstLinkRequest({
          campaign,
          account,
          senderId,
          messageText,
        });
      }
    }
  } catch (error) {
    logger.error("Error handling text message", error);
  }
}

async function handleFollowFlowReply({
  campaign,
  account,
  senderId,
  messageText,
}) {
  try {
    const pendingCheck = campaign.pendingFollowChecks.find(
      (p) => p.userId === senderId,
    );

    if (!pendingCheck) {
      logger.info(`No pending check for ${senderId}`);
      return;
    }

    if (pendingCheck.verified) {
      logger.info(`User ${senderId} already verified`);
      return;
    }

    const tokenToUse = account.instagramUserToken || account.pageAccessToken;

    logger.info(
      `@${pendingCheck.username} replied to follow flow, sending resource now`,
    );

    pendingCheck.verified = true;

    if (!campaign.verifiedFollowers.includes(senderId)) {
      campaign.verifiedFollowers.push(senderId);
      campaign.stats.verifiedFollows += 1;
    }

    await Analytics.create({
      user: campaign.user,
      campaign: campaign._id,
      event: "follow_verified",
      fromUserId: senderId,
      fromUsername: pendingCheck.username,
      commentId: pendingCheck.commentId,
      source: pendingCheck.source || "comment",
      metadata: {
        method: pendingCheck.buttonClicked
          ? "button_clicked_and_replied"
          : "replied_only",
        replyText: messageText,
      },
    });

    const baseMsg = (
      campaign.followFlow?.afterFollowMessage ||
      "Awesome! Here is your resource:"
    ).replace(/\{\{username\}\}/g, pendingCheck.username);

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

      if (dmResult.wasBlocked) {
        campaign.stats.linkBlocked += 1;
        await Analytics.create({
          user: campaign.user,
          campaign: campaign._id,
          event: "link_blocked",
          fromUserId: senderId,
          fromUsername: pendingCheck.username,
          metadata: { mode: dmResult.mode, fallbackUsed: true },
        });
      }

      await Analytics.create({
        user: campaign.user,
        campaign: campaign._id,
        event: "follow_conversion",
        fromUserId: senderId,
        fromUsername: pendingCheck.username,
        source: pendingCheck.source || "comment",
        metadata: {
          messageId: dmResult.data?.message_id,
          replyText: messageText,
          linkMode: dmResult.mode,
          linkIncluded: dmResult.linkIncluded,
        },
      });

      await recordDMHistory({
        user: campaign.user,
        campaign: campaign._id,
        recipientId: senderId,
        recipientUsername: pendingCheck.username,
        templateUsed: -1,
      });

      logger.info(
        `Resource DM sent to @${pendingCheck.username} (mode: ${dmResult.mode})`,
      );
    } else {
      campaign.stats.dmsFailed += 1;

      await Analytics.create({
        user: campaign.user,
        campaign: campaign._id,
        event: "dm_failed",
        fromUserId: senderId,
        fromUsername: pendingCheck.username,
        metadata: {
          error: dmResult.error,
          errorCode: dmResult.errorCode,
          context: "follow_conversion",
        },
      });

      logger.error(
        `Resource DM failed for @${pendingCheck.username}: ${dmResult.error}`,
      );
    }

    campaign.pendingFollowChecks = campaign.pendingFollowChecks.filter(
      (p) => p.userId !== senderId,
    );

    await campaign.save();
  } catch (error) {
    logger.error(`Follow flow reply error`, error);
  }
}
async function handleReplyFirstLinkRequest({
  campaign,
  account,
  senderId,
  messageText,
}) {
  try {
    const recentlyDMed = campaign.processedComments.some(
      (pc) =>
        pc.userId === senderId &&
        pc.dmSent &&
        pc.processedAt &&
        Date.now() - new Date(pc.processedAt).getTime() < 24 * 60 * 60 * 1000,
    );

    if (!recentlyDMed) {
      logger.info(
        `User ${senderId} not in recent DMs for campaign ${campaign._id}, skipping link send`,
      );
      return;
    }

    const alreadySentLink = campaign.processedComments.some(
      (pc) =>
        pc.userId === senderId && pc.matchedKeyword === "link_sent_reply_first",
    );

    if (alreadySentLink) {
      logger.info(`Link already sent to user ${senderId}, skipping`);
      return;
    }

    logger.info(`Sending link to @${senderId} via reply_first flow`);

    const tokenToUse = account.instagramUserToken || account.pageAccessToken;

    const linkMessage = `Here is your link:\n\n${campaign.dmLink.replace(/^https?:\/\//i, "")}\n\n(Copy and paste in your browser)`;

    const dmResult = await sendInstagramDM(
      account.igUserId,
      senderId,
      linkMessage,
      tokenToUse,
      null,
    );

    if (dmResult.success) {
      campaign.stats.dmsSent += 1;

      await Analytics.create({
        user: campaign.user,
        campaign: campaign._id,
        event: "dm_sent",
        fromUserId: senderId,
        metadata: {
          messageId: dmResult.data?.message_id,
          context: "reply_first_link_delivery",
          replyText: messageText,
        },
      });

      campaign.processedComments.push({
        commentId: `link_${Date.now()}_${senderId}`,
        userId: senderId,
        username: "",
        text: messageText,
        matchedKeyword: "link_sent_reply_first",
        source: "reply",
        dmSent: true,
        dmSentAt: new Date(),
        processedAt: new Date(),
      });

      if (campaign.processedComments.length > 500) {
        campaign.processedComments = campaign.processedComments.slice(-500);
      }

      await campaign.save();
      logger.info(`Link sent to @${senderId} via reply_first`);
    } else {
      logger.error(`Failed to send link via reply_first: ${dmResult.error}`);
    }
  } catch (error) {
    logger.error("Error in handleReplyFirstLinkRequest", error);
  }
}
async function handleLegacyFollowConversion({
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

    const tokenToUse = account.instagramUserToken || account.pageAccessToken;
    const templateResult = pickDMTemplate(campaign);
    const baseContent = templateResult.message.replace(
      /\{\{username\}\}/g,
      pendingUser.username,
    );

    const dmResult = await sendDMWithLinkFallback({
      igUserId: account.igUserId,
      recipientId: senderId,
      message: baseContent,
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
        fromUsername: pendingUser.username,
        commentId: pendingUser.commentId,
        metadata: {
          messageId: dmResult.data?.message_id,
          replyText: messageText,
          linkMode: dmResult.mode,
        },
      });

      await recordDMHistory({
        user: campaign.user,
        campaign: campaign._id,
        recipientId: senderId,
        recipientUsername: pendingUser.username,
        templateUsed: templateResult.index,
      });
    }

    campaign.pendingFollowUsers = campaign.pendingFollowUsers.filter(
      (p) => p.userId !== senderId,
    );
    await campaign.save();
  } catch (error) {
    logger.error(`Legacy follow conversion error`, error);
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

    const account = await InstagramAccount.findOne({
      $or: [{ igUserId: igAccountId }, { pageId: igAccountId }],
      isConnected: true,
    }).select("+accessToken +pageAccessToken +instagramUserToken");

    if (!account) {
      logger.warn(`No account found for IG ID: ${igAccountId}`);
      return;
    }

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
        source: "comment",
        isTest: false,
        skipKeywordCheck: false,
      });
    }
  } catch (error) {
    logger.error("Error processing comment event", error);
  }
}

async function processCampaignTrigger({
  campaign,
  account,
  commentId,
  commentText,
  commenterId,
  commenterUsername,
  source = "comment",
  isTest = false,
  skipKeywordCheck = false,
}) {
  try {
    const alreadyProcessed = campaign.processedComments.some(
      (pc) => pc.commentId === commentId,
    );

    if (alreadyProcessed) {
      logger.info(`Comment ${commentId} already processed`);
      return;
    }

    if (source === "comment") {
      campaign.stats.totalComments += 1;
    }

    let matchResult = { matched: true, matchedKeyword: source };

    if (!skipKeywordCheck) {
      matchResult = checkKeywordMatch(
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
        source,
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
        source,
        metadata: {
          matchedKeyword: matchResult.matchedKeyword,
          matchType: campaign.matchType,
        },
      });

      logger.info(
        `Matched "${matchResult.matchedKeyword}" for @${commenterUsername}`,
      );
    } else {
      await Analytics.create({
        user: campaign.user,
        campaign: campaign._id,
        event: "share_processed",
        commentId,
        fromUserId: commenterId,
        fromUsername: commenterUsername,
        source,
      });
    }

    if (!isTest) {
      const scheduleCheck = isCampaignScheduleActive(campaign);
      if (!scheduleCheck.active) {
        campaign.stats.scheduleSkips += 1;
        await Analytics.create({
          user: campaign.user,
          campaign: campaign._id,
          event: "schedule_skip",
          commentId,
          commentText,
          fromUserId: commenterId,
          fromUsername: commenterUsername,
          source,
          metadata: scheduleCheck,
        });
        campaign.processedComments.push({
          commentId,
          userId: commenterId,
          username: commenterUsername,
          text: commentText,
          matchedKeyword: matchResult.matchedKeyword,
          source,
          dmSent: false,
          skipReason: `schedule: ${scheduleCheck.reason}`,
          processedAt: new Date(),
        });
        await campaign.save();
        return;
      }

      const rateLimitCheck = await checkRateLimits(campaign, commenterId);
      if (!rateLimitCheck.allowed) {
        campaign.stats.rateLimitSkips += 1;
        await Analytics.create({
          user: campaign.user,
          campaign: campaign._id,
          event: "rate_limit_skip",
          commentId,
          commentText,
          fromUserId: commenterId,
          fromUsername: commenterUsername,
          source,
          metadata: rateLimitCheck,
        });
        campaign.processedComments.push({
          commentId,
          userId: commenterId,
          username: commenterUsername,
          text: commentText,
          matchedKeyword: matchResult.matchedKeyword,
          source,
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
    let dmSent = false;
    let wasFollower = false;

    if (
      source === "comment" &&
      campaign.publicReply?.enabled &&
      campaign.publicReply?.message
    ) {
      if (!isTest) {
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
            source,
            metadata: { replyText: campaign.publicReply.message },
          });
        } else {
          await Analytics.create({
            user: campaign.user,
            campaign: campaign._id,
            event: "public_reply_failed",
            commentId,
            fromUserId: commenterId,
            fromUsername: commenterUsername,
            source,
            metadata: { error: replyResult.error },
          });
        }
      } else {
        publicReplySent = true;
      }
    }

    const delayMs = getDelayMilliseconds(campaign.dmDelay || "short");
    if (delayMs > 0 && !isTest) {
      await Analytics.create({
        user: campaign.user,
        campaign: campaign._id,
        event: "dm_delayed",
        commentId,
        fromUserId: commenterId,
        fromUsername: commenterUsername,
        source,
        metadata: { delayMs, delayType: campaign.dmDelay },
      });
      await sleep(delayMs);
    }

    const followFlowActive = campaign.followFlow?.enabled === true;

    logger.info(
      `Follow flow active for campaign ${campaign._id}: ${followFlowActive}, source: ${source}`,
    );

    if (followFlowActive && !isTest) {
      const isAlreadyVerified =
        campaign.verifiedFollowers.includes(commenterId);

      if (isAlreadyVerified) {
        wasFollower = true;
        logger.info(
          `@${commenterUsername} is verified follower, sending direct DM`,
        );

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
          commentId: source === "comment" ? commentId : null,
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
            event: "already_follower_dm",
            commentId,
            fromUserId: commenterId,
            fromUsername: commenterUsername,
            source,
            metadata: {
              messageId: dmResult.data?.message_id,
              linkMode: dmResult.mode,
            },
          });

          await Analytics.create({
            user: campaign.user,
            campaign: campaign._id,
            event: "dm_sent",
            commentId,
            fromUserId: commenterId,
            fromUsername: commenterUsername,
            source,
            metadata: {
              messageId: dmResult.data?.message_id,
              context: "verified_follower",
              linkMode: dmResult.mode,
            },
          });
        } else {
          campaign.stats.dmsFailed += 1;
          logger.error(
            `Failed to send DM to verified follower: ${dmResult.error}`,
          );
          await Analytics.create({
            user: campaign.user,
            campaign: campaign._id,
            event: "dm_failed",
            commentId,
            fromUserId: commenterId,
            fromUsername: commenterUsername,
            source,
            metadata: {
              error: dmResult.error,
              context: "verified_follower",
            },
          });
        }
      } else {
        const alreadyPending = campaign.pendingFollowChecks.some(
          (p) => p.userId === commenterId,
        );

        if (!alreadyPending) {
          logger.info(
            `Sending follow button to non-follower @${commenterUsername}`,
          );

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
            source === "comment" ? commentId : null,
          );

          if (buttonResult.success) {
            campaign.stats.followRequests += 1;

            campaign.pendingFollowChecks.push({
              userId: commenterId,
              username: commenterUsername,
              commentId,
              source,
              retryCount: 0,
              lastMessageAt: new Date(),
              buttonClicked: false,
              verified: false,
            });

            if (campaign.pendingFollowChecks.length > 500) {
              campaign.pendingFollowChecks =
                campaign.pendingFollowChecks.slice(-500);
            }

            await Analytics.create({
              user: campaign.user,
              campaign: campaign._id,
              event: "follow_button_sent",
              commentId,
              fromUserId: commenterId,
              fromUsername: commenterUsername,
              source,
              metadata: {
                messageId: buttonResult.data?.message_id,
                buttonUrl: campaign.followFlow.profileUrl,
              },
            });

            logger.info(`Follow button sent to @${commenterUsername}`);
          } else {
            campaign.stats.dmsFailed += 1;
            await Analytics.create({
              user: campaign.user,
              campaign: campaign._id,
              event: "dm_failed",
              commentId,
              fromUserId: commenterId,
              fromUsername: commenterUsername,
              source,
              metadata: {
                error: buttonResult.error,
                context: "follow_button",
              },
            });
            logger.error(
              `Follow button failed for @${commenterUsername}: ${buttonResult.error}`,
            );
          }
        } else {
          logger.info(`@${commenterUsername} already has pending follow check`);
        }
      }
    } else {
      logger.info(
        `Follow flow disabled, sending normal DM to @${commenterUsername}`,
      );

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
          commentId: source === "comment" ? commentId : null,
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
          source,
          metadata: {
            messageId: dmResult.data?.message_id,
            matchedKeyword: matchResult.matchedKeyword,
            templateUsed: templateResult.index,
            linkMode: dmResult.mode,
            linkIncluded: dmResult.linkIncluded,
            isTest: isTest || false,
          },
        });

        logger.info(
          `DM ${isTest ? "simulated" : "sent"} to @${commenterUsername} (mode: ${dmResult.mode})`,
        );
      } else {
        campaign.stats.dmsFailed += 1;
        await Analytics.create({
          user: campaign.user,
          campaign: campaign._id,
          event: "dm_failed",
          commentId,
          fromUserId: commenterId,
          fromUsername: commenterUsername,
          source,
          metadata: {
            error: dmResult.error,
            errorCode: dmResult.errorCode,
          },
        });
      }
    }

    campaign.processedComments.push({
      commentId,
      userId: commenterId,
      username: commenterUsername,
      text: commentText,
      matchedKeyword: matchResult.matchedKeyword || "",
      source,
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
    logger.error(`Error processing campaign trigger: ${campaign._id}`, error);
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
        message: "campaignId, username, and commentText are required",
      });
    }

    const campaign = await Campaign.findOne({
      _id: campaignId,
      user: req.user._id,
    }).populate("instagramAccount");

    if (!campaign) {
      return res
        .status(404)
        .json({ success: false, message: "Campaign not found" });
    }

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
      source: "comment",
      isTest: true,
      skipKeywordCheck: false,
    });

    return res.status(200).json({
      success: true,
      message: "Test processed. Check analytics.",
    });
  } catch (error) {
    logger.error("Test webhook error", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
