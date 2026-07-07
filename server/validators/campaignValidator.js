import { body } from "express-validator";

export const createCampaignValidation = [
  body("instagramAccount")
    .notEmpty()
    .withMessage("Instagram account is required")
    .isMongoId()
    .withMessage("Invalid account ID"),
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Campaign name is required")
    .isLength({ max: 200 })
    .withMessage("Name too long"),
  body("igPostId").notEmpty().withMessage("Post is required"),
  body("matchType")
    .optional()
    .isIn(["exact", "contains", "any", "starts_with", "ends_with"]),
  body("keywords").optional().isArray(),
  body("keywords.*").optional().isString().isLength({ min: 1, max: 50 }),
  body("keyword").optional().isString().isLength({ max: 50 }),
  body().custom((value) => {
    const matchType = value.matchType || "contains";
    const hasKeywords =
      Array.isArray(value.keywords) && value.keywords.length > 0;
    const hasKeyword =
      typeof value.keyword === "string" && value.keyword.trim().length > 0;
    if (matchType === "any") return true;
    if (!hasKeywords && !hasKeyword) {
      throw new Error("At least one keyword is required");
    }
    return true;
  }),
  body("dmMessage")
    .trim()
    .notEmpty()
    .withMessage("DM message is required")
    .isLength({ min: 10, max: 1000 })
    .withMessage("Message must be 10-1000 characters"),
  body("dmTemplates").optional().isArray(),
  body("dmTemplates.*.message")
    .optional()
    .isString()
    .isLength({ min: 10, max: 1000 }),
  body("templateRotation").optional().isIn(["random", "sequential"]),
  body("dmLink")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .custom((value) => {
      if (!value) return true;
      try {
        const withProtocol = value.startsWith("http")
          ? value
          : `https://${value}`;
        new URL(withProtocol);
        return true;
      } catch {
        throw new Error("Invalid URL");
      }
    }),
  body("linkDeliveryMode")
    .optional()
    .isIn(["direct", "delayed", "reply_first", "no_https"])
    .withMessage("Invalid link delivery mode"),
  body("requireFollow").optional().isBoolean(),
  body("followMessage").optional().trim().isLength({ max: 1000 }),
  body("followFlow").optional().isObject(),
  body("followFlow.enabled").optional().isBoolean(),
  body("followFlow.profileUrl")
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (!value) return true;
      try {
        const withProtocol = value.startsWith("http")
          ? value
          : `https://${value}`;
        new URL(withProtocol);
        return true;
      } catch {
        throw new Error("Invalid profile URL");
      }
    }),
  body("followFlow.followerMessage").optional().trim().isLength({ max: 1000 }),
  body("followFlow.nonFollowerMessage")
    .optional()
    .trim()
    .isLength({ max: 1000 }),
  body("followFlow.followButtonText").optional().trim().isLength({ max: 20 }),
  body("followFlow.afterFollowMessage")
    .optional()
    .trim()
    .isLength({ max: 1000 }),
  body("followFlow.retryMessage").optional().trim().isLength({ max: 1000 }),
  body("followFlow.maxRetries").optional().isInt({ min: 1, max: 10 }),
  body("shareTrigger").optional().isObject(),
  body("shareTrigger.enabled").optional().isBoolean(),
  body("shareTrigger.triggerOnDMShare").optional().isBoolean(),
  body("shareTrigger.triggerOnStoryMention").optional().isBoolean(),
  body("shareTrigger.shareMessage").optional().trim().isLength({ max: 1000 }),
  body("publicReply").optional().isObject(),
  body("publicReply.enabled").optional().isBoolean(),
  body("publicReply.message").optional().trim().isLength({ max: 300 }),
  body("dmDelay").optional().isIn(["instant", "short", "medium", "long"]),
  body("rateLimits").optional().isObject(),
  body("rateLimits.enabled").optional().isBoolean(),
  body("rateLimits.maxPerHour").optional().isInt({ min: 1, max: 1000 }),
  body("rateLimits.maxPerDay").optional().isInt({ min: 1, max: 10000 }),
  body("schedule").optional().isObject(),
  body("schedule.enabled").optional().isBoolean(),
  body("schedule.startDate").optional({ nullable: true, checkFalsy: true }),
  body("schedule.endDate").optional({ nullable: true, checkFalsy: true }),
  body("schedule.activeHoursStart").optional().isString(),
  body("schedule.activeHoursEnd").optional().isString(),
  body("schedule.activeDays").optional().isArray(),
  body("schedule.timezone").optional().isString(),
];

export const updateCampaignValidation = [
  body("name").optional().trim().notEmpty().isLength({ max: 200 }),
  body("keywords").optional().isArray(),
  body("keywords.*").optional().isString().isLength({ min: 1, max: 50 }),
  body("keyword").optional().isString().isLength({ max: 50 }),
  body("matchType")
    .optional()
    .isIn(["exact", "contains", "any", "starts_with", "ends_with"]),
  body("dmMessage")
    .optional()
    .trim()
    .notEmpty()
    .isLength({ min: 10, max: 1000 }),
  body("dmTemplates").optional().isArray(),
  body("templateRotation").optional().isIn(["random", "sequential"]),
  body("dmLink").optional().trim(),
  body("linkDeliveryMode")
    .optional()
    .isIn(["direct", "delayed", "reply_first", "no_https"]),
  body("isActive").optional().isBoolean(),
  body("requireFollow").optional().isBoolean(),
  body("followMessage").optional().trim().isLength({ max: 1000 }),
  body("followFlow").optional().isObject(),
  body("shareTrigger").optional().isObject(),
  body("publicReply").optional().isObject(),
  body("dmDelay").optional().isIn(["instant", "short", "medium", "long"]),
  body("rateLimits").optional().isObject(),
  body("schedule").optional().isObject(),
];
