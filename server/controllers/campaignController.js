import Campaign from "../models/Campaign.js";
import InstagramAccount from "../models/InstagramAccount.js";
import Analytics from "../models/Analytics.js";
import DMHistory from "../models/DMHistory.js";
import {
  successResponse,
  errorResponse,
  paginatedResponse,
} from "../utils/apiResponse.js";
import logger from "../utils/logger.js";

const normalizeKeywords = (keywords, keyword) => {
  let list = [];
  if (Array.isArray(keywords)) list = keywords;
  else if (typeof keywords === "string" && keywords.trim())
    list = keywords.split(",");
  else if (typeof keyword === "string" && keyword.trim()) list = [keyword];

  return list
    .map((k) => String(k).toLowerCase().trim())
    .filter((k) => k.length > 0);
};

const normalizeTemplates = (templates) => {
  if (!Array.isArray(templates)) return [];
  return templates
    .filter(
      (t) =>
        t &&
        typeof t === "object" &&
        typeof t.message === "string" &&
        t.message.trim().length >= 10,
    )
    .map((t) => ({
      message: t.message.trim(),
      timesUsed: typeof t.timesUsed === "number" ? t.timesUsed : 0,
    }));
};

const normalizeSchedule = (schedule) => {
  if (!schedule || typeof schedule !== "object") return null;

  const validDays = Array.isArray(schedule.activeDays)
    ? schedule.activeDays
        .map((d) => Number(d))
        .filter((d) => !isNaN(d) && d >= 0 && d <= 6)
    : [0, 1, 2, 3, 4, 5, 6];

  const parseDate = (val) => {
    if (!val || val === "" || val === "null" || val === "undefined")
      return null;
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return null;
      return d;
    } catch {
      return null;
    }
  };

  return {
    enabled: Boolean(schedule.enabled),
    startDate: parseDate(schedule.startDate),
    endDate: parseDate(schedule.endDate),
    activeHoursStart:
      typeof schedule.activeHoursStart === "string" &&
      schedule.activeHoursStart.trim()
        ? schedule.activeHoursStart
        : "00:00",
    activeHoursEnd:
      typeof schedule.activeHoursEnd === "string" &&
      schedule.activeHoursEnd.trim()
        ? schedule.activeHoursEnd
        : "23:59",
    activeDays: validDays.length > 0 ? validDays : [0, 1, 2, 3, 4, 5, 6],
    timezone:
      typeof schedule.timezone === "string" && schedule.timezone.trim()
        ? schedule.timezone
        : "UTC",
  };
};

const normalizeRateLimits = (rateLimits) => {
  if (!rateLimits || typeof rateLimits !== "object") return null;
  return {
    enabled: Boolean(rateLimits.enabled),
    maxPerHour: Math.max(
      1,
      Math.min(1000, Number(rateLimits.maxPerHour) || 40),
    ),
    maxPerDay: Math.max(
      1,
      Math.min(10000, Number(rateLimits.maxPerDay) || 200),
    ),
    userCooldownMinutes: 0,
    skipRepeatUsers: false,
    repeatUserHours: 24,
  };
};

const normalizeFollowFlow = (followFlow) => {
  if (!followFlow || typeof followFlow !== "object") return null;

  return {
    enabled: Boolean(followFlow.enabled),
    profileUrl:
      typeof followFlow.profileUrl === "string"
        ? followFlow.profileUrl.trim()
        : "",
    followerMessage:
      typeof followFlow.followerMessage === "string" &&
      followFlow.followerMessage.trim()
        ? followFlow.followerMessage.trim()
        : "Thanks for commenting! Here's your resource:",
    nonFollowerMessage:
      typeof followFlow.nonFollowerMessage === "string" &&
      followFlow.nonFollowerMessage.trim()
        ? followFlow.nonFollowerMessage.trim()
        : "Hey! Please follow us to get the resource. Tap the button below:",
    followButtonText:
      typeof followFlow.followButtonText === "string" &&
      followFlow.followButtonText.trim()
        ? followFlow.followButtonText.trim().substring(0, 20)
        : "Follow Us",
    afterFollowMessage:
      typeof followFlow.afterFollowMessage === "string" &&
      followFlow.afterFollowMessage.trim()
        ? followFlow.afterFollowMessage.trim()
        : "Awesome! Thanks for following. Here's your resource:",
    retryMessage:
      typeof followFlow.retryMessage === "string" &&
      followFlow.retryMessage.trim()
        ? followFlow.retryMessage.trim()
        : "Still not following? Tap the button and follow us to unlock the resource!",
    maxRetries: Math.max(1, Math.min(10, Number(followFlow.maxRetries) || 3)),
  };
};

