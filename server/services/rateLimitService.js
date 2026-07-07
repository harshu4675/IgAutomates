import DMHistory from "../models/DMHistory.js";
import logger from "../utils/logger.js";

export const resetCountersIfNeeded = (campaign) => {
  const now = new Date();
  let updated = false;

  const hourlyReset = new Date(campaign.rateLimitCounters.hourlyResetAt);
  const dailyReset = new Date(campaign.rateLimitCounters.dailyResetAt);

  const oneHourMs = 60 * 60 * 1000;
  const oneDayMs = 24 * 60 * 60 * 1000;

  if (now - hourlyReset >= oneHourMs) {
    campaign.rateLimitCounters.hourlyCount = 0;
    campaign.rateLimitCounters.hourlyResetAt = now;
    updated = true;
  }

  if (now - dailyReset >= oneDayMs) {
    campaign.rateLimitCounters.dailyCount = 0;
    campaign.rateLimitCounters.dailyResetAt = now;
    updated = true;
  }

  return updated;
};

export const checkRateLimits = async (campaign, recipientId) => {
  if (!campaign.rateLimits || !campaign.rateLimits.enabled) {
    return { allowed: true, reason: "rate_limits_disabled" };
  }

  const limits = campaign.rateLimits;
  const counters = campaign.rateLimitCounters;

  resetCountersIfNeeded(campaign);

  if (counters.hourlyCount >= limits.maxPerHour) {
    return {
      allowed: false,
      reason: "hourly_limit_exceeded",
      message: `Hourly limit of ${limits.maxPerHour} reached`,
    };
  }

  if (counters.dailyCount >= limits.maxPerDay) {
    return {
      allowed: false,
      reason: "daily_limit_exceeded",
      message: `Daily limit of ${limits.maxPerDay} reached`,
    };
  }

  return { allowed: true, reason: "within_limits" };
};

export const incrementRateLimitCounters = async (campaign) => {
  campaign.rateLimitCounters.hourlyCount += 1;
  campaign.rateLimitCounters.dailyCount += 1;
};

export const recordDMHistory = async ({
  user,
  campaign,
  recipientId,
  recipientUsername,
  templateUsed,
}) => {
  try {
    await DMHistory.create({
      user,
      campaign,
      recipientId,
      recipientUsername,
      templateUsed,
      sentAt: new Date(),
    });
  } catch (error) {
    logger.error("Failed to record DM history", error);
  }
};
