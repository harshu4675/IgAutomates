import { Router } from "express";
import {
  getOverview,
  getRecentActivity,
  getCampaignStats,
  getHourlyDistribution,
  exportAnalyticsCSV,
  getConversionFunnel,
} from "../controllers/analyticsController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.use(protect);

router.get("/overview", getOverview);
router.get("/activity", getRecentActivity);
router.get("/hourly", getHourlyDistribution);
router.get("/funnel", getConversionFunnel);
router.get("/export", exportAnalyticsCSV);
router.get("/campaign/:id", getCampaignStats);

export default router;
