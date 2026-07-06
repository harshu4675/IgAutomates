import { Router } from "express";
import {
  getAuthUrl,
  handleCallback,
  getConnectedAccounts,
  disconnectAccount,
  fetchPosts,
  saveInstagramUserToken,
  debugToken,
  updateIgUserId,
} from "../controllers/instagramController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.get("/auth-url", protect, getAuthUrl);
router.get("/callback", handleCallback);
router.get("/accounts", protect, getConnectedAccounts);
router.delete("/accounts/:id", protect, disconnectAccount);
router.get("/accounts/:accountId/posts", protect, fetchPosts);
router.post("/save-token", protect, saveInstagramUserToken);
router.get("/debug-token", protect, debugToken);
router.post("/update-ig-id", protect, updateIgUserId);

export default router;
