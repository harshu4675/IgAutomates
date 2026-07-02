import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import mongoSanitize from "express-mongo-sanitize";

import connectDB from "./config/db.js";
import env from "./config/env.js";
import { generalLimiter } from "./middleware/rateLimiter.js";
import errorHandler from "./middleware/errorHandler.js";
import logger from "./utils/logger.js";

import authRoutes from "./routes/authRoutes.js";
import instagramRoutes from "./routes/instagramRoutes.js";
import campaignRoutes from "./routes/campaignRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";

const app = express();

connectDB();

app.set("trust proxy", 1);
app.set("query parser", "extended");
app.disable("x-powered-by");

app.get(
  "/api/webhook",
  (req, res, next) => {
    console.log("=== DIRECT WEBHOOK GET HIT ===");
    console.log("URL:", req.originalUrl);
    console.log("Query:", req.query);
    console.log("=============================");
    next();
  },
  (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    console.log("Mode:", mode, "Token:", token, "Challenge:", challenge);
    console.log("Expected token from env:", env.IG_VERIFY_TOKEN);

    if (mode === "subscribe" && token === env.IG_VERIFY_TOKEN) {
      console.log("Verification SUCCESS - returning challenge");
      return res.status(200).send(challenge);
    }

    console.log("Verification FAILED");
    return res.status(403).send("Forbidden");
  },
);

app.post("/api/webhook", express.json(), async (req, res) => {
  res.status(200).send("EVENT_RECEIVED");

  try {
    const { handleWebhook } =
      await import("./controllers/webhookController.js");
    req.body = req.body;
    await handleWebhook(req, res);
  } catch (error) {
    logger.error("Webhook POST error", error);
  }
});

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
);

app.use(
  cors({
    origin: "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(compression({ level: 6, threshold: 1024 }));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(mongoSanitize());

if (env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "InstaFlow API is running",
    environment: env.NODE_ENV,
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    verifyToken: env.IG_VERIFY_TOKEN ? "SET" : "NOT SET",
  });
});

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "InstaFlow API v1.0",
  });
});

app.use("/api", generalLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/instagram", instagramRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/analytics", analyticsRoutes);

app.post("/api/webhook/test", async (req, res, next) => {
  const { testWebhook } = await import("./controllers/webhookController.js");
  const { protect } = await import("./middleware/auth.js");
  protect(req, res, () => testWebhook(req, res, next));
});

app.use("/api/*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

app.use(errorHandler);

const PORT = env.PORT;

const server = app.listen(PORT, "0.0.0.0", () => {
  logger.info(`Server running in ${env.NODE_ENV} mode on port ${PORT}`);
  logger.info(
    `IG_VERIFY_TOKEN configured: ${env.IG_VERIFY_TOKEN ? "YES" : "NO"}`,
  );
});

process.on("unhandledRejection", (err) => {
  logger.error("Unhandled Rejection", err);
  server.close(() => process.exit(1));
});

process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception", err);
  process.exit(1);
});

process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");
  server.close(() => process.exit(0));
});

export default app;
