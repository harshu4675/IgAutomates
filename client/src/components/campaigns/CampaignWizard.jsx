import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineXMark,
  HiOutlineArrowLeft,
  HiOutlineArrowRight,
  HiOutlineCheck,
} from "react-icons/hi2";
import AccountSelector from "./AccountSelector";
import PostSelector from "./PostSelector";
import AutomationSetup from "./AutomationSetup";
import Button from "@/components/common/Button";
import { useInstagramAccounts } from "@/hooks/useInstagram";
import { useCreateCampaign } from "@/hooks/useCampaigns";

const steps = [
  { id: 1, label: "Account" },
  { id: 2, label: "Post" },
  { id: 3, label: "Setup" },
];

export default function CampaignWizard({ isOpen, onClose, defaultAccountId }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [serverError, setServerError] = useState("");

  const { data: accounts } = useInstagramAccounts();
  const createMutation = useCreateCampaign();

  useEffect(() => {
    if (isOpen) {
      if (defaultAccountId) {
        setSelectedAccountId(defaultAccountId);
        setCurrentStep(2);
      } else if (accounts?.length === 1) {
        setSelectedAccountId(accounts[0]._id);
        setCurrentStep(2);
      }
    } else {
      setCurrentStep(1);
      setSelectedAccountId(null);
      setSelectedPost(null);
      setServerError("");
    }
  }, [isOpen, defaultAccountId, accounts]);

  const canGoNext = () => {
    if (currentStep === 1) return !!selectedAccountId;
    if (currentStep === 2) return !!selectedPost;
    return false;
  };

  const handleNext = () => {
    if (canGoNext() && currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleCreate = async (formData) => {
    setServerError("");

    const matchType = formData.matchType || "contains";
    const isAny = matchType === "any";

    const keywordsList = Array.isArray(formData.keywords)
      ? formData.keywords
          .map((k) => String(k).toLowerCase().trim())
          .filter(Boolean)
      : [];

    if (!isAny && keywordsList.length === 0) {
      setServerError("Please add at least one keyword");
      return;
    }

    if (formData.followFlow?.enabled && !formData.followFlow?.profileUrl) {
      setServerError(
        "Instagram profile URL is required when Follow Flow is enabled",
      );
      return;
    }

    const payload = {
      instagramAccount: selectedAccountId,
      name: formData.name,
      igPostId: selectedPost.id,
      igPostUrl: selectedPost.permalink || "",
      igPostThumbnail:
        selectedPost.thumbnail_url || selectedPost.media_url || "",
      igPostCaption: selectedPost.caption || "",
      igPostType: selectedPost.media_type || "IMAGE",
      keywords: isAny ? [] : keywordsList,
      keyword: isAny ? "" : keywordsList[0] || "",
      matchType,
      dmMessage: formData.dmMessage,
      dmLink: formData.dmLink || "",
      linkDeliveryMode: formData.linkDeliveryMode || "no_https",
      dmTemplates: Array.isArray(formData.dmTemplates)
        ? formData.dmTemplates
        : [],
      templateRotation: formData.templateRotation || "random",
      requireFollow: Boolean(formData.requireFollow),
      followMessage: formData.followMessage || undefined,
      publicReply: {
        enabled: Boolean(formData.publicReply?.enabled),
        message: formData.publicReply?.message || "Check your DMs!",
      },
      dmDelay: formData.dmDelay || "short",
    };

    if (formData.followFlow && formData.followFlow.enabled) {
      payload.followFlow = {
        enabled: true,
        profileUrl: formData.followFlow.profileUrl || "",
        followerMessage:
          formData.followFlow.followerMessage ||
          "Thanks for commenting! Here is your resource:",
        nonFollowerMessage:
          formData.followFlow.nonFollowerMessage ||
          "Hey! Please follow us to get the resource. Tap the button below:",
        followButtonText: formData.followFlow.followButtonText || "Follow Us",
        afterFollowMessage:
          formData.followFlow.afterFollowMessage ||
          "Awesome! Thanks for following. Here is your resource:",
        retryMessage:
          formData.followFlow.retryMessage ||
          "Still not following? Tap the button and follow us to unlock the resource!",
        maxRetries: Number(formData.followFlow.maxRetries) || 3,
      };
    }

    if (formData.shareTrigger && formData.shareTrigger.enabled) {
      payload.shareTrigger = {
        enabled: true,
        triggerOnDMShare:
          formData.shareTrigger.triggerOnDMShare === undefined
            ? true
            : Boolean(formData.shareTrigger.triggerOnDMShare),
        triggerOnStoryMention:
          formData.shareTrigger.triggerOnStoryMention === undefined
            ? true
            : Boolean(formData.shareTrigger.triggerOnStoryMention),
        shareMessage:
          formData.shareTrigger.shareMessage ||
          "Thanks for sharing our post! Here is your special resource:",
      };
    }

    if (formData.rateLimits && formData.rateLimits.enabled) {
      payload.rateLimits = {
        enabled: true,
        maxPerHour: Number(formData.rateLimits.maxPerHour) || 40,
        maxPerDay: Number(formData.rateLimits.maxPerDay) || 200,
        userCooldownMinutes: 0,
        skipRepeatUsers: false,
        repeatUserHours: 24,
      };
    }

    if (formData.schedule && formData.schedule.enabled) {
      payload.schedule = {
        enabled: true,
        startDate: formData.schedule.startDate || null,
        endDate: formData.schedule.endDate || null,
        activeHoursStart: formData.schedule.activeHoursStart || "00:00",
        activeHoursEnd: formData.schedule.activeHoursEnd || "23:59",
        activeDays:
          Array.isArray(formData.schedule.activeDays) &&
          formData.schedule.activeDays.length > 0
            ? formData.schedule.activeDays
            : [0, 1, 2, 3, 4, 5, 6],
        timezone: formData.schedule.timezone || "UTC",
      };
    }

    try {
      await createMutation.mutateAsync(payload);
      onClose();
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to create campaign";
      setServerError(message);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-primary-darkest/60 backdrop-blur-sm z-[100] flex items-start justify-center overflow-y-auto p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-5xl bg-white rounded-3xl shadow-glass-xl my-8"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xl border-b border-border-light rounded-t-3xl px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-manrope font-bold text-primary-darkest">
                Create Campaign
              </h2>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-surface-cream transition-colors"
              >
                <HiOutlineXMark className="w-5 h-5 text-text-muted" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              {steps.map((step, i) => (
                <div key={step.id} className="flex items-center flex-1">
                  <div
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                      currentStep === step.id
                        ? "bg-primary-darkest text-white"
                        : currentStep > step.id
                          ? "bg-primary-lightest/50 text-primary-dark"
                          : "bg-surface-cream text-text-muted"
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-white/20">
                      {currentStep > step.id ? (
                        <HiOutlineCheck className="w-3 h-3" />
                      ) : (
                        step.id
                      )}
                    </span>
                    <span className="text-xs font-jakarta font-semibold hidden sm:inline">
                      {step.label}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div
                      className={`flex-1 h-px mx-2 ${
                        currentStep > step.id
                          ? "bg-primary-dark"
                          : "bg-border-light"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="p-6">
            {serverError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200"
              >
                <p className="text-sm text-red-600 font-jakarta">
                  {serverError}
                </p>
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {currentStep === 1 && (
                  <AccountSelector
                    accounts={accounts || []}
                    selectedId={selectedAccountId}
                    onSelect={setSelectedAccountId}
                  />
                )}

                {currentStep === 2 && selectedAccountId && (
                  <PostSelector
                    accountId={selectedAccountId}
                    selectedPost={selectedPost}
                    onSelect={setSelectedPost}
                  />
                )}

                {currentStep === 3 && selectedPost && (
                  <AutomationSetup
                    post={selectedPost}
                    onSubmit={handleCreate}
                    isSubmitting={createMutation.isPending}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="sticky bottom-0 bg-white/95 backdrop-blur-xl border-t border-border-light rounded-b-3xl px-6 py-4 flex items-center justify-between">
            <Button
              variant="secondary"
              size="small"
              onClick={currentStep === 1 ? onClose : handleBack}
              icon={<HiOutlineArrowLeft />}
              iconPosition="left"
            >
              {currentStep === 1 ? "Cancel" : "Back"}
            </Button>

            {currentStep < 3 ? (
              <Button
                variant="primary"
                size="small"
                onClick={handleNext}
                disabled={!canGoNext()}
                icon={<HiOutlineArrowRight />}
              >
                Continue
              </Button>
            ) : (
              <Button
                type="submit"
                form="campaign-form"
                variant="primary"
                size="small"
                loading={createMutation.isPending}
                icon={<HiOutlineCheck />}
              >
                Create Campaign
              </Button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
