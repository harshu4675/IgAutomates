import { Router } from "express";
import {
  getAuthUrl,
  handleCallback,
  getConnectedAccounts,
  disconnectAccount,
  fetchPosts,
} from "../controllers/instagramController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.get("/auth-url", protect, getAuthUrl);
router.get("/callback", handleCallback);
router.get("/accounts", protect, getConnectedAccounts);
router.delete("/accounts/:id", protect, disconnectAccount);
router.get("/accounts/:accountId/posts", protect, fetchPosts);

export default router;
