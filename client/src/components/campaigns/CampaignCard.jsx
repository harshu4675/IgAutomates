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
} from "react-icons/hi2";
import { formatNumber } from "@/utils/formatNumber";
import { formatDate } from "@/utils/formatDate";
import { useToggleCampaign, useDeleteCampaign } from "@/hooks/useCampaigns";
import TestCampaignModal from "./TestCampaignModal";

export default function CampaignCard({ campaign }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const toggleMutation = useToggleCampaign();
  const deleteMutation = useDeleteCampaign();

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

  const handleTest = () => {
    setTestModalOpen(true);
    setMenuOpen(false);
  };

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

          <div className="absolute top-3 left-3">
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
          </div>

          <div className="absolute top-3 right-3">
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="w-9 h-9 rounded-xl bg-white/90 backdrop-blur-md flex items-center justify-center hover:bg-white transition-colors shadow-card"
                aria-label="Options"
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
                      className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl border border-border-light shadow-glass-lg z-20 py-1"
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
            <div className="flex items-center gap-2 mb-2">
              <HiOutlineHashtag className="w-3.5 h-3.5 text-primary-mid" />
              <span className="text-[10px] font-jakarta font-bold text-text-muted uppercase tracking-wider">
                Trigger keyword
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-lg bg-primary-lightest/60 text-xs font-jakarta font-bold text-primary-dark">
                #{campaign.keyword}
              </span>
              <span className="text-[10px] text-text-muted font-jakarta">
                {campaign.matchType}
              </span>
            </div>
          </div>

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
