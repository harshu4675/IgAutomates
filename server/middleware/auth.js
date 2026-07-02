import jwt from "jsonwebtoken";
import User from "../models/User.js";
import env from "../config/env.js";
import { errorResponse } from "../utils/apiResponse.js";

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return errorResponse(res, 401, "Not authorized to access this route");
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return errorResponse(res, 401, "User no longer exists");
    }

    if (!user.isActive) {
      return errorResponse(res, 401, "User account is deactivated");
    }

    req.user = user;
    next();
  } catch (error) {
    return errorResponse(res, 401, "Not authorized to access this route");
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return errorResponse(res, 403, "Not authorized to perform this action");
    }
    next();
  };
};
