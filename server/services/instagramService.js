import axios from "axios";
import env from "../config/env.js";
import logger from "../utils/logger.js";

const GRAPH_API = "https://graph.facebook.com/v21.0";
const INSTAGRAM_API = "https://graph.instagram.com/v21.0";

export const getLoginUrl = (userId) => {
  const scopes = [
    "instagram_basic",
    "instagram_manage_comments",
    "instagram_manage_messages",
    "pages_show_list",
    "pages_read_engagement",
    "business_management",
  ].join(",");

  const params = new URLSearchParams({
    client_id: env.FB_APP_ID,
    redirect_uri: env.FB_REDIRECT_URI,
    scope: scopes,
    response_type: "code",
    state: userId,
  });

  return `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`;
};

export const exchangeCodeForToken = async (code) => {
  const response = await axios.get(`${GRAPH_API}/oauth/access_token`, {
    params: {
      client_id: env.FB_APP_ID,
      client_secret: env.FB_APP_SECRET,
      redirect_uri: env.FB_REDIRECT_URI,
      code,
    },
  });
  return response.data;
};

export const getLongLivedToken = async (shortToken) => {
  const response = await axios.get(`${GRAPH_API}/oauth/access_token`, {
    params: {
      grant_type: "fb_exchange_token",
      client_id: env.FB_APP_ID,
      client_secret: env.FB_APP_SECRET,
      fb_exchange_token: shortToken,
    },
  });
  return response.data;
};

export const getUserPages = async (accessToken) => {
  const response = await axios.get(`${GRAPH_API}/me/accounts`, {
    params: {
      access_token: accessToken,
      fields: "id,name,access_token,instagram_business_account",
    },
  });
  return response.data.data;
};

export const getInstagramAccount = async (igAccountId, accessToken) => {
  const response = await axios.get(`${GRAPH_API}/${igAccountId}`, {
    params: {
      access_token: accessToken,
      fields:
        "id,username,name,profile_picture_url,followers_count,media_count",
    },
  });
  return response.data;
};

export const getInstagramPosts = async (
  igAccountId,
  accessToken,
  after = null,
) => {
  const params = {
    access_token: accessToken,
    fields:
      "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count",
    limit: 25,
  };

  if (after) params.after = after;

  const response = await axios.get(`${GRAPH_API}/${igAccountId}/media`, {
    params,
  });

  return response.data;
};

export const getPostComments = async (postId, accessToken) => {
  const response = await axios.get(`${GRAPH_API}/${postId}/comments`, {
    params: {
      access_token: accessToken,
      fields: "id,text,username,timestamp,from{id,username}",
      limit: 100,
    },
  });
  return response.data;
};

export const sendInstagramDM = async (
  igUserId,
  recipientId,
  message,
  accessToken,
  commentId = null,
) => {
  try {
    logger.info(
      `Sending DM: recipient=${recipientId}, commentId=${commentId}, msgLength=${message?.length}`,
    );

    const recipient = commentId
      ? { comment_id: commentId }
      : { id: recipientId };

    const response = await axios.post(
      `${INSTAGRAM_API}/me/messages`,
      {
        recipient,
        message: { text: message },
      },
      {
        params: { access_token: accessToken },
        headers: { "Content-Type": "application/json" },
      },
    );

    logger.info(`DM sent. Message ID: ${response.data.message_id}`);

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    const errorMessage =
      error.response?.data?.error?.message ||
      error.response?.data?.error?.error_user_msg ||
      error.message;

    const errorCode = error.response?.data?.error?.code;
    const errorSubcode = error.response?.data?.error?.error_subcode;

    logger.error(
      `DM failed: ${errorMessage} (code: ${errorCode}, subcode: ${errorSubcode})`,
    );

    return {
      success: false,
      error: errorMessage,
      errorCode,
      errorSubcode,
    };
  }
};

export const sendDMWithButton = async (
  igUserId,
  recipientId,
  message,
  buttonText,
  buttonUrl,
  accessToken,
  commentId = null,
) => {
  try {
    logger.info(
      `Sending button DM: recipient=${recipientId}, url=${buttonUrl}`,
    );

    const recipient = commentId
      ? { comment_id: commentId }
      : { id: recipientId };

    const payload = {
      recipient,
      message: {
        attachment: {
          type: "template",
          payload: {
            template_type: "button",
            text: message,
            buttons: [
              {
                type: "web_url",
                url: buttonUrl,
                title: buttonText,
              },
            ],
          },
        },
      },
    };

    const response = await axios.post(`${INSTAGRAM_API}/me/messages`, payload, {
      params: { access_token: accessToken },
      headers: { "Content-Type": "application/json" },
    });

    logger.info(`Button DM sent. Message ID: ${response.data.message_id}`);

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    const errorMessage =
      error.response?.data?.error?.message ||
      error.response?.data?.error?.error_user_msg ||
      error.message;

    const errorCode = error.response?.data?.error?.code;
    const errorSubcode = error.response?.data?.error?.error_subcode;

    logger.error(
      `Button DM failed: ${errorMessage} (code: ${errorCode}, subcode: ${errorSubcode})`,
    );

    return {
      success: false,
      error: errorMessage,
      errorCode,
      errorSubcode,
    };
  }
};

