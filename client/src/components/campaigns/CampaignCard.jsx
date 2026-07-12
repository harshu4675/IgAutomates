import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineEllipsisVertical,
  HiOutlinePlayCircle,
  HiOutlinePauseCircle,
  HiOutlineTrash,
  HiOutlineChatBubbleLeftRight,
  HiOutlineBolt,
  HiOutlineHashtag,
  HiOutlineCheckCircle,
  HiOutlineBeaker,
  HiOutlineSparkles,
  HiOutlineUserPlus,
  HiOutlineChatBubbleBottomCenterText,
  HiOutlineClock,
  HiOutlineCalendarDays,
  HiOutlineShieldCheck,
  HiOutlineDocumentDuplicate,
  HiOutlineLink,
  HiOutlineArrowPath,
} from "react-icons/hi2";
import { formatNumber } from "@/utils/formatNumber";
import { formatDate } from "@/utils/formatDate";
import {
  useToggleCampaign,
  useDeleteCampaign,
  useDuplicateCampaign,
  useResetFollowerCache,
} from "@/hooks/useCampaigns";
import TestCampaignModal from "./TestCampaignModal";

const MATCH_TYPE_LABELS = {
  contains: "Contains",
  exact: "Exact",
  starts_with: "Starts with",
  ends_with: "Ends with",
  any: "Any comment",
};

const DELAY_LABELS = {
  instant: "Instant",
  short: "2-5s",
  medium: "5-15s",
  long: "15-30s",
};

const LINK_MODE_LABELS = {
  no_https: "Safe Link",
  direct: "Direct Link",
  delayed: "No Link",
  reply_first: "Reply First",
};

