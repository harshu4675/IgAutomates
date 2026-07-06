import Analytics from "../models/Analytics.js";
import Campaign from "../models/Campaign.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";

const parseDateRange = (req) => {
  const now = new Date();
  let startDate, endDate;

  if (req.query.startDate) {
    startDate = new Date(req.query.startDate);
  } else {
    const days = parseInt(req.query.days) || 30;
    startDate = new Date(now.getTime() - days * 86400000);
  }

  if (req.query.endDate) {
    endDate = new Date(req.query.endDate);
    endDate.setHours(23, 59, 59, 999);
  } else {
    endDate = now;
  }

  return { startDate, endDate };
};

const dateDiffInDays = (start, end) => {
  return Math.ceil((end - start) / 86400000);
};

export const getOverview = async (req, res, next) => {
  try {
    const { startDate, endDate } = parseDateRange(req);
    const days = Math.max(1, dateDiffInDays(startDate, endDate));

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
    const totalPublicReplies = campaigns.reduce(
      (sum, c) => sum + (c.stats?.publicRepliesSent || 0),
      0,
    );
    const totalFollowRequests = campaigns.reduce(
      (sum, c) => sum + (c.stats?.followRequests || 0),
      0,
    );
    const totalFollowConversions = campaigns.reduce(
      (sum, c) => sum + (c.stats?.followConversions || 0),
      0,
    );
    const totalRateLimitSkips = campaigns.reduce(
      (sum, c) => sum + (c.stats?.rateLimitSkips || 0),
      0,
    );
    const totalScheduleSkips = campaigns.reduce(
      (sum, c) => sum + (c.stats?.scheduleSkips || 0),
      0,
    );
    const activeCampaigns = campaigns.filter((c) => c.isActive).length;

    const deliveryRate =
      totalDMs > 0
        ? (((totalDMs - totalFailed) / totalDMs) * 100).toFixed(1)
        : 0;

    const matchRate =
      totalComments > 0 ? ((totalMatches / totalComments) * 100).toFixed(1) : 0;

    const followConversionRate =
      totalFollowRequests > 0
        ? ((totalFollowConversions / totalFollowRequests) * 100).toFixed(1)
        : 0;

    const dailyStatsRaw = await Analytics.aggregate([
      {
        $match: {
          user: req.user._id,
          createdAt: { $gte: startDate, $lte: endDate },
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
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const key = date.toISOString().split("T")[0];
      dailyMap[key] = {
        date: key,
        commentsReceived: 0,
        keywordsMatched: 0,
        dmsSent: 0,
        dmsFailed: 0,
        publicReplies: 0,
        followMessages: 0,
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
          publicReplies: 0,
          followMessages: 0,
        };
      }

      const eventKey = {
        comment_received: "commentsReceived",
        keyword_matched: "keywordsMatched",
        dm_sent: "dmsSent",
        dm_failed: "dmsFailed",
        public_reply_sent: "publicReplies",
        follow_message_sent: "followMessages",
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
        keywords: c.keywords,
        dmsSent: c.stats?.dmsSent || 0,
        matches: c.stats?.keywordMatches || 0,
        isActive: c.isActive,
        thumbnail: c.igPostThumbnail,
      }));

    const topKeywordsAgg = await Analytics.aggregate([
      {
        $match: {
          user: req.user._id,
          event: "keyword_matched",
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: "$metadata.matchedKeyword",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const topKeywords = topKeywordsAgg
      .filter((k) => k._id && k._id !== "any")
      .map((k) => ({ keyword: k._id, count: k.count }));

    return successResponse(res, 200, "Analytics overview", {
      dateRange: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        days,
      },
      totalDMs,
      totalMatches,
      totalFailed,
      totalComments,
      totalPublicReplies,
      totalFollowRequests,
      totalFollowConversions,
      totalRateLimitSkips,
      totalScheduleSkips,
      activeCampaigns,
      totalCampaigns: campaigns.length,
      deliveryRate: parseFloat(deliveryRate),
      matchRate: parseFloat(matchRate),
      followConversionRate: parseFloat(followConversionRate),
      dailyStats,
      topCampaigns,
      topKeywords,
    });
  } catch (error) {
    next(error);
  }
};

export const getRecentActivity = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const eventType = req.query.event;
    const campaignId = req.query.campaignId;

    const query = { user: req.user._id };
    if (eventType) query.event = eventType;
    if (campaignId) query.campaign = campaignId;

    const events = await Analytics.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("campaign", "name keyword keywords igPostThumbnail")
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

    const { startDate, endDate } = parseDateRange(req);
    const days = Math.max(1, dateDiffInDays(startDate, endDate));

    const events = await Analytics.find({
      campaign: campaign._id,
      createdAt: { $gte: startDate, $lte: endDate },
    })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    const dailyStatsRaw = await Analytics.aggregate([
      {
        $match: {
          campaign: campaign._id,
          createdAt: { $gte: startDate, $lte: endDate },
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
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
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
        keywords: campaign.keywords,
        matchType: campaign.matchType,
        isActive: campaign.isActive,
        igPostThumbnail: campaign.igPostThumbnail,
        igPostUrl: campaign.igPostUrl,
        igPostCaption: campaign.igPostCaption,
        instagramAccount: campaign.instagramAccount,
        stats: campaign.stats,
        rateLimits: campaign.rateLimits,
        schedule: campaign.schedule,
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
    const { startDate, endDate } = parseDateRange(req);

    const hourlyData = await Analytics.aggregate([
      {
        $match: {
          user: req.user._id,
          event: "dm_sent",
          createdAt: { $gte: startDate, $lte: endDate },
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

export const exportAnalyticsCSV = async (req, res, next) => {
  try {
    const { startDate, endDate } = parseDateRange(req);
    const campaignId = req.query.campaignId;

    const query = {
      user: req.user._id,
      createdAt: { $gte: startDate, $lte: endDate },
    };

    if (campaignId) query.campaign = campaignId;

    const events = await Analytics.find(query)
      .sort({ createdAt: -1 })
      .limit(10000)
      .populate("campaign", "name keyword")
      .lean();

    const headers = [
      "Date/Time",
      "Event",
      "Campaign",
      "Keyword",
      "Username",
      "User ID",
      "Comment Text",
      "Comment ID",
      "Metadata",
    ];

    const escapeCSV = (val) => {
      if (val === null || val === undefined) return "";
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = events.map((e) => {
      return [
        e.createdAt ? new Date(e.createdAt).toISOString() : "",
        e.event || "",
        e.campaign?.name || "",
        e.campaign?.keyword || "",
        e.fromUsername || "",
        e.fromUserId || "",
        e.commentText || "",
        e.commentId || "",
        e.metadata ? JSON.stringify(e.metadata) : "",
      ]
        .map(escapeCSV)
        .join(",");
    });

    const csv = [headers.map(escapeCSV).join(","), ...rows].join("\n");

    const filename = `instaflow-analytics-${startDate.toISOString().split("T")[0]}-to-${endDate.toISOString().split("T")[0]}.csv`;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    return res.send(csv);
  } catch (error) {
    next(error);
  }
};

export const getConversionFunnel = async (req, res, next) => {
  try {
    const { startDate, endDate } = parseDateRange(req);
    const campaignId = req.query.campaignId;

    const query = {
      user: req.user._id,
      createdAt: { $gte: startDate, $lte: endDate },
    };
    if (campaignId) query.campaign = campaignId;

    const eventCounts = await Analytics.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$event",
          count: { $sum: 1 },
        },
      },
    ]);

    const counts = {};
    eventCounts.forEach((e) => {
      counts[e._id] = e.count;
    });

    const funnel = [
      {
        label: "Comments Received",
        value: counts.comment_received || 0,
        color: "#3B82F6",
      },
      {
        label: "Keywords Matched",
        value: counts.keyword_matched || 0,
        color: "#F59E0B",
      },
      {
        label: "DMs Sent",
        value: counts.dm_sent || 0,
        color: "#10B981",
      },
    ];

    return successResponse(res, 200, "Conversion funnel", { funnel });
  } catch (error) {
    next(error);
  }
};
