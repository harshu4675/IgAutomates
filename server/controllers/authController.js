import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import logger from "../utils/logger.js";

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(res, 400, "User already exists with this email");
    }

    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);

    user.lastLogin = new Date();
    await user.save();

    logger.info(`New user registered: ${email}`);

    return successResponse(res, 201, "Account created successfully", {
      user: user.toSafeObject(),
      token,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return errorResponse(res, 401, "Invalid email or password");
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return errorResponse(res, 401, "Invalid email or password");
    }

    if (!user.isActive) {
      return errorResponse(res, 401, "Account is deactivated");
    }

    const token = generateToken(user._id);

    user.lastLogin = new Date();
    await user.save();

    logger.info(`User logged in: ${email}`);

    return successResponse(res, 200, "Login successful", {
      user: user.toSafeObject(),
      token,
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate(
      "instagramAccounts",
    );

    return successResponse(res, 200, "User profile retrieved", {
      user: user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    return successResponse(res, 200, "Logged out successfully");
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, email, avatar } = req.body;

    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (email) user.email = email;
    if (avatar) user.avatar = avatar;

    await user.save();

    return successResponse(res, 200, "Profile updated successfully", {
      user: user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select("+password");

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return errorResponse(res, 400, "Current password is incorrect");
    }

    user.password = newPassword;
    await user.save();

    const token = generateToken(user._id);

    return successResponse(res, 200, "Password changed successfully", {
      token,
    });
  } catch (error) {
    next(error);
  }
};
