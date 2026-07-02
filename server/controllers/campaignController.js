import Campaign from "../models/Campaign.js";
import InstagramAccount from "../models/InstagramAccount.js";
import Analytics from "../models/Analytics.js";
import {
  successResponse,
  errorResponse,
  paginatedResponse,
} from "../utils/apiResponse.js";
import logger from "../utils/logger.js";

export const getCampaigns = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const query = { user: req.user._id };

    if (req.query.active === "true") {
      query.isActive = true;
    }

    const total = await Campaign.countDocuments(query);
    const campaigns = await Campaign.find(query)
      .populate("instagramAccount", "igUsername profilePicture")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const campaignsWithoutProcessed = campaigns.map((c) => {
      const { processedComments, ...rest } = c;
      return rest;
    });

    return paginatedResponse(
      res,
      200,
      "Campaigns retrieved",
      campaignsWithoutProcessed,
      {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    );
  } catch (error) {
    next(error);
  }
};

export const getCampaign = async (req, res, next) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).populate("instagramAccount", "igUsername profilePicture");

    if (!campaign) {
      return errorResponse(res, 404, "Campaign not found");
    }

    return successResponse(res, 200, "Campaign retrieved", campaign);
  } catch (error) {
    next(error);
  }
};

export const createCampaign = async (req, res, next) => {
  try {
    const {
      instagramAccount,
      name,
      igPostId,
      igPostUrl,
      igPostThumbnail,
      igPostCaption,
      igPostType,
      keyword,
      matchType,
      dmMessage,
      dmLink,
    } = req.body;

    const account = await InstagramAccount.findOne({
      _id: instagramAccount,
      user: req.user._id,
      isConnected: true,
    });

    if (!account) {
      return errorResponse(
        res,
        404,
        "Instagram account not found or not connected",
      );
    }

    const existingCampaign = await Campaign.findOne({
      user: req.user._id,
      igPostId,
      keyword: keyword.toLowerCase().trim(),
    });

    if (existingCampaign) {
      return errorResponse(
        res,
        400,
        "A campaign with this keyword already exists for this post",
      );
    }

    const campaign = await Campaign.create({
      user: req.user._id,
      instagramAccount,
      name,
      igPostId,
      igPostUrl: igPostUrl || "",
      igPostThumbnail: igPostThumbnail || "",
      igPostCaption: igPostCaption || "",
      igPostType: igPostType || "IMAGE",
      keyword: keyword.toLowerCase().trim(),
      matchType: matchType || "contains",
      dmMessage,
      dmLink: dmLink || "",
    });

    logger.info(`Campaign created: "${name}" by user ${req.user._id}`);

    return successResponse(res, 201, "Campaign created", campaign);
  } catch (error) {
    next(error);
  }
};

export const updateCampaign = async (req, res, next) => {
  try {
    const allowed = [
      "name",
      "keyword",
      "matchType",
      "dmMessage",
      "dmLink",
      "isActive",
    ];
    const updates = {};

    allowed.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] =
          field === "keyword"
            ? req.body[field].toLowerCase().trim()
            : req.body[field];
      }
    });

    const campaign = await Campaign.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updates,
      { new: true, runValidators: true },
    );

    if (!campaign) {
      return errorResponse(res, 404, "Campaign not found");
    }

    return successResponse(res, 200, "Campaign updated", campaign);
  } catch (error) {
    next(error);
  }
};

export const deleteCampaign = async (req, res, next) => {
  try {
    const campaign = await Campaign.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!campaign) {
      return errorResponse(res, 404, "Campaign not found");
    }

    await Analytics.deleteMany({ campaign: campaign._id });

    return successResponse(res, 200, "Campaign deleted");
  } catch (error) {
    next(error);
  }
};

export const toggleCampaign = async (req, res, next) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!campaign) {
      return errorResponse(res, 404, "Campaign not found");
    }

    campaign.isActive = !campaign.isActive;
    await campaign.save();

    return successResponse(
      res,
      200,
      `Campaign ${campaign.isActive ? "activated" : "paused"}`,
      campaign,
    );
  } catch (error) {
    next(error);
  }
};