export const getCampaigns = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const query = { user: req.user._id };
    if (req.query.active === "true") query.isActive = true;

    const total = await Campaign.countDocuments(query);
    const campaigns = await Campaign.find(query)
      .populate("instagramAccount", "igUsername profilePicture")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const campaignsClean = campaigns.map((c) => {
      const {
        processedComments,
        pendingFollowUsers,
        pendingFollowChecks,
        verifiedFollowers,
        ...rest
      } = c;
      return {
        ...rest,
        verifiedFollowersCount: Array.isArray(verifiedFollowers)
          ? verifiedFollowers.length
          : 0,
      };
    });

    return paginatedResponse(res, 200, "Campaigns retrieved", campaignsClean, {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    });
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

    if (!campaign) return errorResponse(res, 404, "Campaign not found");

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
      keywords,
      matchType,
      dmMessage,
      dmTemplates,
      templateRotation,
      dmLink,
      requireFollow,
      followMessage,
      followFlow,
      publicReply,
      dmDelay,
      rateLimits,
      schedule,
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

    const finalMatchType = matchType || "contains";
    const keywordsList = normalizeKeywords(keywords, keyword);

    if (finalMatchType !== "any" && keywordsList.length === 0) {
      return errorResponse(res, 400, "At least one keyword is required");
    }

    if (finalMatchType !== "any" && keywordsList.length > 0) {
      const existingCampaign = await Campaign.findOne({
        user: req.user._id,
        igPostId,
        keywords: { $in: keywordsList },
      });

      if (existingCampaign) {
        return errorResponse(
          res,
          400,
          "A campaign with one of these keywords already exists for this post",
        );
      }
    }

    const campaignData = {
      user: req.user._id,
      instagramAccount,
      name,
      igPostId,
      igPostUrl: igPostUrl || "",
      igPostThumbnail: igPostThumbnail || "",
      igPostCaption: igPostCaption || "",
      igPostType: igPostType || "IMAGE",
      keywords: keywordsList,
      keyword: keywordsList[0] || "",
      matchType: finalMatchType,
      dmMessage,
      dmLink: dmLink || "",
      requireFollow: Boolean(requireFollow),
      dmDelay: dmDelay || "short",
      templateRotation: templateRotation || "random",
    };

    const cleanTemplates = normalizeTemplates(dmTemplates);
    if (cleanTemplates.length > 0) {
      campaignData.dmTemplates = cleanTemplates;
    }

    if (followMessage && typeof followMessage === "string") {
      campaignData.followMessage = followMessage.trim();
    }

    const cleanFollowFlow = normalizeFollowFlow(followFlow);
    if (cleanFollowFlow) {
      if (cleanFollowFlow.enabled && !cleanFollowFlow.profileUrl) {
        return errorResponse(
          res,
          400,
          "Instagram profile URL is required when Follow Flow is enabled",
        );
      }
      campaignData.followFlow = cleanFollowFlow;
    }

    if (publicReply && typeof publicReply === "object") {
      campaignData.publicReply = {
        enabled: Boolean(publicReply.enabled),
        message:
          publicReply.message && typeof publicReply.message === "string"
            ? publicReply.message.trim()
            : "Check your DMs!",
      };
    }

    const cleanRateLimits = normalizeRateLimits(rateLimits);
    if (cleanRateLimits) campaignData.rateLimits = cleanRateLimits;

    const cleanSchedule = normalizeSchedule(schedule);
    if (cleanSchedule) campaignData.schedule = cleanSchedule;

    const campaign = await Campaign.create(campaignData);
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
      "keywords",
      "matchType",
      "dmMessage",
      "dmTemplates",
      "templateRotation",
      "dmLink",
      "isActive",
      "requireFollow",
      "followMessage",
      "followFlow",
      "publicReply",
      "dmDelay",
      "rateLimits",
      "schedule",
    ];
    const updates = {};

    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (updates.keywords !== undefined || updates.keyword !== undefined) {
      const list = normalizeKeywords(updates.keywords, updates.keyword);
      updates.keywords = list;
      updates.keyword = list[0] || "";
    }

    if (updates.dmTemplates !== undefined) {
      updates.dmTemplates = normalizeTemplates(updates.dmTemplates);
    }

    if (updates.publicReply && typeof updates.publicReply === "object") {
      updates.publicReply = {
        enabled: Boolean(updates.publicReply.enabled),
        message:
          updates.publicReply.message &&
          typeof updates.publicReply.message === "string"
            ? updates.publicReply.message.trim()
            : "Check your DMs!",
      };
    }

    if (updates.rateLimits !== undefined) {
      const clean = normalizeRateLimits(updates.rateLimits);
      if (clean) updates.rateLimits = clean;
      else delete updates.rateLimits;
    }

    if (updates.schedule !== undefined) {
      const clean = normalizeSchedule(updates.schedule);
      if (clean) updates.schedule = clean;
      else delete updates.schedule;
    }

    if (updates.followFlow !== undefined) {
      const clean = normalizeFollowFlow(updates.followFlow);
      if (clean) {
        if (clean.enabled && !clean.profileUrl) {
          return errorResponse(
            res,
            400,
            "Instagram profile URL is required when Follow Flow is enabled",
          );
        }
        updates.followFlow = clean;
      } else {
        delete updates.followFlow;
      }
    }

    const campaign = await Campaign.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updates,
      { new: true, runValidators: true },
    );

    if (!campaign) return errorResponse(res, 404, "Campaign not found");

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

    if (!campaign) return errorResponse(res, 404, "Campaign not found");

    await Analytics.deleteMany({ campaign: campaign._id });
    await DMHistory.deleteMany({ campaign: campaign._id });

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

    if (!campaign) return errorResponse(res, 404, "Campaign not found");

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

export const duplicateCampaign = async (req, res, next) => {
  try {
    const original = await Campaign.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).lean();

    if (!original) return errorResponse(res, 404, "Campaign not found");

    const {
      _id,
      createdAt,
      updatedAt,
      stats,
      processedComments,
      pendingFollowUsers,
      pendingFollowChecks,
      verifiedFollowers,
      rateLimitCounters,
      lastTemplateIndex,
      __v,
      ...rest
    } = original;

    const clone = await Campaign.create({
      ...rest,
      name: `${rest.name} (Copy)`,
      isActive: false,
    });

    return successResponse(res, 201, "Campaign duplicated", clone);
  } catch (error) {
    next(error);
  }
};