export const replyToComment = async (commentId, message, accessToken) => {
  try {
    logger.info(`Replying to comment: ${commentId}`);

    const response = await axios.post(
      `${INSTAGRAM_API}/${commentId}/replies`,
      { message },
      {
        params: { access_token: accessToken },
        headers: { "Content-Type": "application/json" },
      },
    );

    logger.info(`Comment reply sent. ID: ${response.data.id || "unknown"}`);

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    const errorMessage =
      error.response?.data?.error?.message ||
      error.response?.data?.error?.error_user_msg ||
      error.message;

    const errorCode = error.response?.data?.error?.code;

    logger.error(`Reply failed: ${errorMessage} (code: ${errorCode})`);

    return {
      success: false,
      error: errorMessage,
      errorCode,
    };
  }
};

export const subscribeWebhook = async (pageId, pageAccessToken) => {
  try {
    const response = await axios.post(
      `${GRAPH_API}/${pageId}/subscribed_apps`,
      {
        subscribed_fields: "messages,messaging_postbacks,feed",
      },
      {
        params: { access_token: pageAccessToken },
      },
    );
    logger.info(`Page webhook subscribed for page: ${pageId}`);
    return response.data;
  } catch (error) {
    logger.error(
      `Page webhook subscription failed for page ${pageId}`,
      error.response?.data,
    );
    throw error;
  }
};

export const subscribeInstagramWebhook = async (
  igAccountId,
  pageAccessToken,
) => {
  try {
    const response = await axios.post(
      `${GRAPH_API}/${igAccountId}/subscribed_apps`,
      {
        subscribed_fields:
          "comments,messages,mentions,message_reactions,messaging_postbacks",
      },
      {
        params: { access_token: pageAccessToken },
      },
    );
    logger.info(`Instagram webhook subscribed for IG: ${igAccountId}`);
    return response.data;
  } catch (error) {
    logger.error(
      `Instagram webhook subscription failed for IG ${igAccountId}`,
      error.response?.data,
    );
    throw error;
  }
};

export const getAccountDetails = async (igAccountId, accessToken) => {
  const response = await axios.get(`${GRAPH_API}/${igAccountId}`, {
    params: {
      access_token: accessToken,
      fields:
        "id,username,name,profile_picture_url,followers_count,media_count,biography,website",
    },
  });
  return response.data;
};

export const getDelayMilliseconds = (delayType) => {
  const ranges = {
    instant: [0, 0],
    short: [2000, 5000],
    medium: [5000, 15000],
    long: [15000, 30000],
  };
  const range = ranges[delayType] || ranges.short;
  const [min, max] = range;
  if (min === 0 && max === 0) return 0;
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const pickDMTemplate = (campaign) => {
  const templates = campaign.dmTemplates || [];

  if (templates.length === 0) {
    return {
      message: campaign.dmMessage,
      index: -1,
    };
  }

  if (templates.length === 1) {
    return {
      message: templates[0].message,
      index: 0,
    };
  }

  if (campaign.templateRotation === "sequential") {
    const nextIndex = (campaign.lastTemplateIndex + 1) % templates.length;
    return {
      message: templates[nextIndex].message,
      index: nextIndex,
    };
  }

  const randomIndex = Math.floor(Math.random() * templates.length);
  return {
    message: templates[randomIndex].message,
    index: randomIndex,
  };
};

export const sendDMWithLinkFallback = async ({
  igUserId,
  recipientId,
  message,
  link,
  accessToken,
  commentId = null,
  linkDeliveryMode = "no_https",
}) => {
  const {
    buildMessageWithLink,
    buildFallbackMessage,
    buildLastResortMessage,
    isLinkBlockedError,
  } = await import("../utils/linkHelper.js");

  const primaryMessage = buildMessageWithLink({
    baseMessage: message,
    link,
    linkDeliveryMode,
  });

  logger.info(
    `Attempting DM with link mode: ${linkDeliveryMode}, hasLink: ${!!link}`,
  );

  const firstAttempt = await sendInstagramDM(
    igUserId,
    recipientId,
    primaryMessage,
    accessToken,
    commentId,
  );

  if (firstAttempt.success) {
    return { ...firstAttempt, linkIncluded: !!link, mode: linkDeliveryMode };
  }

  const isLinkIssue = isLinkBlockedError(
    firstAttempt.errorCode,
    firstAttempt.errorSubcode,
    firstAttempt.error,
  );

  if (!isLinkIssue || !link) {
    return { ...firstAttempt, linkIncluded: false, mode: linkDeliveryMode };
  }

  logger.warn(
    `Link blocked. Trying fallback (no_https) for recipient ${recipientId}`,
  );

  const fallbackMessage = buildFallbackMessage({ baseMessage: message, link });

  const fallbackAttempt = await sendInstagramDM(
    igUserId,
    recipientId,
    fallbackMessage,
    accessToken,
    commentId,
  );

  if (fallbackAttempt.success) {
    logger.info("Fallback (no_https) sent successfully");
    return {
      ...fallbackAttempt,
      linkIncluded: true,
      mode: "fallback_no_https",
      wasBlocked: true,
    };
  }

  const stillBlocked = isLinkBlockedError(
    fallbackAttempt.errorCode,
    fallbackAttempt.errorSubcode,
    fallbackAttempt.error,
  );

  if (stillBlocked) {
    logger.warn("Fallback also blocked. Sending 'check bio' message");

    const lastResort = buildLastResortMessage({ baseMessage: message });

    const lastAttempt = await sendInstagramDM(
      igUserId,
      recipientId,
      lastResort,
      accessToken,
      commentId,
    );

    if (lastAttempt.success) {
      return {
        ...lastAttempt,
        linkIncluded: false,
        mode: "bio_fallback",
        wasBlocked: true,
      };
    }
  }

  return {
    ...fallbackAttempt,
    linkIncluded: false,
    mode: "failed",
    wasBlocked: true,
  };
};
