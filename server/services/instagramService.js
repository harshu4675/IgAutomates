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
    const recipient = commentId
      ? { comment_id: commentId }
      : { id: recipientId };

    logger.info(`Sending DM to ${recipientId}, commentId=${commentId}`);

    const response = await axios.post(
      `${INSTAGRAM_API}/me/messages`,
      { recipient, message: { text: message } },
      {
        params: { access_token: accessToken },
        headers: { "Content-Type": "application/json" },
      },
    );

    logger.info(`DM sent. ID: ${response.data.message_id}`);
    return { success: true, data: response.data };
  } catch (error) {
    const errorMessage = error.response?.data?.error?.message || error.message;
    const errorCode = error.response?.data?.error?.code;
    const errorSubcode = error.response?.data?.error?.error_subcode;
    logger.error(`DM failed: ${errorMessage} (${errorCode}/${errorSubcode})`);
    return { success: false, error: errorMessage, errorCode, errorSubcode };
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
    const recipient = commentId
      ? { comment_id: commentId }
      : { id: recipientId };

    logger.info(`Sending button DM to ${recipientId}`);

    const response = await axios.post(
      `${INSTAGRAM_API}/me/messages`,
      {
        recipient,
        message: {
          attachment: {
            type: "template",
            payload: {
              template_type: "button",
              text: message,
              buttons: [{ type: "web_url", url: buttonUrl, title: buttonText }],
            },
          },
        },
      },
      {
        params: { access_token: accessToken },
        headers: { "Content-Type": "application/json" },
      },
    );

    logger.info(`Button DM sent. ID: ${response.data.message_id}`);
    return { success: true, data: response.data };
  } catch (error) {
    const errorMessage = error.response?.data?.error?.message || error.message;
    const errorCode = error.response?.data?.error?.code;
    const errorSubcode = error.response?.data?.error?.error_subcode;
    logger.error(
      `Button DM failed: ${errorMessage} (${errorCode}/${errorSubcode})`,
    );
    return { success: false, error: errorMessage, errorCode, errorSubcode };
  }
};

export const replyToComment = async (commentId, message, accessToken) => {
  try {
    logger.info(`Replying to comment ${commentId}`);
    const response = await axios.post(
      `${INSTAGRAM_API}/${commentId}/replies`,
      { message },
      {
        params: { access_token: accessToken },
        headers: { "Content-Type": "application/json" },
      },
    );
    logger.info(`Reply sent. ID: ${response.data.id}`);
    return { success: true, data: response.data };
  } catch (error) {
    const errorMessage = error.response?.data?.error?.message || error.message;
    logger.error(`Reply failed: ${errorMessage}`);
    return { success: false, error: errorMessage };
  }
};

export const subscribeWebhook = async (pageId, pageAccessToken) => {
  try {
    const response = await axios.post(
      `${GRAPH_API}/${pageId}/subscribed_apps`,
      { subscribed_fields: "messages,messaging_postbacks,feed" },
      { params: { access_token: pageAccessToken } },
    );
    logger.info(`Page webhook subscribed: ${pageId}`);
    return response.data;
  } catch (error) {
    logger.error(`Page webhook failed: ${pageId}`, error.response?.data);
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
      { subscribed_fields: "comments,messages,mentions,messaging_postbacks" },
      { params: { access_token: pageAccessToken } },
    );
    logger.info(`IG webhook subscribed: ${igAccountId}`);
    return response.data;
  } catch (error) {
    logger.error(`IG webhook failed: ${igAccountId}`, error.response?.data);
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
  const [min, max] = ranges[delayType] || ranges.short;
  if (min === 0 && max === 0) return 0;
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const pickDMTemplate = (campaign) => {
  const templates = campaign.dmTemplates || [];
  if (templates.length === 0) return { message: campaign.dmMessage, index: -1 };
  if (templates.length === 1)
    return { message: templates[0].message, index: 0 };

  if (campaign.templateRotation === "sequential") {
    const nextIndex = (campaign.lastTemplateIndex + 1) % templates.length;
    return { message: templates[nextIndex].message, index: nextIndex };
  }

  const randomIndex = Math.floor(Math.random() * templates.length);
  return { message: templates[randomIndex].message, index: randomIndex };
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
    buildBioFallbackMessage,
    isLinkBlockedError,
  } = await import("../utils/linkHelper.js");

  const primaryMsg = buildMessageWithLink({
    baseMessage: message,
    link,
    linkDeliveryMode,
  });

  const attempt1 = await sendInstagramDM(
    igUserId,
    recipientId,
    primaryMsg,
    accessToken,
    commentId,
  );
  if (attempt1.success)
    return { ...attempt1, linkIncluded: !!link, mode: linkDeliveryMode };

  if (
    !link ||
    !isLinkBlockedError(
      attempt1.errorCode,
      attempt1.errorSubcode,
      attempt1.error,
    )
  ) {
    return { ...attempt1, linkIncluded: false, mode: linkDeliveryMode };
  }

  logger.warn("Link blocked. Trying no_https fallback");
  const fallbackMsg = buildFallbackMessage({ baseMessage: message, link });
  const attempt2 = await sendInstagramDM(
    igUserId,
    recipientId,
    fallbackMsg,
    accessToken,
    commentId,
  );
  if (attempt2.success)
    return {
      ...attempt2,
      linkIncluded: true,
      mode: "fallback_no_https",
      wasBlocked: true,
    };

  if (
    isLinkBlockedError(
      attempt2.errorCode,
      attempt2.errorSubcode,
      attempt2.error,
    )
  ) {
    logger.warn("Still blocked. Sending bio message");
    const bioMsg = buildBioFallbackMessage({ baseMessage: message });
    const attempt3 = await sendInstagramDM(
      igUserId,
      recipientId,
      bioMsg,
      accessToken,
      commentId,
    );
    if (attempt3.success)
      return {
        ...attempt3,
        linkIncluded: false,
        mode: "bio_fallback",
        wasBlocked: true,
      };
  }

  return { ...attempt2, linkIncluded: false, mode: "failed", wasBlocked: true };
};
