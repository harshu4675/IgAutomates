import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineChatBubbleLeftRight,
  HiOutlineBolt,
  HiOutlinePaperAirplane,
  HiOutlineExclamationCircle,
  HiOutlineFunnel,
} from "react-icons/hi2";
import { useRecentActivity } from "@/hooks/useAnalytics";
import { formatRelativeTime } from "@/utils/formatDate";

const eventConfig = {
  comment_received: {
    icon: HiOutlineChatBubbleLeftRight,
    label: "Comment",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  keyword_matched: {
    icon: HiOutlineBolt,
    label: "Match",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  dm_sent: {
    icon: HiOutlinePaperAirplane,
    label: "DM Sent",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  dm_failed: {
    icon: HiOutlineExclamationCircle,
    label: "DM Failed",
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
  },
};

const filterOptions = [
  { value: null, label: "All" },
  { value: "dm_sent", label: "DMs Sent" },
  { value: "keyword_matched", label: "Matches" },
  { value: "comment_received", label: "Comments" },
  { value: "dm_failed", label: "Failed" },
];

export default function ActivityFeed() {
  const [filter, setFilter] = useState(null);
  const { data: activities, isLoading } = useRecentActivity(30, filter);

  return (
    <div className="bg-white rounded-2xl border border-border-light shadow-card overflow-hidden">
      <div className="p-5 border-b border-border-light">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-manrope font-bold text-primary-darkest">
            Recent Activity
          </h3>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="text-[10px] text-text-muted font-jakarta">
              Live
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <HiOutlineFunnel className="w-4 h-4 text-text-muted flex-shrink-0" />
          {filterOptions.map((option) => (
            <button
              key={option.label}
              onClick={() => setFilter(option.value)}
              className={`px-3 py-1 rounded-lg text-[10px] font-jakarta font-semibold whitespace-nowrap transition-all ${
                filter === option.value
                  ? "bg-primary-darkest text-white"
                  : "bg-surface-cream text-text-muted hover:bg-primary-lightest/30"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-h-[500px] overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="w-6 h-6 border-2 border-primary-dark border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : activities && activities.length > 0 ? (
          <AnimatePresence>
            {activities.map((activity, i) => {
              const config =
                eventConfig[activity.event] || eventConfig.comment_received;
              const Icon = config.icon;

              return (
                <motion.div
                  key={activity._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ delay: i * 0.02 }}
                  className="flex items-start gap-3 px-5 py-4 border-b border-border-light last:border-0 hover:bg-surface-cream/50 transition-colors"
                >
                  <div
                    className={`w-9 h-9 rounded-xl ${config.bg} border ${config.border} flex items-center justify-center flex-shrink-0`}
                  >
                    <Icon className={`w-4 h-4 ${config.color}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className={`text-[10px] font-jakarta font-bold uppercase tracking-wider ${config.color}`}
                      >
                        {config.label}
                      </span>
                      {activity.fromUsername && (
                        <span className="text-xs font-jakarta font-semibold text-primary-darkest">
                          @{activity.fromUsername}
                        </span>
                      )}
                    </div>

                    {activity.commentText && (
                      <p className="text-xs text-text-primary font-jakarta line-clamp-2 mb-1">
                        &quot;{activity.commentText}&quot;
                      </p>
                    )}

                    {activity.campaign && (
                      <p className="text-[10px] text-text-muted font-jakarta">
                        Campaign:{" "}
                        <span className="font-semibold">
                          {activity.campaign.name}
                        </span>
                        {activity.campaign.keyword && (
                          <> · #{activity.campaign.keyword}</>
                        )}
                      </p>
                    )}

                    {activity.metadata?.error && (
                      <p className="text-[10px] text-red-600 font-jakarta mt-1">
                        Error: {activity.metadata.error}
                      </p>
                    )}
                  </div>

                  <span className="text-[10px] text-text-muted font-jakarta whitespace-nowrap flex-shrink-0">
                    {formatRelativeTime(activity.createdAt)}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        ) : (
          <div className="p-8 text-center">
            <p className="text-sm text-text-muted font-jakarta mb-2">
              No activity yet
            </p>
            <p className="text-xs text-text-muted font-jakarta">
              Activities will appear here as comments come in
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
