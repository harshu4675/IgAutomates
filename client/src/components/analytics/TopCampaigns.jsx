import { motion } from "framer-motion";
import { HiOutlineChatBubbleLeftRight, HiOutlineBolt } from "react-icons/hi2";
import { formatNumber } from "@/utils/formatNumber";

export default function TopCampaigns({ campaigns }) {
  if (!campaigns || campaigns.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-border-light shadow-card p-5">
        <h3 className="text-sm font-manrope font-bold text-primary-darkest mb-4">
          Top Campaigns
        </h3>
        <p className="text-sm text-text-muted font-jakarta text-center py-8">
          No campaigns with data yet
        </p>
      </div>
    );
  }

  const maxDMs = Math.max(...campaigns.map((c) => c.dmsSent), 1);

  return (
    <div className="bg-white rounded-2xl border border-border-light shadow-card p-5">
      <h3 className="text-sm font-manrope font-bold text-primary-darkest mb-5">
        Top Campaigns
      </h3>

      <div className="space-y-4">
        {campaigns.map((campaign, i) => (
          <motion.div
            key={campaign._id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-primary-light to-primary-mid flex-shrink-0">
                {campaign.thumbnail ? (
                  <img
                    src={campaign.thumbnail}
                    alt={campaign.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <HiOutlineChatBubbleLeftRight className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-jakarta font-bold text-primary-darkest truncate">
                  {campaign.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-jakarta font-semibold text-primary-mid">
                    #{campaign.keyword}
                  </span>
                  {campaign.isActive && (
                    <span className="inline-flex items-center gap-1 text-[9px] text-emerald-600 font-jakarta font-semibold">
                      <span className="w-1 h-1 rounded-full bg-emerald-500" />
                      LIVE
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <p className="text-sm font-manrope font-bold text-primary-darkest">
                  {formatNumber(campaign.dmsSent)}
                </p>
                <p className="text-[9px] text-text-muted font-jakarta">DMs</p>
              </div>
            </div>

            <div className="h-1.5 bg-surface-cream rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(campaign.dmsSent / maxDMs) * 100}%` }}
                transition={{
                  delay: 0.3 + i * 0.1,
                  duration: 0.8,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="h-full bg-gradient-accent rounded-full"
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
