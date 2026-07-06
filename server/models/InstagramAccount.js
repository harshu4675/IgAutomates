import mongoose from "mongoose";

const instagramAccountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    igUserId: {
      type: String,
      required: true,
    },
    igUsername: {
      type: String,
      required: true,
      trim: true,
    },
    igName: {
      type: String,
      trim: true,
      default: "",
    },
    profilePicture: {
      type: String,
      default: "",
    },
    accessToken: {
      type: String,
      required: true,
      select: false,
    },
    tokenExpiry: {
      type: Date,
      default: null,
    },
    pageId: {
      type: String,
      required: true,
    },
    pageAccessToken: {
      type: String,
      required: true,
      select: false,
    },
    instagramUserToken: {
      type: String,
      select: false,
      default: "",
    },
    followersCount: {
      type: Number,
      default: 0,
    },
    mediaCount: {
      type: Number,
      default: 0,
    },
    isConnected: {
      type: Boolean,
      default: true,
    },
    igBusinessId: {
      type: String,
      default: "",
    },
    webhookSubscribed: {
      type: Boolean,
      default: false,
    },
    lastSynced: {
      type: Date,
      default: Date.now,
    },
  },

  {
    timestamps: true,
  },
);

instagramAccountSchema.index({ user: 1, igUserId: 1 }, { unique: true });

const InstagramAccount = mongoose.model(
  "InstagramAccount",
  instagramAccountSchema,
);

export default InstagramAccount;
