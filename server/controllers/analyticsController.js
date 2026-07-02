import Analytics from "../models/Analytics.js";
import Campaign from "../models/Campaign.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";

export const getOverview = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date(Date.now() - days * 86400000);

    const campaigns = await Campaign.find({ user: req.user._id });

    const totalDMs = campaigns.reduce(
      (sum, c) => sum + (c.stats?.dmsSent || 0),
      0,
    );
    const totalMatches = campaigns.reduce(
      (sum, c) => sum + (c.stats?.keywordMatches || 0),
      0,
    );
    const totalFailed = campaigns.reduce(
      (sum, c) => sum + (c.stats?.dmsFailed || 0),
      0,
    );
    const totalComments = campaigns.reduce(
      (sum, c) => sum + (c.stats?.totalComments || 0),
      0,
    );
    const activeCampaigns = campaigns.filter((c) => c.isActive).length;

    const deliveryRate =
      totalDMs > 0
        ? (((totalDMs - totalFailed) / totalDMs) * 100).toFixed(1)
        : 0;

    const matchRate =
      totalComments > 0 ? ((totalMatches / totalComments) * 100).toFixed(1) : 0;

    const dailyStatsRaw = await Analytics.aggregate([
      {
        $match: {
          user: req.user._id,
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            event: "$event",
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.date": 1 } },
    ]);

    const dailyMap = {};
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split("T")[0];
      dailyMap[key] = {
        date: key,
        commentsReceived: 0,
        keywordsMatched: 0,
        dmsSent: 0,
        dmsFailed: 0,
      };
    }

    dailyStatsRaw.forEach((item) => {
      const dateKey = item._id.date;
      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = {
          date: dateKey,
          commentsReceived: 0,
          keywordsMatched: 0,
          dmsSent: 0,
          dmsFailed: 0,
        };
      }

      const eventKey = {
        comment_received: "commentsReceived",
        keyword_matched: "keywordsMatched",
        dm_sent: "dmsSent",
        dm_failed: "dmsFailed",
      }[item._id.event];

      if (eventKey) {
        dailyMap[dateKey][eventKey] = item.count;
      }
    });

    const dailyStats = Object.values(dailyMap).sort((a, b) =>
      a.date.localeCompare(b.date),
    );

    const topCampaigns = campaigns
      .sort((a, b) => (b.stats?.dmsSent || 0) - (a.stats?.dmsSent || 0))
      .slice(0, 5)
      .map((c) => ({
        _id: c._id,
        name: c.name,
        keyword: c.keyword,
        dmsSent: c.stats?.dmsSent || 0,
        matches: c.stats?.keywordMatches || 0,
        isActive: c.isActive,
        thumbnail: c.igPostThumbnail,
      }));

    return successResponse(res, 200, "Analytics overview", {
      totalDMs,
      totalMatches,
      totalFailed,
      totalComments,
      activeCampaigns,
      totalCampaigns: campaigns.length,
      deliveryRate: parseFloat(deliveryRate),
      matchRate: parseFloat(matchRate),
      dailyStats,
      topCampaigns,
    });
  } catch (error) {
    next(error);
  }
};

export const getRecentActivity = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const eventType = req.query.event;

    const query = { user: req.user._id };
    if (eventType) {
      query.event = eventType;
    }

    const events = await Analytics.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("campaign", "name keyword igPostThumbnail")
      .lean();

    return successResponse(res, 200, "Recent activity", events);
  } catch (error) {
    next(error);
  }
};

export const getCampaignStats = async (req, res, next) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).populate("instagramAccount", "igUsername profilePicture");

    if (!campaign) {
      return errorResponse(res, 404, "Campaign not found");
    }

    const days = parseInt(req.query.days) || 30;
    const startDate = new Date(Date.now() - days * 86400000);

    const events = await Analytics.find({
      campaign: campaign._id,
      createdAt: { $gte: startDate },
    })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    const dailyStatsRaw = await Analytics.aggregate([
      {
        $match: {
          campaign: campaign._id,
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            event: "$event",
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.date": 1 } },
    ]);

    const dailyMap = {};
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split("T")[0];
      dailyMap[key] = {
        date: key,
        commentsReceived: 0,
        keywordsMatched: 0,
        dmsSent: 0,
        dmsFailed: 0,
      };
    }

    dailyStatsRaw.forEach((item) => {
      const dateKey = item._id.date;
      if (!dailyMap[dateKey]) return;
      const eventKey = {
        comment_received: "commentsReceived",
        keyword_matched: "keywordsMatched",
        dm_sent: "dmsSent",
        dm_failed: "dmsFailed",
      }[item._id.event];
      if (eventKey) dailyMap[dateKey][eventKey] = item.count;
    });

    const dailyStats = Object.values(dailyMap).sort((a, b) =>
      a.date.localeCompare(b.date),
    );

    return successResponse(res, 200, "Campaign stats", {
      campaign: {
        _id: campaign._id,
        name: campaign.name,
        keyword: campaign.keyword,
        matchType: campaign.matchType,
        isActive: campaign.isActive,
        igPostThumbnail: campaign.igPostThumbnail,
        igPostUrl: campaign.igPostUrl,
        igPostCaption: campaign.igPostCaption,
        instagramAccount: campaign.instagramAccount,
        stats: campaign.stats,
        createdAt: campaign.createdAt,
      },
      events,
      dailyStats,
    });
  } catch (error) {
    next(error);
  }
};

export const getHourlyDistribution = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const startDate = new Date(Date.now() - days * 86400000);

    const hourlyData = await Analytics.aggregate([
      {
        $match: {
          user: req.user._id,
          event: "dm_sent",
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: { $hour: "$createdAt" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const hourlyMap = {};
    for (let i = 0; i < 24; i++) {
      hourlyMap[i] = 0;
    }
    hourlyData.forEach((item) => {
      hourlyMap[item._id] = item.count;
    });

    const hourlyStats = Object.entries(hourlyMap).map(([hour, count]) => ({
      hour: parseInt(hour),
      count,
    }));

    return successResponse(res, 200, "Hourly distribution", hourlyStats);
  } catch (error) {
    next(error);
  }
};
