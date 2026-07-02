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
      ],
      required: true,
    },
    commentId: {
      type: String,
      default: "",
    },
    commentText: {
      type: String,
      default: "",
    },
    fromUserId: {
      type: String,
      default: "",
    },
    fromUsername: {
      type: String,
      default: "",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

analyticsSchema.index({ user: 1, createdAt: -1 });
analyticsSchema.index({ campaign: 1, event: 1 });

const Analytics = mongoose.model("Analytics", analyticsSchema);

export default Analytics;
