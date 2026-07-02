import { Router } from "express";
import {
  getCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  toggleCampaign,
} from "../controllers/campaignController.js";
import { protect } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import {
  createCampaignValidation,
  updateCampaignValidation,
} from "../validators/campaignValidator.js";

const router = Router();

router.use(protect);

router
  .route("/")
  .get(getCampaigns)
  .post(validate(createCampaignValidation), createCampaign);

router
  .route("/:id")
  .get(getCampaign)
  .put(validate(updateCampaignValidation), updateCampaign)
  .delete(deleteCampaign);

router.patch("/:id/toggle", toggleCampaign);

export default router;
