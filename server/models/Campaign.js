import mongoose from "mongoose";

const campaignSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    instagramAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InstagramAccount",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Campaign name is required"],
      trim: true,
      maxlength: 200,
    },
    igPostId: {
      type: String,
      required: true,
    },
    igPostUrl: {
      type: String,
      default: "",
    },
    igPostThumbnail: {
      type: String,
      default: "",
    },
    igPostCaption: {
      type: String,
      default: "",
    },
    igPostType: {
      type: String,
      enum: ["IMAGE", "VIDEO", "CAROUSEL_ALBUM", "REEL"],
      default: "IMAGE",
    },
    keyword: {
      type: String,
      required: [true, "Trigger keyword is required"],
      trim: true,
      lowercase: true,
    },
    matchType: {
      type: String,
      enum: ["exact", "contains"],
      default: "contains",
    },
    dmMessage: {
      type: String,
      required: [true, "DM message is required"],
      trim: true,
      maxlength: 1000,
    },
    dmLink: {
      type: String,
      trim: true,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    stats: {
      totalComments: {
        type: Number,
        default: 0,
      },
      keywordMatches: {
        type: Number,
        default: 0,
      },
      dmsSent: {
        type: Number,
        default: 0,
      },
      dmsFailed: {
        type: Number,
        default: 0,
      },
    },
    processedComments: [
      {
        commentId: String,
        userId: String,
        username: String,
        text: String,
        dmSent: Boolean,
        dmSentAt: Date,
        processedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

campaignSchema.index({ user: 1, isActive: 1 });
campaignSchema.index({ igPostId: 1, keyword: 1 });

const Campaign = mongoose.model("Campaign", campaignSchema);

export default Campaign;
