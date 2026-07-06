import mongoose from "mongoose";

const dmHistorySchema = new mongoose.Schema(
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
    recipientId: {
      type: String,
      required: true,
      index: true,
    },
    recipientUsername: {
      type: String,
      default: "",
    },
    templateUsed: {
      type: Number,
      default: -1,
    },
    sentAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

dmHistorySchema.index({ campaign: 1, recipientId: 1, sentAt: -1 });
dmHistorySchema.index({ user: 1, sentAt: -1 });
dmHistorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 });

const DMHistory = mongoose.model("DMHistory", dmHistorySchema);

export default DMHistory;
