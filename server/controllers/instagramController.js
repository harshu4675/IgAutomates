import InstagramAccount from "../models/InstagramAccount.js";
import {
  getLoginUrl,
  exchangeCodeForToken,
  getLongLivedToken,
  getUserPages,
  getInstagramAccount,
  getInstagramPosts,
  subscribeWebhook,
  subscribeInstagramWebhook,
} from "../services/instagramService.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import env from "../config/env.js";
import logger from "../utils/logger.js";
import axios from "axios";

const GRAPH_API = "https://graph.facebook.com/v21.0";

export const getAuthUrl = async (req, res, next) => {
  try {
    const url = getLoginUrl(req.user._id.toString());
    return successResponse(res, 200, "Auth URL generated", { url });
  } catch (error) {
    next(error);
  }
};

export const handleCallback = async (req, res, next) => {
  try {
    const { code, state } = req.query;

    logger.info(
      `OAuth callback received. Code: ${code ? "YES" : "NO"}, State: ${state}`,
    );

    if (!code) {
      logger.warn("No code in callback");
      return res.redirect(`${env.CLIENT_URL}/dashboard?ig_error=no_code`);
    }

    if (!state) {
      logger.warn("No state in callback");
      return res.redirect(`${env.CLIENT_URL}/dashboard?ig_error=no_user`);
    }

    const userId = state;

    logger.info("Exchanging code for token...");
    const tokenData = await exchangeCodeForToken(code);
    logger.info("Token received");

    logger.info("Getting long-lived token...");
    const longLivedData = await getLongLivedToken(tokenData.access_token);
    logger.info("Long-lived token received");

    logger.info("Fetching user pages...");
    let pages = [];
    try {
      pages = await getUserPages(longLivedData.access_token);
      logger.info(`Found ${pages.length} pages via /me/accounts`);
    } catch (err) {
      logger.error(
        "Error fetching pages via /me/accounts",
        err.response?.data || err.message,
      );
    }

    if (!pages || pages.length === 0) {
      logger.warn("No pages found, trying alternative method...");

      try {
        const meResponse = await axios.get(`${GRAPH_API}/me`, {
          params: {
            access_token: longLivedData.access_token,
            fields:
              "id,name,accounts{id,name,access_token,instagram_business_account}",
          },
        });

        logger.info(
          "Alternative /me response:",
          JSON.stringify(meResponse.data).substring(0, 500),
        );

        if (meResponse.data.accounts?.data?.length > 0) {
          pages = meResponse.data.accounts.data;
          logger.info(`Found ${pages.length} pages via /me?fields=accounts`);
        }
      } catch (err) {
        logger.error(
          "Alternative method also failed",
          err.response?.data || err.message,
        );
      }
    }

    if (!pages || pages.length === 0) {
      logger.warn("Still no pages found - checking permissions granted");

      try {
        const permsResponse = await axios.get(`${GRAPH_API}/me/permissions`, {
          params: { access_token: longLivedData.access_token },
        });
        logger.info("Granted permissions:", JSON.stringify(permsResponse.data));
      } catch (err) {
        logger.error("Failed to check permissions");
      }

      return res.redirect(`${env.CLIENT_URL}/dashboard?ig_error=no_pages`);
    }

    logger.info(`Total pages found: ${pages.length}`);
    pages.forEach((p, i) => {
      logger.info(
        `Page ${i + 1}: ${p.name} (ID: ${p.id}), Has IG: ${!!p.instagram_business_account}`,
      );
    });

    const pageWithIG = pages.find((p) => p.instagram_business_account);

    if (!pageWithIG) {
      logger.warn("No page with Instagram Business account found");
      return res.redirect(
        `${env.CLIENT_URL}/dashboard?ig_error=no_business_account`,
      );
    }

    logger.info(
      `Selected page: ${pageWithIG.name} with IG: ${pageWithIG.instagram_business_account.id}`,
    );

    const igAccountId = pageWithIG.instagram_business_account.id;
    const igData = await getInstagramAccount(
      igAccountId,
      pageWithIG.access_token,
    );

    logger.info(
      `Instagram data: @${igData.username}, followers: ${igData.followers_count}`,
    );

    let account = await InstagramAccount.findOne({
      user: userId,
      igUserId: igData.id,
    });

    if (account) {
      account.accessToken = longLivedData.access_token;
      account.pageAccessToken = pageWithIG.access_token;
      account.pageId = pageWithIG.id;
      account.igUsername = igData.username;
      account.igName = igData.name || "";
      account.profilePicture = igData.profile_picture_url || "";
      account.followersCount = igData.followers_count || 0;
      account.mediaCount = igData.media_count || 0;
      account.isConnected = true;
      account.tokenExpiry = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
      account.lastSynced = new Date();
      await account.save();
      logger.info("Existing account updated");
    } else {
      account = await InstagramAccount.create({
        user: userId,
        igUserId: igData.id,
        igUsername: igData.username,
        igName: igData.name || "",
        profilePicture: igData.profile_picture_url || "",
        accessToken: longLivedData.access_token,
        tokenExpiry: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        pageId: pageWithIG.id,
        pageAccessToken: pageWithIG.access_token,
        followersCount: igData.followers_count || 0,
        mediaCount: igData.media_count || 0,
      });
      logger.info("New account created");
    }

    try {
      await subscribeWebhook(pageWithIG.id, pageWithIG.access_token);

      await subscribeInstagramWebhook(igAccountId, pageWithIG.access_token);

      account.webhookSubscribed = true;
      await account.save();
      logger.info("Webhook subscribed for Page and Instagram");
    } catch (err) {
      logger.warn(
        `Webhook subscription failed but account connected: ${err.response?.data?.error?.message || err.message}`,
      );
      logger.warn(
        "Full error:",
        JSON.stringify(err.response?.data || {}).substring(0, 500),
      );
    }
    logger.info(
      `Instagram connected successfully: @${igData.username} for user ${userId}`,
    );

    return res.redirect(`${env.CLIENT_URL}/dashboard?ig_connected=true`);
  } catch (error) {
    logger.error(
      "Instagram callback error - FULL:",
      error.response?.data || error.message,
    );
    logger.error("Stack:", error.stack);
    return res.redirect(
      `${env.CLIENT_URL}/dashboard?ig_error=connection_failed`,
    );
  }
};

