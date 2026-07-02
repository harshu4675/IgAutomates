import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import {
  HiOutlineXMark,
  HiOutlineBeaker,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
} from "react-icons/hi2";
import Button from "@/components/common/Button";
import { webhookService } from "@/services/webhookService";
import { useQueryClient } from "@tanstack/react-query";

export default function TestCampaignModal({ isOpen, onClose, campaign }) {
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      username: "test_user",
      commentText: campaign?.keyword || "",
    },
  });

  const onSubmit = async (data) => {
    setResult(null);
    setIsLoading(true);
    try {
      await webhookService.testCampaign({
        campaignId: campaign._id,
        username: data.username,
        commentText: data.commentText,
      });
      setResult({
        success: true,
        message: "Test comment processed successfully! Check analytics.",
      });
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-overview"] });
    } catch (error) {
      setResult({
        success: false,
        message: error.response?.data?.message || "Test failed",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    reset();
    onClose();
  };

  if (!isOpen || !campaign) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-primary-darkest/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          className="w-full max-w-md bg-white rounded-3xl shadow-glass-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-border-light flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-cta flex items-center justify-center">
                <HiOutlineBeaker className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-manrope font-bold text-primary-darkest">
                  Test Campaign
                </h2>
                <p className="text-xs text-text-muted font-jakarta">
                  Simulate a comment to test your automation
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-cream transition-colors"
            >
              <HiOutlineXMark className="w-5 h-5 text-text-muted" />
            </button>
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-jakarta font-semibold text-primary-darkest mb-2 uppercase tracking-wider">
                  Test Username
                </label>
                <input
                  className={`w-full px-4 py-3 rounded-xl bg-surface-cream border text-sm font-jakarta text-primary-darkest focus:outline-none focus:border-primary-mid focus:ring-2 focus:ring-primary-mid/20 transition-all ${
                    errors.username ? "border-red-400" : "border-border-light"
                  }`}
                  placeholder="test_user"
                  {...register("username", { required: "Username required" })}
                />
              </div>

              <div>
                <label className="block text-xs font-jakarta font-semibold text-primary-darkest mb-2 uppercase tracking-wider">
                  Comment Text
                </label>
                <textarea
                  rows={3}
                  className={`w-full px-4 py-3 rounded-xl bg-surface-cream border text-sm font-jakarta text-primary-darkest focus:outline-none focus:border-primary-mid focus:ring-2 focus:ring-primary-mid/20 transition-all resize-none ${
                    errors.commentText
                      ? "border-red-400"
                      : "border-border-light"
                  }`}
                  placeholder={`Try: "${campaign.keyword}"`}
                  {...register("commentText", { required: "Comment required" })}
                />
                <p className="mt-1 text-[10px] text-text-muted font-jakarta">
                  Trigger keyword:{" "}
                  <span className="font-bold text-primary-dark">
                    &quot;{campaign.keyword}&quot;
                  </span>{" "}
                  ({campaign.matchType})
                </p>
              </div>

              {result && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3 rounded-xl border flex items-start gap-2 ${
                    result.success
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  {result.success ? (
                    <HiOutlineCheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <HiOutlineExclamationCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <p
                    className={`text-xs font-jakarta ${
                      result.success ? "text-emerald-800" : "text-red-800"
                    }`}
                  >
                    {result.message}
                  </p>
                </motion.div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleClose}
                  className="flex-1 justify-center"
                >
                  Close
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={isLoading}
                  className="flex-1 justify-center"
                >
                  Run Test
                </Button>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