export default function CampaignCard({ campaign }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const toggleMutation = useToggleCampaign();
  const deleteMutation = useDeleteCampaign();
  const duplicateMutation = useDuplicateCampaign();
  const resetFollowersMutation = useResetFollowerCache();

  const handleToggle = () => {
    toggleMutation.mutate(campaign._id);
    setMenuOpen(false);
  };

  const handleDelete = () => {
    if (confirm(`Delete campaign "${campaign.name}"? This cannot be undone.`)) {
      deleteMutation.mutate(campaign._id);
    }
    setMenuOpen(false);
  };

  const handleDuplicate = () => {
    duplicateMutation.mutate(campaign._id);
    setMenuOpen(false);
  };

  const handleTest = () => {
    setTestModalOpen(true);
    setMenuOpen(false);
  };

  const handleResetFollowers = () => {
    if (
      confirm(
        `Reset follower cache for "${campaign.name}"? All verified followers will need to re-verify.`,
      )
    ) {
      resetFollowersMutation.mutate(campaign._id);
    }
    setMenuOpen(false);
  };

  const isAnyMode = campaign.matchType === "any";
  const keywordsList =
    Array.isArray(campaign.keywords) && campaign.keywords.length > 0
      ? campaign.keywords
      : campaign.keyword
        ? [campaign.keyword]
        : [];

  const displayKeywords = keywordsList.slice(0, 3);
  const extraCount = keywordsList.length - displayKeywords.length;

  const hasFollowFlow = campaign.followFlow?.enabled;
  const hasPublicReply = campaign.publicReply?.enabled;
  const hasDelay = campaign.dmDelay && campaign.dmDelay !== "short";
  const hasTemplates = campaign.dmTemplates && campaign.dmTemplates.length > 0;
  const hasRateLimits = campaign.rateLimits?.enabled;
  const hasSchedule = campaign.schedule?.enabled;
  const hasSpecialLinkMode =
    campaign.dmLink &&
    campaign.linkDeliveryMode &&
    campaign.linkDeliveryMode !== "direct";

  const verifiedCount = campaign.verifiedFollowersCount || 0;
  const pendingCount = campaign.pendingFollowCount || 0;

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl border border-border-light shadow-card hover:shadow-card-hover transition-shadow overflow-hidden"
      >
        <div className="relative">
          <div className="aspect-video bg-gradient-to-br from-primary-lightest to-primary-light/30 overflow-hidden">
            {campaign.igPostThumbnail ? (
              <img
                src={campaign.igPostThumbnail}
                alt={campaign.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <HiOutlineChatBubbleLeftRight className="w-12 h-12 text-primary-mid/50" />
              </div>
            )}
          </div>

          <div className="absolute top-3 left-3 flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg backdrop-blur-md text-[10px] font-jakarta font-bold uppercase tracking-wider ${
                campaign.isActive
                  ? "bg-emerald-500/90 text-white"
                  : "bg-amber-500/90 text-white"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              {campaign.isActive ? "Active" : "Paused"}
            </span>

            {isAnyMode && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/90 backdrop-blur-md text-[10px] font-jakarta font-bold text-primary-dark uppercase tracking-wider">
                <HiOutlineSparkles className="w-3 h-3" />
                Any
              </span>
            )}
          </div>

          <div className="absolute top-3 right-3">
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="w-9 h-9 rounded-xl bg-white/90 backdrop-blur-md flex items-center justify-center hover:bg-white transition-colors shadow-card"
              >
                <HiOutlineEllipsisVertical className="w-4 h-4 text-primary-darkest" />
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setMenuOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -5 }}
                      className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl border border-border-light shadow-glass-lg z-20 py-1"
                    >
                      <button
                        onClick={handleTest}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-jakarta text-text-primary hover:bg-surface-cream transition-colors"
                      >
                        <HiOutlineBeaker className="w-4 h-4" />
                        Test Campaign
                      </button>
                      <button
                        onClick={handleToggle}
                        disabled={toggleMutation.isPending}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-jakarta text-text-primary hover:bg-surface-cream transition-colors disabled:opacity-50"
                      >
                        {campaign.isActive ? (
                          <>
                            <HiOutlinePauseCircle className="w-4 h-4" />
                            Pause Campaign
                          </>
                        ) : (
                          <>
                            <HiOutlinePlayCircle className="w-4 h-4" />
                            Activate Campaign
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleDuplicate}
                        disabled={duplicateMutation.isPending}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-jakarta text-text-primary hover:bg-surface-cream transition-colors disabled:opacity-50"
                      >
                        <HiOutlineDocumentDuplicate className="w-4 h-4" />
                        Duplicate
                      </button>
                      {hasFollowFlow && verifiedCount > 0 && (
                        <button
                          onClick={handleResetFollowers}
                          disabled={resetFollowersMutation.isPending}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-jakarta text-primary-dark hover:bg-surface-cream transition-colors disabled:opacity-50"
                        >
                          <HiOutlineArrowPath className="w-4 h-4" />
                          Reset Followers ({verifiedCount})
                        </button>
                      )}
                      <div className="h-px bg-border-light my-1" />
                      <button
                        onClick={handleDelete}
                        disabled={deleteMutation.isPending}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-jakarta text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        <HiOutlineTrash className="w-4 h-4" />
                        Delete
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="p-5">
          <div className="mb-4">
            <h3 className="text-sm font-manrope font-bold text-primary-darkest mb-1 line-clamp-1">
              {campaign.name}
            </h3>
            <p className="text-[10px] text-text-muted font-jakarta">
              @{campaign.instagramAccount?.igUsername} ·{" "}
              {formatDate(campaign.createdAt)}
            </p>
          </div>

          <div className="mb-4 p-3 rounded-xl bg-surface-cream border border-border-light">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {isAnyMode ? (
                  <HiOutlineSparkles className="w-3.5 h-3.5 text-primary-mid" />
                ) : (
                  <HiOutlineHashtag className="w-3.5 h-3.5 text-primary-mid" />
                )}
                <span className="text-[10px] font-jakarta font-bold text-text-muted uppercase tracking-wider">
                  {isAnyMode ? "Trigger" : "Keywords"}
                </span>
              </div>
              <span className="text-[10px] text-text-muted font-jakarta">
                {MATCH_TYPE_LABELS[campaign.matchType] || campaign.matchType}
              </span>
            </div>

            {isAnyMode ? (
              <span className="inline-block px-2.5 py-1 rounded-lg bg-primary-lightest/60 text-xs font-jakarta font-bold text-primary-dark">
                Any comment
              </span>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {displayKeywords.map((kw) => (
                  <span
                    key={kw}
                    className="px-2 py-0.5 rounded-md bg-primary-lightest/60 text-[11px] font-jakarta font-bold text-primary-dark"
                  >
                    {kw}
                  </span>
                ))}
                {extraCount > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-primary-mid/15 text-[11px] font-jakarta font-bold text-primary-dark">
                    +{extraCount} more
                  </span>
                )}
              </div>
            )}
          </div>

          {(hasFollowFlow ||
            hasPublicReply ||
            hasDelay ||
            hasTemplates ||
            hasRateLimits ||
            hasSchedule ||
            hasSpecialLinkMode) && (
            <div className="mb-4 flex flex-wrap gap-1.5">
              {hasFollowFlow && (
                <FeatureBadge
                  icon={HiOutlineUserPlus}
                  label={
                    verifiedCount > 0
                      ? `Follow (${verifiedCount})`
                      : "Follow Flow"
                  }
                  color="emerald"
                />
              )}
              {hasSpecialLinkMode && (
                <FeatureBadge
                  icon={HiOutlineLink}
                  label={
                    LINK_MODE_LABELS[campaign.linkDeliveryMode] || "Link Mode"
                  }
                  color="sky"
                />
              )}
              {hasPublicReply && (
                <FeatureBadge
                  icon={HiOutlineChatBubbleBottomCenterText}
                  label="Public Reply"
                  color="sky"
                />
              )}
              {hasTemplates && (
                <FeatureBadge
                  icon={HiOutlineDocumentDuplicate}
                  label={`${campaign.dmTemplates.length} templates`}
                  color="violet"
                />
              )}
              {hasRateLimits && (
                <FeatureBadge
                  icon={HiOutlineShieldCheck}
                  label={`${campaign.rateLimits.maxPerHour}/hr`}
                  color="emerald"
                />
              )}
              {hasSchedule && (
                <FeatureBadge
                  icon={HiOutlineCalendarDays}
                  label="Scheduled"
                  color="rose"
                />
              )}
              {hasDelay && (
                <FeatureBadge
                  icon={HiOutlineClock}
                  label={DELAY_LABELS[campaign.dmDelay]}
                  color="slate"
                />
              )}
            </div>
          )}

          {hasFollowFlow && (verifiedCount > 0 || pendingCount > 0) && (
            <div className="mb-4 p-2.5 rounded-lg bg-emerald-50 border border-emerald-100">
              <div className="flex items-center justify-between text-[10px] font-jakarta">
                <span className="text-emerald-700 font-semibold">
                  Follower Status
                </span>
                <div className="flex items-center gap-3">
                  {verifiedCount > 0 && (
                    <span className="text-emerald-800 font-bold">
                      {verifiedCount} verified
                    </span>
                  )}
                  {pendingCount > 0 && (
                    <span className="text-amber-700 font-bold">
                      {pendingCount} pending
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-border-light">
            <Stat
              icon={HiOutlineBolt}
              value={campaign.stats?.keywordMatches || 0}
              label="Matches"
            />
            <Stat
              icon={HiOutlineChatBubbleLeftRight}
              value={campaign.stats?.dmsSent || 0}
              label="DMs Sent"
            />
            <Stat
              icon={HiOutlineCheckCircle}
              value={
                campaign.stats?.dmsSent > 0
                  ? `${Math.round((1 - (campaign.stats?.dmsFailed || 0) / campaign.stats.dmsSent) * 100)}%`
                  : "—"
              }
              label="Success"
            />
          </div>

          {campaign.stats?.linkBlocked > 0 && (
            <div className="mt-2 flex items-center justify-center gap-1 text-[10px] text-amber-600 font-jakarta">
              <HiOutlineShieldCheck className="w-3 h-3" />
              <span className="font-semibold">
                {campaign.stats.linkBlocked}
              </span>
              <span className="text-text-muted">
                links blocked (fallback used)
              </span>
            </div>
          )}
        </div>
      </motion.div>

      <TestCampaignModal
        isOpen={testModalOpen}
        onClose={() => setTestModalOpen(false)}
        campaign={campaign}
      />
    </>
  );
}

function FeatureBadge({ icon: Icon, label, color }) {
  const colors = {
    amber: "bg-amber-50 border-amber-200 text-amber-800",
    sky: "bg-sky-50 border-sky-200 text-sky-800",
    violet: "bg-violet-50 border-violet-200 text-violet-800",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-800",
    rose: "bg-rose-50 border-rose-200 text-rose-800",
    slate: "bg-slate-50 border-slate-200 text-slate-800",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-[10px] font-jakarta font-semibold ${colors[color] || colors.slate}`}
    >
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

function Stat({ icon: Icon, value, label }) {
  return (
    <div className="text-center">
      <Icon className="w-3.5 h-3.5 text-primary-mid mx-auto mb-1" />
      <p className="text-sm font-manrope font-bold text-primary-darkest">
        {typeof value === "number" ? formatNumber(value) : value}
      </p>
      <p className="text-[9px] text-text-muted font-jakarta uppercase tracking-wider">
        {label}
      </p>
    </div>
  );
}
