import jwt from "jsonwebtoken";
import env from "../config/env.js";

const generateToken = (id) => {
  return jwt.sign({ id }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRE,
  });
};

export default generateToken;
