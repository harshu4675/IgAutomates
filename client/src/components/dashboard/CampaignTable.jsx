import { motion } from "framer-motion";
import StatusDot from "@/components/common/StatusDot";
import Badge from "@/components/common/Badge";
import ProgressBar from "@/components/common/ProgressBar";
import { formatDate } from "@/utils/formatDate";
import { formatNumber } from "@/utils/formatNumber";

const mockCampaigns = [
  {
    _id: "1",
    name: "Product Launch Promo",
    status: "active",
    keywords: ["price", "buy", "cost"],
    stats: { totalDMsSent: 1247, totalLeads: 342, conversionRate: 27.4 },
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
  {
    _id: "2",
    name: "Free Guide Distribution",
    status: "active",
    keywords: ["guide", "free", "download"],
    stats: { totalDMsSent: 2340, totalLeads: 891, conversionRate: 38.1 },
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
  },
  {
    _id: "3",
    name: "Webinar Registration",
    status: "paused",
    keywords: ["webinar", "register", "join"],
    stats: { totalDMsSent: 890, totalLeads: 156, conversionRate: 17.5 },
    createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
  },
  {
    _id: "4",
    name: "Course Enrollment",
    status: "active",
    keywords: ["course", "enroll", "learn"],
    stats: { totalDMsSent: 1560, totalLeads: 423, conversionRate: 27.1 },
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    _id: "5",
    name: "Ebook Giveaway",
    status: "draft",
    keywords: ["ebook", "book"],
    stats: { totalDMsSent: 0, totalLeads: 0, conversionRate: 0 },
    createdAt: new Date(),
  },
];

export default function CampaignTable() {
  return (
    <div className="bg-white rounded-2xl border border-border-light shadow-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border-light">
        <h3 className="text-sm font-manrope font-bold text-primary-darkest">
          Campaign Overview
        </h3>
        <button className="text-xs text-primary-mid hover:text-primary-dark font-jakarta font-semibold transition-colors">
          View All
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-light">
              <th className="text-left px-5 py-3 text-[10px] font-jakarta font-bold text-text-muted uppercase tracking-wider">
                Campaign
              </th>
              <th className="text-left px-5 py-3 text-[10px] font-jakarta font-bold text-text-muted uppercase tracking-wider">
                Status
              </th>
              <th className="text-left px-5 py-3 text-[10px] font-jakarta font-bold text-text-muted uppercase tracking-wider">
                Keywords
              </th>
              <th className="text-left px-5 py-3 text-[10px] font-jakarta font-bold text-text-muted uppercase tracking-wider">
                DMs Sent
              </th>
              <th className="text-left px-5 py-3 text-[10px] font-jakarta font-bold text-text-muted uppercase tracking-wider">
                Leads
              </th>
              <th className="text-left px-5 py-3 text-[10px] font-jakarta font-bold text-text-muted uppercase tracking-wider">
                Conversion
              </th>
            </tr>
          </thead>
          <tbody>
            {mockCampaigns.map((campaign, i) => (
              <motion.tr
                key={campaign._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="border-b border-border-light last:border-0 hover:bg-surface-cream/30 transition-colors cursor-pointer"
              >
                <td className="px-5 py-3.5">
                  <div>
                    <p className="text-sm font-jakarta font-semibold text-primary-darkest">
                      {campaign.name}
                    </p>
                    <p className="text-[10px] text-text-muted font-jakarta">
                      Created {formatDate(campaign.createdAt)}
                    </p>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <Badge
                    variant={
                      campaign.status === "active"
                        ? "success"
                        : campaign.status === "paused"
                          ? "warning"
                          : "default"
                    }
                    size="small"
                    dot
                  >
                    {campaign.status}
                  </Badge>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex flex-wrap gap-1">
                    {campaign.keywords.slice(0, 2).map((kw) => (
                      <span
                        key={kw}
                        className="px-2 py-0.5 rounded bg-primary-lightest/40 text-[10px] font-jakarta font-semibold text-primary-dark"
                      >
                        #{kw}
                      </span>
                    ))}
                    {campaign.keywords.length > 2 && (
                      <span className="text-[10px] text-text-muted font-jakarta">
                        +{campaign.keywords.length - 2}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-sm font-jakarta font-semibold text-primary-darkest">
                    {formatNumber(campaign.stats.totalDMsSent)}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-sm font-jakarta font-semibold text-primary-darkest">
                    {formatNumber(campaign.stats.totalLeads)}
                  </span>
                </td>
                <td className="px-5 py-3.5 min-w-[120px]">
                  <div className="flex items-center gap-2">
                    <ProgressBar
                      value={campaign.stats.conversionRate}
                      max={100}
                      size="small"
                      className="flex-1"
                    />
                    <span className="text-xs font-jakarta font-semibold text-primary-darkest whitespace-nowrap">
                      {campaign.stats.conversionRate}%
                    </span>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
