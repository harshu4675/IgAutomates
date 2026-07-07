import mongoose from "mongoose";

const analyticsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
      index: true,
    },
    event: {
      type: String,
      enum: [
        "comment_received",
        "keyword_matched",
        "dm_sent",
        "dm_failed",
        "dm_opened",
        "public_reply_sent",
        "public_reply_failed",
        "follow_message_sent",
        "follow_conversion",
        "dm_delayed",
        "dm_reply_received",
        "rate_limit_skip",
        "schedule_skip",
        "repeat_user_skip",
        "cooldown_skip",
        "follow_button_sent",
        "follow_button_clicked",
        "follow_verified",
        "follow_retry_sent",
        "already_follower_dm",
        "share_received",
        "share_processed",
        "story_mention_received",
        "link_blocked",
        "link_retry_success",
      ],
      required: true,
    },
    commentId: { type: String, default: "" },
    commentText: { type: String, default: "" },
    fromUserId: { type: String, default: "" },
    fromUsername: { type: String, default: "" },
    source: {
      type: String,
      enum: ["comment", "share", "story_mention", "reply", ""],
      default: "",
    },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

analyticsSchema.index({ user: 1, createdAt: -1 });
analyticsSchema.index({ campaign: 1, event: 1 });
analyticsSchema.index({ user: 1, event: 1, createdAt: -1 });

const Analytics = mongoose.model("Analytics", analyticsSchema);

export default Analytics;
