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
    keywords: {
      type: [String],
      default: [],
      set: (arr) =>
        Array.isArray(arr)
          ? arr.map((k) => String(k).toLowerCase().trim()).filter(Boolean)
          : [],
    },
    keyword: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    matchType: {
      type: String,
      enum: ["exact", "contains", "any", "starts_with", "ends_with"],
      default: "contains",
    },
    dmMessage: {
      type: String,
      required: [true, "DM message is required"],
      trim: true,
      maxlength: 1000,
    },
    dmTemplates: {
      type: [
        {
          message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000,
          },
          timesUsed: {
            type: Number,
            default: 0,
          },
        },
      ],
      default: [],
    },
    templateRotation: {
      type: String,
      enum: ["random", "sequential"],
      default: "random",
    },
    lastTemplateIndex: {
      type: Number,
      default: -1,
    },
    dmLink: {
      type: String,
      trim: true,
      default: "",
    },
    requireFollow: {
      type: Boolean,
      default: false,
    },
    followMessage: {
      type: String,
      trim: true,
      maxlength: 1000,
      default:
        "Please follow us first! Once you follow, reply to this message with any word to get the link.",
    },
    publicReply: {
      enabled: {
        type: Boolean,
        default: false,
      },
      message: {
        type: String,
        trim: true,
        maxlength: 300,
        default: "Check your DMs!",
      },
    },
    dmDelay: {
      type: String,
      enum: ["instant", "short", "medium", "long"],
      default: "short",
    },
    rateLimits: {
      enabled: {
        type: Boolean,
        default: false,
      },
      maxPerHour: {
        type: Number,
        default: 40,
        min: 1,
        max: 1000,
      },
      maxPerDay: {
        type: Number,
        default: 200,
        min: 1,
        max: 10000,
      },
      userCooldownMinutes: {
        type: Number,
        default: 2,
        min: 0,
        max: 1440,
      },
      skipRepeatUsers: {
        type: Boolean,
        default: true,
      },
      repeatUserHours: {
        type: Number,
        default: 24,
        min: 1,
        max: 720,
      },
    },
    rateLimitCounters: {
      hourlyCount: {
        type: Number,
        default: 0,
      },
      dailyCount: {
        type: Number,
        default: 0,
      },
      hourlyResetAt: {
        type: Date,
        default: Date.now,
      },
      dailyResetAt: {
        type: Date,
        default: Date.now,
      },
    },
    schedule: {
      enabled: {
        type: Boolean,
        default: false,
      },
      startDate: {
        type: Date,
        default: null,
      },
      endDate: {
        type: Date,
        default: null,
      },
      activeHoursStart: {
        type: String,
        default: "00:00",
      },
      activeHoursEnd: {
        type: String,
        default: "23:59",
      },
      activeDays: {
        type: [Number],
        default: [0, 1, 2, 3, 4, 5, 6],
      },
      timezone: {
        type: String,
        default: "UTC",
      },
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
      publicRepliesSent: {
        type: Number,
        default: 0,
      },
      followRequests: {
        type: Number,
        default: 0,
      },
      followConversions: {
        type: Number,
        default: 0,
      },
      rateLimitSkips: {
        type: Number,
        default: 0,
      },
      scheduleSkips: {
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
        matchedKeyword: String,
        dmSent: Boolean,
        dmSentAt: Date,
        publicReplySent: Boolean,
        followMessageSent: Boolean,
        skipReason: String,
        processedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    pendingFollowUsers: [
      {
        userId: String,
        username: String,
        commentId: String,
        followMessageSentAt: {
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

campaignSchema.pre("save", function (next) {
  if (this.keyword && (!this.keywords || this.keywords.length === 0)) {
    this.keywords = [this.keyword.toLowerCase().trim()];
  }
  if (this.keywords && this.keywords.length > 0 && !this.keyword) {
    this.keyword = this.keywords[0];
  }
  next();
});

campaignSchema.index({ user: 1, isActive: 1 });
campaignSchema.index({ igPostId: 1 });
campaignSchema.index({ "pendingFollowUsers.userId": 1 });

const Campaign = mongoose.model("Campaign", campaignSchema);

export default Campaign;
