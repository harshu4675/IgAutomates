import Campaign from "../models/Campaign.js";
import InstagramAccount from "../models/InstagramAccount.js";
import Analytics from "../models/Analytics.js";
import {
  sendInstagramDM,
  sendDMWithButton,
  replyToComment,
  getDelayMilliseconds,
  sleep,
  pickDMTemplate,
  checkIfUserFollows,
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
    `Webhook verification - Mode: ${mode}, Token match: ${token === env.IG_VERIFY_TOKEN}`,
  );

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
    logger.info("Webhook received:", JSON.stringify(body).substring(0, 500));

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

    if (!senderId || senderId === igAccountId) return;

    const account = await InstagramAccount.findOne({
      $or: [{ igUserId: igAccountId }, { pageId: igAccountId }],
      isConnected: true,
    }).select("+accessToken +pageAccessToken +instagramUserToken");

    if (!account) return;

    if (messagingEvent.postback) {
      await handlePostback(account, senderId, messagingEvent.postback);
      return;
    }

    if (messagingEvent.message?.text) {
      await handleTextMessage(account, senderId, messagingEvent.message.text);
    }
  } catch (error) {
    logger.error("Error processing messaging event", error);
  }
}

async function handlePostback(account, senderId, postback) {
  try {
    logger.info(
      `Postback received from ${senderId}: ${JSON.stringify(postback)}`,
    );

    const campaigns = await Campaign.find({
      instagramAccount: account._id,
      isActive: true,
      "followFlow.enabled": true,
      "pendingFollowChecks.userId": senderId,
    });

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

    for (const campaign of flowCampaigns) {
      await handleFollowFlowReply({
        campaign,
        account,
        senderId,
        messageText,
      });
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

    if (!pendingCheck || pendingCheck.verified) return;

    const tokenToUse = account.instagramUserToken || account.pageAccessToken;

    logger.info(
      `User @${pendingCheck.username} replied to follow flow, trusting and sending resource`,
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
      metadata: {
        method: pendingCheck.buttonClicked
          ? "button_clicked_and_replied"
          : "replied_only",
        replyText: messageText,
      },
    });

    const templateResult = pickDMTemplate(campaign);
    let successMsg = campaign.followFlow.afterFollowMessage.replace(
      /\{\{username\}\}/g,
      pendingCheck.username,
    );

    if (campaign.dmLink) {
      successMsg += `\n\n${campaign.dmLink}`;
    }

    const dmResult = await sendInstagramDM(
      account.igUserId,
      senderId,
      successMsg,
      tokenToUse,
      null,
    );

    if (dmResult.success) {
      campaign.stats.dmsSent += 1;
      campaign.stats.followConversions += 1;

      await Analytics.create({
        user: campaign.user,
        campaign: campaign._id,
        event: "follow_conversion",
        fromUserId: senderId,
        fromUsername: pendingCheck.username,
        metadata: {
          messageId: dmResult.data?.message_id,
          replyText: messageText,
        },
      });

      await recordDMHistory({
        user: campaign.user,
        campaign: campaign._id,
        recipientId: senderId,
        recipientUsername: pendingCheck.username,
        templateUsed: templateResult.index,
      });

      logger.info(`Resource DM sent to @${pendingCheck.username}`);
    } else {
      campaign.stats.dmsFailed += 1;

      await Analytics.create({
        user: campaign.user,
        campaign: campaign._id,
        event: "dm_failed",
        fromUserId: senderId,
        fromUsername: pendingCheck.username,
        metadata: { error: dmResult.error, context: "follow_conversion" },
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
    logger.error(`Follow flow reply error for campaign ${campaign._id}`, error);
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
    let dmContent = templateResult.message.replace(
      /\{\{username\}\}/g,
      pendingUser.username,
    );

    if (campaign.dmLink) dmContent += `\n\n${campaign.dmLink}`;

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
      logger.info(`Comment ${commentId} already processed`);
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
        await Analytics.create({
          user: campaign.user,
          campaign: campaign._id,
          event: "schedule_skip",
          commentId,
          commentText,
          fromUserId: commenterId,
          fromUsername: commenterUsername,
          metadata: scheduleCheck,
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
        campaign.stats.rateLimitSkips += 1;
        await Analytics.create({
          user: campaign.user,
          campaign: campaign._id,
          event: "rate_limit_skip",
          commentId,
          commentText,
          fromUserId: commenterId,
          fromUsername: commenterUsername,
          metadata: rateLimitCheck,
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
    let dmSent = false;
    let wasFollower = false;

    if (campaign.publicReply?.enabled && campaign.publicReply?.message) {
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
            metadata: { replyText: campaign.publicReply.message },
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
        commentText,
        fromUserId: commenterId,
        fromUsername: commenterUsername,
        metadata: { delayMs, delayType: campaign.dmDelay },
      });
      await sleep(delayMs);
    }

    if (campaign.followFlow?.enabled && !isTest) {
      const isAlreadyVerified =
        campaign.verifiedFollowers.includes(commenterId);

      if (isAlreadyVerified) {
        wasFollower = true;
        logger.info(
          `@${commenterUsername} is already verified follower, sending direct DM`,
        );

        let msg = campaign.followFlow.followerMessage.replace(
          /\{\{username\}\}/g,
          commenterUsername,
        );
        if (campaign.dmLink) msg += `\n\n${campaign.dmLink}`;

        const dmResult = await sendInstagramDM(
          account.igUserId,
          commenterId,
          msg,
          tokenToUse,
          commentId,
        );

        if (dmResult.success) {
          dmSent = true;
          campaign.stats.dmsSent += 1;
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
            commentText,
            fromUserId: commenterId,
            fromUsername: commenterUsername,
            metadata: { messageId: dmResult.data?.message_id },
          });

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
              context: "verified_follower",
            },
          });
        }
      } else {
        let followerVerifiedViaAPI = false;
        try {
          const followCheck = await checkIfUserFollows(
            account.igUserId,
            commenterId,
            tokenToUse,
          );
          if (followCheck.success && followCheck.data?.business_discovery) {
            followerVerifiedViaAPI = true;
          }
        } catch (e) {
          logger.warn("API follow check unavailable");
        }

        if (followerVerifiedViaAPI) {
          wasFollower = true;
          campaign.verifiedFollowers.push(commenterId);
          campaign.stats.verifiedFollows += 1;

          let msg = campaign.followFlow.followerMessage.replace(
            /\{\{username\}\}/g,
            commenterUsername,
          );
          if (campaign.dmLink) msg += `\n\n${campaign.dmLink}`;

          const dmResult = await sendInstagramDM(
            account.igUserId,
            commenterId,
            msg,
            tokenToUse,
            commentId,
          );

          if (dmResult.success) {
            dmSent = true;
            campaign.stats.dmsSent += 1;
            await incrementRateLimitCounters(campaign);
            await Analytics.create({
              user: campaign.user,
              campaign: campaign._id,
              event: "dm_sent",
              commentId,
              commentText,
              fromUserId: commenterId,
              fromUsername: commenterUsername,
              metadata: { context: "api_verified_follower" },
            });
          }
        } else {
          const alreadyPending = campaign.pendingFollowChecks.some(
            (p) => p.userId === commenterId,
          );

          if (!alreadyPending) {
            const followMsg = campaign.followFlow.nonFollowerMessage.replace(
              /\{\{username\}\}/g,
              commenterUsername,
            );

            const buttonResult = await sendDMWithButton(
              account.igUserId,
              commenterId,
              followMsg,
              campaign.followFlow.followButtonText,
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

              if (campaign.pendingFollowChecks.length > 500) {
                campaign.pendingFollowChecks =
                  campaign.pendingFollowChecks.slice(-500);
              }

              await Analytics.create({
                user: campaign.user,
                campaign: campaign._id,
                event: "follow_button_sent",
                commentId,
                commentText,
                fromUserId: commenterId,
                fromUsername: commenterUsername,
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
                commentText,
                fromUserId: commenterId,
                fromUsername: commenterUsername,
                metadata: {
                  error: buttonResult.error,
                  context: "follow_button",
                },
              });
            }
          }
        }
      }
    } else {
      const templateResult = pickDMTemplate(campaign);
      let dmContent = templateResult.message.replace(
        /\{\{username\}\}/g,
        commenterUsername,
      );
      if (campaign.dmLink) dmContent += `\n\n${campaign.dmLink}`;

      let dmResult;
      if (isTest) {
        dmResult = {
          success: true,
          data: { message_id: `test_${Date.now()}` },
        };
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
          `DM ${isTest ? "simulated" : "sent"} to @${commenterUsername}`,
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

    await processCampaignMatch({
      campaign,
      account,
      commentId: `test_${Date.now()}`,
      commentText,
      commenterId: `test_user_${Date.now()}`,
      commenterUsername: username,
      isTest: true,
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
