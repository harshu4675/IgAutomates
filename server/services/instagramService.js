import axios from "axios";
import env from "../config/env.js";
import logger from "../utils/logger.js";

const GRAPH_API = "https://graph.facebook.com/v21.0";

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

  if (after) {
    params.after = after;
  }

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
  pageAccessToken,
  commentId = null,
) => {
  try {
    logger.info(
      `Attempting to send DM: igUser=${igUserId}, recipient=${recipientId}, commentId=${commentId}`,
    );

    // If commentId provided, use Private Reply (comment_id)
    // Otherwise fall back to regular DM (id) - only works in 24hr window
    const recipient = commentId
      ? { comment_id: commentId }
      : { id: recipientId };

    logger.info(`Using recipient format: ${JSON.stringify(recipient)}`);

    const response = await axios.post(
      `${GRAPH_API}/${igUserId}/messages`,
      {
        recipient,
        message: { text: message },
      },
      {
        params: { access_token: pageAccessToken },
        headers: { "Content-Type": "application/json" },
      },
    );

    logger.info(
      `DM sent successfully. Message ID: ${response.data.message_id}`,
    );

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
      `DM send failed: ${errorMessage} (code: ${errorCode}, subcode: ${errorSubcode})`,
    );
    logger.error(
      `Full error response: ${JSON.stringify(error.response?.data || {}).substring(0, 500)}`,
    );

    return {
      success: false,
      error: errorMessage,
      errorCode,
      errorSubcode,
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
        subscribed_fields: "comments,messages,mentions",
      },
      {
        params: { access_token: pageAccessToken },
      },
    );
    logger.info(`Instagram webhook subscribed for IG account: ${igAccountId}`);
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
