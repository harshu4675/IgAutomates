import logger from "../utils/logger.js";

export const isCampaignScheduleActive = (campaign) => {
  if (!campaign.schedule || !campaign.schedule.enabled) {
    return { active: true, reason: "no_schedule" };
  }

  const schedule = campaign.schedule;
  const now = new Date();
  const timezone = schedule.timezone || "UTC";

  try {
    const localDateStr = now.toLocaleString("en-US", {
      timeZone: timezone,
      hour12: false,
    });
    const localDate = new Date(localDateStr);

    if (schedule.startDate && now < new Date(schedule.startDate)) {
      return {
        active: false,
        reason: "before_start_date",
        message: `Campaign starts at ${new Date(schedule.startDate).toLocaleString()}`,
      };
    }

    if (schedule.endDate && now > new Date(schedule.endDate)) {
      return {
        active: false,
        reason: "after_end_date",
        message: `Campaign ended at ${new Date(schedule.endDate).toLocaleString()}`,
      };
    }

    const currentDay = localDate.getDay();
    if (
      Array.isArray(schedule.activeDays) &&
      schedule.activeDays.length > 0 &&
      !schedule.activeDays.includes(currentDay)
    ) {
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      return {
        active: false,
        reason: "inactive_day",
        message: `Campaign not active on ${dayNames[currentDay]}`,
      };
    }

    if (schedule.activeHoursStart && schedule.activeHoursEnd) {
      const currentHours = localDate.getHours();
      const currentMinutes = localDate.getMinutes();
      const currentTime = currentHours * 60 + currentMinutes;

      const [startH, startM] = schedule.activeHoursStart.split(":").map(Number);
      const [endH, endM] = schedule.activeHoursEnd.split(":").map(Number);
      const startTime = startH * 60 + startM;
      const endTime = endH * 60 + endM;

      if (currentTime < startTime || currentTime > endTime) {
        return {
          active: false,
          reason: "outside_hours",
          message: `Campaign active only ${schedule.activeHoursStart}-${schedule.activeHoursEnd}`,
        };
      }
    }

    return { active: true, reason: "in_schedule" };
  } catch (error) {
    logger.error("Schedule check error", error);
    return { active: true, reason: "schedule_check_error" };
  }
};
