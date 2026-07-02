import { Router } from "express";
import {
  register,
  login,
  getMe,
  logout,
  updateProfile,
  changePassword,
} from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimiter.js";
import validate from "../middleware/validate.js";
import {
  registerValidation,
  loginValidation,
} from "../validators/authValidator.js";

const router = Router();

router.post("/register", authLimiter, validate(registerValidation), register);
router.post("/login", authLimiter, validate(loginValidation), login);
router.get("/me", protect, getMe);
router.post("/logout", protect, logout);
router.put("/profile", protect, updateProfile);
router.put("/password", protect, changePassword);

export default router;
