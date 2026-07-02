import dotenv from "dotenv";

dotenv.config();

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT, 10) || 5000,
  MONGO_URI:
    process.env.MONGO_URI || "mongodb://localhost:27017/insta-automate",
  JWT_SECRET: process.env.JWT_SECRET || "default_jwt_secret",
  JWT_EXPIRE: process.env.JWT_EXPIRE || "30d",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",
  FB_APP_ID: process.env.FB_APP_ID || "",
  FB_APP_SECRET: process.env.FB_APP_SECRET || "",
  FB_REDIRECT_URI:
    process.env.FB_REDIRECT_URI ||
    "http://localhost:5000/api/instagram/callback",
  IG_VERIFY_TOKEN: process.env.IG_VERIFY_TOKEN || "instaflow_verify_token",
};

export default env;
