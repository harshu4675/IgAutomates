import { useEffect } from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  HiOutlineRocketLaunch,
  HiOutlineChatBubbleLeftRight,
  HiOutlineBolt,
  HiOutlineExclamationCircle,
  HiOutlineCheckCircle,
  HiOutlineArrowRight,
  HiOutlinePaperAirplane,
} from "react-icons/hi2";
import Sidebar from "@/components/dashboard/Sidebar";
import DashboardNav from "@/components/dashboard/DashboardNav";
import InstagramConnectCard from "@/components/dashboard/InstagramConnectCard";
import InstagramAccountCard from "@/components/dashboard/InstagramAccountCard";
import StatCard from "@/components/analytics/StatCard";
import AreaChart from "@/components/analytics/AreaChart";
import ActivityFeed from "@/components/analytics/ActivityFeed";
import Button from "@/components/common/Button";
import Loader from "@/components/common/Loader";
import useUIStore from "@/store/useUIStore";
import useAuthStore from "@/store/useAuthStore";
import { useInstagramAccounts } from "@/hooks/useInstagram";
import { useAnalyticsOverview } from "@/hooks/useAnalytics";
import { useCampaigns } from "@/hooks/useCampaigns";
import { staggerContainer, fadeInUp } from "@/animations/variants";

