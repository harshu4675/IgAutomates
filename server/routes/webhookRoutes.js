import { Router } from "express";
import {
  verifyWebhook,
  handleWebhook,
  testWebhook,
} from "../controllers/webhookController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.get("/", verifyWebhook);
router.post("/", handleWebhook);
router.post("/test", protect, testWebhook);

export default router;
