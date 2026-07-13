import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { useLocation, useNavigate } from "react-router-dom";
import {
  HiOutlinePlus,
  HiOutlineRocketLaunch,
  HiOutlineMagnifyingGlass,
  HiOutlineExclamationTriangle,
} from "react-icons/hi2";
import Sidebar from "@/components/dashboard/Sidebar";
import DashboardNav from "@/components/dashboard/DashboardNav";
import CampaignCard from "@/components/campaigns/CampaignCard";
import CampaignWizard from "@/components/campaigns/CampaignWizard";
import Button from "@/components/common/Button";
import Loader from "@/components/common/Loader";
import useUIStore from "@/store/useUIStore";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useInstagramAccounts } from "@/hooks/useInstagram";
import { useDebounce } from "@/hooks/useDebounce";
import { staggerContainer, fadeInUp } from "@/animations/variants";

export default function Campaigns() {
  const { isSidebarOpen } = useUIStore();
  const location = useLocation();
  const navigate = useNavigate();

  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardAccountId, setWizardAccountId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data: campaigns, isLoading } = useCampaigns();
  const { data: accounts } = useInstagramAccounts();

  useEffect(() => {
    if (location.state?.accountId) {
      setWizardAccountId(location.state.accountId);
      setWizardOpen(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const filteredCampaigns = useMemo(() => {
    if (!campaigns) return [];
    const q = debouncedSearch.toLowerCase();
    return campaigns.filter((c) => {
      const nameMatch = c.name?.toLowerCase().includes(q);
      const singleKeywordMatch = c.keyword?.toLowerCase().includes(q);
      const keywordsMatch =
        Array.isArray(c.keywords) &&
        c.keywords.some((k) => String(k).toLowerCase().includes(q));
      const matchTypeMatch = c.matchType?.toLowerCase().includes(q);

      const matchesSearch =
        !q ||
        nameMatch ||
        singleKeywordMatch ||
        keywordsMatch ||
        matchTypeMatch;

      const matchesFilter =
        filterStatus === "all" ||
        (filterStatus === "active" && c.isActive) ||
        (filterStatus === "paused" && !c.isActive);

      return matchesSearch && matchesFilter;
    });
  }, [campaigns, debouncedSearch, filterStatus]);

  const statusCounts = useMemo(() => {
    if (!campaigns) return { all: 0, active: 0, paused: 0 };
    return {
      all: campaigns.length,
      active: campaigns.filter((c) => c.isActive).length,
      paused: campaigns.filter((c) => !c.isActive).length,
    };
  }, [campaigns]);

  const hasAccounts = accounts && accounts.length > 0;

  const openWizard = () => {
    setWizardAccountId(null);
    setWizardOpen(true);
  };

  const closeWizard = () => {
    setWizardOpen(false);
    setWizardAccountId(null);
  };

  return (
    <>
      <Helmet>
        <title>Campaigns | IGAutomates</title>
      </Helmet>

      <div className="min-h-screen bg-surface-cream">
        <Sidebar />
        <DashboardNav
          title="Campaigns"
          subtitle={campaigns ? `${campaigns.length} total campaigns` : ""}
          actionLabel={hasAccounts ? "New Campaign" : null}
          actionIcon={<HiOutlinePlus />}
          onAction={hasAccounts ? openWizard : null}
        />

        <motion.main
          animate={{ marginLeft: isSidebarOpen ? 260 : 80 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="p-6 md:p-8"
        >
          {!hasAccounts && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-6 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-4"
            >
              <HiOutlineExclamationTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-manrope font-bold text-amber-900 mb-1">
                  Connect Instagram First
                </h3>
                <p className="text-xs text-amber-800 font-jakarta mb-3">
                  You need to connect an Instagram Business account before
                  creating campaigns.
                </p>
                <Button
                  variant="primary"
                  size="small"
                  onClick={() => navigate("/dashboard")}
                >
                  Go to Dashboard
                </Button>
              </div>
            </motion.div>
          )}

          {hasAccounts && (
            <>
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-3xl border border-border-light overflow-hidden animate-pulse"
                    >
                      <div className="aspect-video bg-primary-lightest/40" />
                      <div className="p-5 space-y-3">
                        <div className="h-4 bg-primary-lightest/40 rounded w-3/4" />
                        <div className="h-3 bg-primary-lightest/40 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                >
                  {campaigns && campaigns.length > 0 && (
                    <motion.div
                      variants={fadeInUp}
                      className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6"
                    >
                      <div className="flex items-center gap-2 p-1 rounded-xl bg-white border border-border-light">
                        {["all", "active", "paused"].map((status) => (
                          <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2 rounded-lg text-xs font-jakarta font-semibold capitalize transition-all ${
                              filterStatus === status
                                ? "bg-gradient-cta text-white shadow-button"
                                : "text-text-muted hover:text-primary-darkest hover:bg-surface-cream"
                            }`}
                          >
                            {status} ({statusCounts[status]})
                          </button>
                        ))}
                      </div>

                      <div className="relative w-full md:w-80">
                        <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search by name, keyword or type..."
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-border-light text-sm font-jakarta text-primary-darkest placeholder:text-text-muted/40 focus:outline-none focus:border-primary-mid focus:ring-2 focus:ring-primary-mid/20 transition-all"
                        />
                      </div>
                    </motion.div>
                  )}

                  {campaigns && campaigns.length === 0 && (
                    <motion.div
                      variants={fadeInUp}
                      className="bg-white rounded-3xl border border-border-light shadow-card p-12 text-center"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-primary-lightest/40 flex items-center justify-center mx-auto mb-4">
                        <HiOutlineRocketLaunch className="w-8 h-8 text-primary-mid" />
                      </div>
                      <h3 className="text-lg font-manrope font-bold text-primary-darkest mb-2">
                        No campaigns yet
                      </h3>
                      <p className="text-sm text-text-muted font-jakarta mb-6 max-w-md mx-auto">
                        Create your first automation campaign to start sending
                        DMs when users comment on your posts.
                      </p>
                      <Button
                        variant="primary"
                        onClick={openWizard}
                        icon={<HiOutlinePlus />}
                        iconPosition="left"
                      >
                        Create Campaign
                      </Button>
                    </motion.div>
                  )}

                  {filteredCampaigns.length > 0 && (
                    <motion.div
                      variants={fadeInUp}
                      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
                    >
                      <AnimatePresence>
                        {filteredCampaigns.map((campaign) => (
                          <CampaignCard
                            key={campaign._id}
                            campaign={campaign}
                          />
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  )}

                  {campaigns &&
                    campaigns.length > 0 &&
                    filteredCampaigns.length === 0 && (
                      <motion.div
                        variants={fadeInUp}
                        className="text-center py-12"
                      >
                        <p className="text-sm text-text-muted font-jakarta">
                          No campaigns match your filters
                        </p>
                      </motion.div>
                    )}
                </motion.div>
              )}
            </>
          )}
        </motion.main>

        <CampaignWizard
          isOpen={wizardOpen}
          onClose={closeWizard}
          defaultAccountId={wizardAccountId}
        />
      </div>
    </>
  );
}