export const getConnectedAccounts = async (req, res, next) => {
  try {
    const accounts = await InstagramAccount.find({
      user: req.user._id,
      isConnected: true,
    });

    return successResponse(res, 200, "Connected accounts", accounts);
  } catch (error) {
    next(error);
  }
};

export const disconnectAccount = async (req, res, next) => {
  try {
    const account = await InstagramAccount.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!account) {
      return errorResponse(res, 404, "Account not found");
    }

    account.isConnected = false;
    account.accessToken = "";
    account.pageAccessToken = "";
    account.instagramUserToken = "";
    await account.save();

    return successResponse(res, 200, "Account disconnected");
  } catch (error) {
    next(error);
  }
};

export const fetchPosts = async (req, res, next) => {
  try {
    const account = await InstagramAccount.findOne({
      _id: req.params.accountId,
      user: req.user._id,
    }).select("+accessToken +pageAccessToken");

    if (!account) {
      return errorResponse(res, 404, "Account not found");
    }

    const after = req.query.after || null;
    const postsData = await getInstagramPosts(
      account.igUserId,
      account.pageAccessToken || account.accessToken,
      after,
    );

    return successResponse(res, 200, "Posts fetched", {
      posts: postsData.data || [],
      paging: postsData.paging || null,
    });
  } catch (error) {
    const errorMsg = error.response?.data?.error?.message || error.message;
    logger.error(`Fetch posts error: ${errorMsg}`);
    return errorResponse(res, 500, `Failed to fetch posts: ${errorMsg}`);
  }
};

export const saveInstagramUserToken = async (req, res, next) => {
  try {
    const { accountId, token } = req.body;

    if (!accountId || !token) {
      return errorResponse(res, 400, "accountId and token are required");
    }

    const account = await InstagramAccount.findOne({
      _id: accountId,
      user: req.user._id,
    });

    if (!account) {
      return errorResponse(res, 404, "Instagram account not found");
    }

    account.instagramUserToken = token;
    await account.save();

    logger.info(`Instagram User Token saved for @${account.igUsername}`);

    return successResponse(res, 200, "Instagram User Token saved successfully");
  } catch (error) {
    next(error);
  }
};

export const debugToken = async (req, res, next) => {
  try {
    const account = await InstagramAccount.findOne({
      user: req.user._id,
    }).select("+instagramUserToken +pageAccessToken +accessToken");

    if (!account) {
      return errorResponse(res, 404, "Account not found");
    }

    const igToken = account.instagramUserToken || "";
    const pageToken = account.pageAccessToken || "";

    return successResponse(res, 200, "Debug info", {
      hasInstagramToken: !!igToken,
      instagramTokenLength: igToken.length,
      instagramTokenStart: igToken.substring(0, 10),
      instagramTokenEnd: igToken.substring(igToken.length - 10),
      hasSpaces: igToken.includes(" "),
      hasNewlines: igToken.includes("\n"),
      pageTokenLength: pageToken.length,
      pageTokenStart: pageToken.substring(0, 10),
    });
  } catch (error) {
    next(error);
  }
};
export const updateIgUserId = async (req, res, next) => {
  try {
    const { accountId, newIgUserId } = req.body;

    if (!accountId || !newIgUserId) {
      return errorResponse(res, 400, "accountId and newIgUserId are required");
    }

    const account = await InstagramAccount.findOne({
      _id: accountId,
      user: req.user._id,
    });

    if (!account) {
      return errorResponse(res, 404, "Instagram account not found");
    }

    const oldId = account.igUserId;
    account.igUserId = newIgUserId;
    await account.save();

    logger.info(
      `IG User ID updated for @${account.igUsername}: ${oldId} → ${newIgUserId}`,
    );

    return successResponse(res, 200, "Instagram User ID updated", {
      oldId,
      newId: newIgUserId,
    });
  } catch (error) {
    next(error);
  }
};
