import { motion } from "framer-motion";
import Avatar from "@/components/common/Avatar";
import StatusDot from "@/components/common/StatusDot";
import { formatRelativeTime } from "@/utils/formatDate";

const mockActivities = [
  {
    id: 1,
    user: "@sarah_designs",
    action: 'triggered keyword "price"',
    campaign: "Product Launch",
    time: new Date(Date.now() - 2 * 60 * 1000),
    status: "active",
  },
  {
    id: 2,
    user: "@mike_fitness",
    action: 'triggered keyword "guide"',
    campaign: "Free Guide Offer",
    time: new Date(Date.now() - 8 * 60 * 1000),
    status: "active",
  },
  {
    id: 3,
    user: "@emma_travels",
    action: 'triggered keyword "ebook"',
    campaign: "Travel Ebook",
    time: new Date(Date.now() - 15 * 60 * 1000),
    status: "active",
  },
  {
    id: 4,
    user: "@david_tech",
    action: 'triggered keyword "start"',
    campaign: "Getting Started",
    time: new Date(Date.now() - 30 * 60 * 1000),
    status: "active",
  },
  {
    id: 5,
    user: "@priya_cook",
    action: 'triggered keyword "course"',
    campaign: "Cooking Master",
    time: new Date(Date.now() - 45 * 60 * 1000),
    status: "active",
  },
  {
    id: 6,
    user: "@alex_photo",
    action: 'triggered keyword "price"',
    campaign: "Photography Bundle",
    time: new Date(Date.now() - 60 * 60 * 1000),
    status: "active",
  },
  {
    id: 7,
    user: "@lisa_art",
    action: 'triggered keyword "guide"',
    campaign: "Art Masterclass",
    time: new Date(Date.now() - 120 * 60 * 1000),
    status: "active",
  },
];

export default function RecentActivity() {
  return (
    <div className="bg-white rounded-2xl border border-border-light shadow-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border-light">
        <h3 className="text-sm font-manrope font-bold text-primary-darkest">
          Recent Activity
        </h3>
        <div className="flex items-center gap-1.5">
          <StatusDot status="active" size="small" />
          <span className="text-[10px] text-text-muted font-jakarta">Live</span>
        </div>
      </div>

      <div className="divide-y divide-border-light max-h-[400px] overflow-y-auto">
        {mockActivities.map((activity, i) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center justify-between px-5 py-3.5 hover:bg-surface-cream/50 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Avatar name={activity.user.replace("@", "")} size="small" />
              <div className="min-w-0">
                <p className="text-xs text-primary-darkest font-jakarta truncate">
                  <span className="font-bold">{activity.user}</span>{" "}
                  <span className="text-text-muted">{activity.action}</span>
                </p>
                <p className="text-[10px] text-text-muted font-jakarta">
                  {activity.campaign}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-3">
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-[10px] font-semibold text-emerald-600 font-jakarta">
                sent
              </span>
              <span className="text-[10px] text-text-muted/60 font-jakarta whitespace-nowrap">
                {formatRelativeTime(activity.time)}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