export default function Dashboard() {
  const { isSidebarOpen } = useUIStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    data: accounts,
    isLoading: accountsLoading,
    refetch: refetchAccounts,
  } = useInstagramAccounts();
  const { data: campaigns } = useCampaigns();
  const { data: analytics } = useAnalyticsOverview(7);

  useEffect(() => {
    const igConnected = searchParams.get("ig_connected");
    const igError = searchParams.get("ig_error");

    if (igConnected === "true") {
      refetchAccounts();
      setTimeout(() => {
        setSearchParams({});
      }, 5000);
    }

    if (igError) {
      setTimeout(() => {
        setSearchParams({});
      }, 5000);
    }
  }, [searchParams, setSearchParams, refetchAccounts]);

  if (accountsLoading) {
    return <Loader />;
  }

  const hasAccounts = accounts && accounts.length > 0;
  const hasCampaigns = campaigns && campaigns.length > 0;
  const igError = searchParams.get("ig_error");
  const igConnected = searchParams.get("ig_connected");

  const stats = [
    {
      icon: HiOutlineRocketLaunch,
      label: "Active Campaigns",
      value: analytics?.activeCampaigns || 0,
      gradient: "from-primary-mid to-primary-dark",
    },
    {
      icon: HiOutlineChatBubbleLeftRight,
      label: "Comments (7d)",
      value: analytics?.totalComments || 0,
      gradient: "from-blue-500 to-blue-600",
    },
    {
      icon: HiOutlineBolt,
      label: "Matches (7d)",
      value: analytics?.totalMatches || 0,
      gradient: "from-amber-500 to-orange-500",
    },
    {
      icon: HiOutlinePaperAirplane,
      label: "DMs Sent (7d)",
      value: analytics?.totalDMs || 0,
      gradient: "from-emerald-500 to-emerald-600",
    },
  ];

  return (
    <>
      <Helmet>
        <title>Dashboard | InstaFlow</title>
      </Helmet>

      <div className="min-h-screen bg-surface-cream">
        <Sidebar />
        <DashboardNav
          title={`Welcome, ${user?.name?.split(" ")[0] || "User"}`}
          subtitle={
            hasAccounts
              ? "Your automation overview"
              : "Connect your Instagram to get started"
          }
        />

        <motion.main
          animate={{ marginLeft: isSidebarOpen ? 260 : 80 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="p-6 md:p-8"
        >
          {igConnected === "true" && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3"
            >
              <HiOutlineCheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <p className="text-sm text-emerald-800 font-jakarta">
                Instagram account connected successfully!
              </p>
            </motion.div>
          )}

          {igError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-3"
            >
              <HiOutlineExclamationCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="text-sm text-red-800 font-jakarta font-semibold">
                  Connection failed
                </p>
                <p className="text-xs text-red-700 font-jakarta">
                  {igError === "no_business_account"
                    ? "No Instagram Business account found. Please convert to a Business account."
                    : igError === "no_code"
                      ? "Authorization was cancelled."
                      : "Something went wrong. Please try again."}
                </p>
              </div>
            </motion.div>
          )}

          {!hasAccounts ? (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={fadeInUp}>
                <InstagramConnectCard />
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="space-y-6"
            >
              <motion.div
                variants={fadeInUp}
                className="grid grid-cols-2 lg:grid-cols-4 gap-4"
              >
                {stats.map((stat) => (
                  <StatCard key={stat.label} {...stat} />
                ))}
              </motion.div>

              {hasCampaigns && analytics?.dailyStats && (
                <motion.div
                  variants={fadeInUp}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                >
                  <div className="bg-white rounded-2xl border border-border-light shadow-card p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-manrope font-bold text-primary-darkest">
                          DMs Sent Trend
                        </h3>
                        <p className="text-[10px] text-text-muted font-jakarta">
                          Last 7 days
                        </p>
                      </div>
                    </div>
                    <AreaChart
                      data={analytics.dailyStats.slice(-7)}
                      dataKey="dmsSent"
                      color="#052659"
                      height={180}
                    />
                  </div>

                  <div className="bg-white rounded-2xl border border-border-light shadow-card p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-manrope font-bold text-primary-darkest">
                          Keyword Matches
                        </h3>
                        <p className="text-[10px] text-text-muted font-jakarta">
                          Last 7 days
                        </p>
                      </div>
                    </div>
                    <AreaChart
                      data={analytics.dailyStats.slice(-7)}
                      dataKey="keywordsMatched"
                      color="#F59E0B"
                      height={180}
                    />
                  </div>
                </motion.div>
              )}

              <motion.div variants={fadeInUp}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-manrope font-bold text-primary-darkest">
                      Connected Accounts
                    </h2>
                    <p className="text-xs text-text-muted font-jakarta">
                      {accounts.length} account{accounts.length > 1 ? "s" : ""}{" "}
                      connected
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {accounts.map((account) => (
                    <InstagramAccountCard key={account._id} account={account} />
                  ))}
                </div>
              </motion.div>

              {hasCampaigns && (
                <motion.div variants={fadeInUp}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-manrope font-bold text-primary-darkest">
                        Live Activity
                      </h2>
                      <p className="text-xs text-text-muted font-jakarta">
                        Real-time events from your automations
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="small"
                      icon={<HiOutlineArrowRight />}
                      onClick={() => navigate("/analytics")}
                    >
                      View All
                    </Button>
                  </div>

                  <ActivityFeed />
                </motion.div>
              )}

              {!hasCampaigns && (
                <motion.div
                  variants={fadeInUp}
                  className="bg-white rounded-3xl border border-border-light shadow-card p-8 text-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-primary-lightest/40 flex items-center justify-center mx-auto mb-4">
                    <HiOutlineRocketLaunch className="w-8 h-8 text-primary-mid" />
                  </div>
                  <h3 className="text-lg font-manrope font-bold text-primary-darkest mb-2">
                    Create Your First Campaign
                  </h3>
                  <p className="text-sm text-text-muted font-jakarta mb-6 max-w-md mx-auto">
                    Set up automation for your Instagram posts. Choose a keyword
                    and let InstaFlow send DMs automatically.
                  </p>
                  <Button
                    variant="primary"
                    onClick={() => navigate("/campaigns")}
                    icon={<HiOutlineArrowRight />}
                  >
                    Create Campaign
                  </Button>
                </motion.div>
              )}

              <motion.div variants={fadeInUp}>
                <InstagramConnectCard />
              </motion.div>
            </motion.div>
          )}
        </motion.main>
      </div>
    </>
  );
}
