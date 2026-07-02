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
  body("keyword")
    .trim()
    .notEmpty()
    .withMessage("Keyword is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Keyword must be 2-50 characters"),
  body("matchType")
    .optional()
    .isIn(["exact", "contains"])
    .withMessage("Invalid match type"),
  body("dmMessage")
    .trim()
    .notEmpty()
    .withMessage("DM message is required")
    .isLength({ min: 10, max: 1000 })
    .withMessage("Message must be 10-1000 characters"),
  body("dmLink")
    .optional()
    .trim()
    .custom((value) => {
      if (!value) return true;
      try {
        new URL(value);
        return true;
      } catch {
        throw new Error("Invalid URL");
      }
    }),
];

export const updateCampaignValidation = [
  body("name").optional().trim().notEmpty().isLength({ max: 200 }),
  body("keyword").optional().trim().notEmpty().isLength({ min: 2, max: 50 }),
  body("matchType").optional().isIn(["exact", "contains"]),
  body("dmMessage")
    .optional()
    .trim()
    .notEmpty()
    .isLength({ min: 10, max: 1000 }),
  body("dmLink").optional().trim(),
  body("isActive").optional().isBoolean(),
];
