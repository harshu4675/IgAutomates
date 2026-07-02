import { useState } from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import {
  HiOutlineChatBubbleLeftRight,
  HiOutlineBolt,
  HiOutlinePaperAirplane,
  HiOutlineCheckCircle,
  HiOutlineChartBarSquare,
  HiOutlineRocketLaunch,
} from "react-icons/hi2";
import Sidebar from "@/components/dashboard/Sidebar";
import DashboardNav from "@/components/dashboard/DashboardNav";
import StatCard from "@/components/analytics/StatCard";
import MultiLineChart from "@/components/analytics/MultiLineChart";
import HourlyChart from "@/components/analytics/HourlyChart";
import ActivityFeed from "@/components/analytics/ActivityFeed";
import TopCampaigns from "@/components/analytics/TopCampaigns";
import Loader from "@/components/common/Loader";
import useUIStore from "@/store/useUIStore";
import {
  useAnalyticsOverview,
  useHourlyDistribution,
} from "@/hooks/useAnalytics";
import { staggerContainer, fadeInUp } from "@/animations/variants";

const dateRangeOptions = [
  { value: 7, label: "7 days" },
  { value: 30, label: "30 days" },
  { value: 90, label: "90 days" },
];

export default function Analytics() {
  const { isSidebarOpen } = useUIStore();
  const [days, setDays] = useState(30);
  const { data: overview, isLoading } = useAnalyticsOverview(days);
  const { data: hourlyData } = useHourlyDistribution(7);

  if (isLoading) {
    return <Loader />;
  }

  const stats = [
    {
      icon: HiOutlineChatBubbleLeftRight,
      label: "Comments Received",
      value: overview?.totalComments || 0,
      gradient: "from-blue-500 to-blue-600",
    },
    {
      icon: HiOutlineBolt,
      label: "Keyword Matches",
      value: overview?.totalMatches || 0,
      gradient: "from-amber-500 to-orange-500",
      subValue: overview?.matchRate ? `${overview.matchRate}%` : null,
    },
    {
      icon: HiOutlinePaperAirplane,
      label: "DMs Sent",
      value: overview?.totalDMs || 0,
      gradient: "from-primary-mid to-primary-dark",
    },
    {
      icon: HiOutlineCheckCircle,
      label: "Delivery Rate",
      value: overview?.deliveryRate || 0,
      suffix: "%",
      gradient: "from-emerald-500 to-emerald-600",
    },
    {
      icon: HiOutlineRocketLaunch,
      label: "Active Campaigns",
      value: overview?.activeCampaigns || 0,
      gradient: "from-primary-light to-primary-mid",
    },
    {
      icon: HiOutlineChartBarSquare,
      label: "Total Campaigns",
      value: overview?.totalCampaigns || 0,
      gradient: "from-primary-dark to-primary-darkest",
    },
  ];

  const chartSeries = [
    { key: "commentsReceived", label: "Comments", color: "#3B82F6" },
    { key: "keywordsMatched", label: "Matches", color: "#F59E0B" },
    { key: "dmsSent", label: "DMs Sent", color: "#052659" },
  ];

  return (
    <>
      <Helmet>
        <title>Analytics | InstaFlow</title>
      </Helmet>

      <div className="min-h-screen bg-surface-cream">
        <Sidebar />
        <DashboardNav
          title="Analytics"
          subtitle="Real-time performance of your automations"
        />

        <motion.main
          animate={{ marginLeft: isSidebarOpen ? 260 : 80 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="p-6 md:p-8"
        >
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              variants={fadeInUp}
              className="flex items-center justify-between mb-6"
            >
              <div>
                <h2 className="text-lg font-manrope font-bold text-primary-darkest">
                  Overview
                </h2>
                <p className="text-xs text-text-muted font-jakarta">
                  Last {days} days performance
                </p>
              </div>

              <div className="flex items-center gap-1 p-1 rounded-xl bg-white border border-border-light">
                {dateRangeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setDays(option.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-jakarta font-semibold transition-all ${
                      days === option.value
                        ? "bg-gradient-cta text-white shadow-button"
                        : "text-text-muted hover:text-primary-darkest"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6"
            >
              {stats.map((stat) => (
                <StatCard key={stat.label} {...stat} />
              ))}
            </motion.div>

            <motion.div
              variants={fadeInUp}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6"
            >
              <div className="lg:col-span-2 bg-white rounded-2xl border border-border-light shadow-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-manrope font-bold text-primary-darkest">
                      Activity Timeline
                    </h3>
                    <p className="text-[10px] text-text-muted font-jakarta">
                      Daily events over the last {days} days
                    </p>
                  </div>
                </div>

                <MultiLineChart
                  data={overview?.dailyStats || []}
                  series={chartSeries}
                  height={280}
                />
              </div>

              <TopCampaigns campaigns={overview?.topCampaigns || []} />
            </motion.div>

            <motion.div
              variants={fadeInUp}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              <div className="lg:col-span-1 bg-white rounded-2xl border border-border-light shadow-card p-5">
                <div className="mb-4">
                  <h3 className="text-sm font-manrope font-bold text-primary-darkest">
                    Hourly Distribution
                  </h3>
                  <p className="text-[10px] text-text-muted font-jakarta">
                    When DMs are sent (last 7 days)
                  </p>
                </div>
                <HourlyChart data={hourlyData || []} />
              </div>

              <div className="lg:col-span-2">
                <ActivityFeed />
              </div>
            </motion.div>
          </motion.div>
        </motion.main>
      </div>
    </>
  );
}
