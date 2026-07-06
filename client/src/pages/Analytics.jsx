import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import {
  HiOutlineChatBubbleLeftRight,
  HiOutlineBolt,
  HiOutlinePaperAirplane,
  HiOutlineCheckCircle,
  HiOutlineChartBarSquare,
  HiOutlineRocketLaunch,
  HiOutlineArrowDownTray,
  HiOutlineUserPlus,
  HiOutlineChatBubbleBottomCenterText,
} from "react-icons/hi2";
import Sidebar from "@/components/dashboard/Sidebar";
import DashboardNav from "@/components/dashboard/DashboardNav";
import StatCard from "@/components/analytics/StatCard";
import MultiLineChart from "@/components/analytics/MultiLineChart";
import HourlyChart from "@/components/analytics/HourlyChart";
import ActivityFeed from "@/components/analytics/ActivityFeed";
import TopCampaigns from "@/components/analytics/TopCampaigns";
import DateRangePicker from "@/components/common/DateRangePicker";
import Loader from "@/components/common/Loader";
import Button from "@/components/common/Button";
import useUIStore from "@/store/useUIStore";
import {
  useAnalyticsOverview,
  useHourlyDistribution,
  useFunnel,
} from "@/hooks/useAnalytics";
import { analyticsService } from "@/services/analyticsService";
import { staggerContainer, fadeInUp } from "@/animations/variants";

const defaultRange = () => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  return {
    label: "Last 30 days",
    days: 30,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };
};

export default function Analytics() {
  const { isSidebarOpen } = useUIStore();
  const [dateRange, setDateRange] = useState(defaultRange());
  const [isExporting, setIsExporting] = useState(false);

  const params = useMemo(() => {
    if (dateRange?.startDate && dateRange?.endDate) {
      return {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      };
    }
    return { days: dateRange?.days || 30 };
  }, [dateRange]);

  const { data: overview, isLoading } = useAnalyticsOverview(params);
  const { data: hourlyData } = useHourlyDistribution(params);
  const { data: funnelData } = useFunnel(params);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await analyticsService.exportCSV(params);
      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `instaflow-analytics-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) return <Loader />;

  const stats = [
    {
      icon: HiOutlineChatBubbleLeftRight,
      label: "Comments",
      value: overview?.totalComments || 0,
      gradient: "from-blue-500 to-blue-600",
    },
    {
      icon: HiOutlineBolt,
      label: "Matches",
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
      label: "Delivery",
      value: overview?.deliveryRate || 0,
      suffix: "%",
      gradient: "from-emerald-500 to-emerald-600",
    },
    {
      icon: HiOutlineUserPlus,
      label: "Follow Conv.",
      value: overview?.followConversionRate || 0,
      suffix: "%",
      gradient: "from-violet-500 to-violet-600",
    },
    {
      icon: HiOutlineChatBubbleBottomCenterText,
      label: "Public Replies",
      value: overview?.totalPublicReplies || 0,
      gradient: "from-sky-500 to-sky-600",
    },
    {
      icon: HiOutlineRocketLaunch,
      label: "Active",
      value: overview?.activeCampaigns || 0,
      gradient: "from-primary-light to-primary-mid",
    },
    {
      icon: HiOutlineChartBarSquare,
      label: "Total",
      value: overview?.totalCampaigns || 0,
      gradient: "from-primary-dark to-primary-darkest",
    },
  ];

  const chartSeries = [
    { key: "commentsReceived", label: "Comments", color: "#3B82F6" },
    { key: "keywordsMatched", label: "Matches", color: "#F59E0B" },
    { key: "dmsSent", label: "DMs Sent", color: "#10B981" },
    { key: "publicReplies", label: "Public Replies", color: "#8B5CF6" },
  ];

  const funnelMax = funnelData?.length
    ? Math.max(...funnelData.map((f) => f.value), 1)
    : 1;

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
              className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6"
            >
              <div>
                <h2 className="text-lg font-manrope font-bold text-primary-darkest">
                  Overview
                </h2>
                <p className="text-xs text-text-muted font-jakarta">
                  {dateRange?.label || "Custom range"}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <DateRangePicker value={dateRange} onChange={setDateRange} />
                <Button
                  variant="secondary"
                  size="small"
                  onClick={handleExport}
                  loading={isExporting}
                  icon={<HiOutlineArrowDownTray />}
                  iconPosition="left"
                >
                  Export CSV
                </Button>
              </div>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-4 mb-6"
            >
              {stats.map((stat) => (
                <StatCard key={stat.label} {...stat} />
              ))}
            </motion.div>

            {funnelData && funnelData.length > 0 && (
              <motion.div
                variants={fadeInUp}
                className="mb-6 bg-white rounded-2xl border border-border-light shadow-card p-5"
              >
                <h3 className="text-sm font-manrope font-bold text-primary-darkest mb-4">
                  Conversion Funnel
                </h3>
                <div className="space-y-3">
                  {funnelData.map((stage, i) => {
                    const width = (stage.value / funnelMax) * 100;
                    const prevValue =
                      i > 0 ? funnelData[i - 1].value : stage.value;
                    const dropoff =
                      prevValue > 0
                        ? Math.round((stage.value / prevValue) * 100)
                        : 0;
                    return (
                      <div key={stage.label}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-jakarta font-semibold text-primary-darkest">
                            {stage.label}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-manrope font-bold text-primary-darkest">
                              {stage.value.toLocaleString()}
                            </span>
                            {i > 0 && (
                              <span className="text-[10px] text-text-muted font-jakarta">
                                ({dropoff}% of prev)
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="h-6 bg-surface-cream rounded-lg overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${width}%` }}
                            transition={{
                              duration: 0.8,
                              delay: i * 0.15,
                              ease: [0.22, 1, 0.36, 1],
                            }}
                            className="h-full rounded-lg"
                            style={{ backgroundColor: stage.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

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
                      Daily events over the selected period
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

            {overview?.topKeywords && overview.topKeywords.length > 0 && (
              <motion.div
                variants={fadeInUp}
                className="mb-6 bg-white rounded-2xl border border-border-light shadow-card p-5"
              >
                <h3 className="text-sm font-manrope font-bold text-primary-darkest mb-4">
                  Top Performing Keywords
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {overview.topKeywords.slice(0, 10).map((kw) => (
                    <div
                      key={kw.keyword}
                      className="p-3 rounded-xl bg-surface-cream border border-border-light"
                    >
                      <p className="text-xs font-jakarta font-bold text-primary-darkest truncate">
                        {kw.keyword}
                      </p>
                      <p className="text-lg font-manrope font-bold text-primary-dark">
                        {kw.count}
                      </p>
                      <p className="text-[10px] text-text-muted font-jakarta">
                        matches
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

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
                    When DMs are sent
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
