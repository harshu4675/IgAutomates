import InstagramAccount from "../models/InstagramAccount.js";
import {
  getLoginUrl,
  exchangeCodeForToken,
  getLongLivedToken,
  getUserPages,
  getInstagramAccount,
  getInstagramPosts,
  subscribeWebhook,
} from "../services/instagramService.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import env from "../config/env.js";
import logger from "../utils/logger.js";

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

    if (!code) {
      return res.redirect(`${env.CLIENT_URL}/dashboard?ig_error=no_code`);
    }

    if (!state) {
      return res.redirect(`${env.CLIENT_URL}/dashboard?ig_error=no_user`);
    }

    const userId = state;

    const tokenData = await exchangeCodeForToken(code);
    const longLivedData = await getLongLivedToken(tokenData.access_token);
    const pages = await getUserPages(longLivedData.access_token);

    if (!pages || pages.length === 0) {
      return res.redirect(`${env.CLIENT_URL}/dashboard?ig_error=no_pages`);
    }

    const pageWithIG = pages.find((p) => p.instagram_business_account);

    if (!pageWithIG) {
      return res.redirect(
        `${env.CLIENT_URL}/dashboard?ig_error=no_business_account`,
      );
    }

    const igAccountId = pageWithIG.instagram_business_account.id;
    const igData = await getInstagramAccount(
      igAccountId,
      pageWithIG.access_token,
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
    }

    try {
      await subscribeWebhook(pageWithIG.id, pageWithIG.access_token);
      account.webhookSubscribed = true;
      await account.save();
    } catch (err) {
      logger.warn(
        `Webhook subscription failed for ${igData.username}, but account connected`,
      );
    }

    logger.info(`Instagram connected: @${igData.username} for user ${userId}`);

    return res.redirect(`${env.CLIENT_URL}/dashboard?ig_connected=true`);
  } catch (error) {
    logger.error("Instagram callback error", error);
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
