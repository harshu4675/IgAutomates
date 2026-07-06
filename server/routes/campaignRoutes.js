import { Router } from "express";
import {
  getCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  toggleCampaign,
  duplicateCampaign,
} from "../controllers/campaignController.js";
import {
  createCampaignValidation,
  updateCampaignValidation,
} from "../validators/campaignValidator.js";
import validate from "../middleware/validate.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.use(protect);

router.get("/", getCampaigns);
router.post("/", createCampaignValidation, validate, createCampaign);
router.get("/:id", getCampaign);
router.put("/:id", updateCampaignValidation, validate, updateCampaign);
router.delete("/:id", deleteCampaign);
router.patch("/:id/toggle", toggleCampaign);
router.post("/:id/duplicate", duplicateCampaign);

export default router;
