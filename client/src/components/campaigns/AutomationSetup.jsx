import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import {
  HiOutlineHashtag,
  HiOutlineChatBubbleLeftRight,
  HiOutlineLink,
  HiOutlineVariable,
} from "react-icons/hi2";

export default function AutomationSetup({
  post,
  onSubmit,
  isSubmitting,
  defaultValues,
}) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: defaultValues || {
      name: "",
      keyword: "",
      matchType: "contains",
      dmMessage: "",
      dmLink: "",
    },
  });

  const dmMessage = watch("dmMessage", "");
  const keyword = watch("keyword", "");

  return (
    <div>
      <h3 className="text-lg font-manrope font-bold text-primary-darkest mb-2">
        Automation Setup
      </h3>
      <p className="text-sm text-text-muted font-jakarta mb-6">
        Set up the trigger keyword and the DM message to send automatically.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          {post && (
            <div className="mb-6">
              <p className="text-xs font-jakarta font-semibold text-primary-darkest mb-3 uppercase tracking-wider">
                Selected Post
              </p>
              <div className="flex gap-3 p-3 rounded-2xl border border-border-light bg-white">
                <img
                  src={post.thumbnail_url || post.media_url}
                  alt="Selected post"
                  className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-primary-darkest font-jakarta line-clamp-3">
                    {post.caption || "No caption"}
                  </p>
                  <p className="text-[10px] text-text-muted font-jakarta mt-2">
                    {post.media_type}
                  </p>
                </div>
              </div>
            </div>
          )}

          <form
            id="campaign-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
          >
            <div>
              <label className="block text-xs font-jakarta font-semibold text-primary-darkest mb-2 uppercase tracking-wider">
                Campaign Name
              </label>
              <input
                className={`w-full px-4 py-3.5 rounded-xl bg-surface-cream border text-sm font-jakarta text-primary-darkest placeholder:text-text-muted/40 focus:outline-none focus:border-primary-mid focus:ring-2 focus:ring-primary-mid/20 transition-all ${
                  errors.name ? "border-red-400" : "border-border-light"
                }`}
                placeholder="e.g., Product Launch DM"
                {...register("name", { required: "Campaign name is required" })}
              />
              {errors.name && (
                <p className="mt-1.5 text-xs text-red-500 font-jakarta">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-jakarta font-semibold text-primary-darkest mb-2 uppercase tracking-wider">
                  <HiOutlineHashtag className="inline w-3 h-3 mr-1" />
                  Trigger Keyword
                </label>
                <input
                  className={`w-full px-4 py-3.5 rounded-xl bg-surface-cream border text-sm font-jakarta text-primary-darkest placeholder:text-text-muted/40 focus:outline-none focus:border-primary-mid focus:ring-2 focus:ring-primary-mid/20 transition-all ${
                    errors.keyword ? "border-red-400" : "border-border-light"
                  }`}
                  placeholder="price"
                  {...register("keyword", {
                    required: "Keyword required",
                    minLength: { value: 2, message: "Min 2 chars" },
                    maxLength: { value: 50, message: "Max 50 chars" },
                  })}
                />
                {errors.keyword && (
                  <p className="mt-1.5 text-xs text-red-500 font-jakarta">
                    {errors.keyword.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-jakarta font-semibold text-primary-darkest mb-2 uppercase tracking-wider">
                  Match
                </label>
                <select
                  className="w-full px-3 py-3.5 rounded-xl bg-surface-cream border border-border-light text-sm font-jakarta text-primary-darkest cursor-pointer focus:outline-none focus:border-primary-mid focus:ring-2 focus:ring-primary-mid/20 transition-all"
                  {...register("matchType")}
                >
                  <option value="contains">Contains</option>
                  <option value="exact">Exact</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-jakarta font-semibold text-primary-darkest uppercase tracking-wider">
                  <HiOutlineChatBubbleLeftRight className="inline w-3 h-3 mr-1" />
                  DM Message
                </label>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary-lightest/40 text-[10px] font-jakarta font-semibold text-primary-dark">
                  <HiOutlineVariable className="w-3 h-3" />
                  {"{{username}}"}
                </span>
              </div>
              <textarea
                rows={5}
                className={`w-full px-4 py-3.5 rounded-xl bg-surface-cream border text-sm font-jakarta text-primary-darkest placeholder:text-text-muted/40 focus:outline-none focus:border-primary-mid focus:ring-2 focus:ring-primary-mid/20 transition-all resize-none ${
                  errors.dmMessage ? "border-red-400" : "border-border-light"
                }`}
                placeholder="Hey {{username}}! Thanks for your interest..."
                {...register("dmMessage", {
                  required: "DM message is required",
                  minLength: { value: 10, message: "Min 10 characters" },
                  maxLength: { value: 1000, message: "Max 1000 characters" },
                })}
              />
              <div className="flex items-center justify-between mt-1">
                {errors.dmMessage && (
                  <p className="text-xs text-red-500 font-jakarta">
                    {errors.dmMessage.message}
                  </p>
                )}
                <p className="text-[10px] text-text-muted font-jakarta ml-auto">
                  {dmMessage.length}/1000
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-jakarta font-semibold text-primary-darkest mb-2 uppercase tracking-wider">
                <HiOutlineLink className="inline w-3 h-3 mr-1" />
                Link (optional)
              </label>
              <input
                type="url"
                className="w-full px-4 py-3.5 rounded-xl bg-surface-cream border border-border-light text-sm font-jakarta text-primary-darkest placeholder:text-text-muted/40 focus:outline-none focus:border-primary-mid focus:ring-2 focus:ring-primary-mid/20 transition-all"
                placeholder="https://example.com/product"
                {...register("dmLink")}
              />
              <p className="mt-1 text-[10px] text-text-muted font-jakarta">
                This link will be appended to the DM message
              </p>
            </div>
          </form>
        </div>

        <div className="lg:sticky lg:top-6 lg:h-fit">
          <p className="text-xs font-jakarta font-semibold text-primary-darkest mb-3 uppercase tracking-wider">
            Live Preview
          </p>

          <div className="bg-gradient-to-b from-primary-darkest to-primary-dark rounded-3xl p-1 shadow-glass-xl">
            <div className="bg-white rounded-[1.4rem] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border-light">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
                  <div>
                    <p className="text-xs font-jakarta font-bold text-primary-darkest">
                      Your Business
                    </p>
                    <p className="text-[10px] text-text-muted font-jakarta">
                      Active now
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-3 min-h-[280px] bg-surface-cream/30">
                <div className="flex justify-end">
                  <div className="max-w-[80%] bg-primary-lightest/40 rounded-2xl rounded-tr-md px-3 py-2">
                    <p className="text-xs font-jakarta text-primary-darkest">
                      {keyword
                        ? `Commented "${keyword}" on your post`
                        : "User comments trigger keyword..."}
                    </p>
                  </div>
                </div>

                {dmMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="max-w-[85%] bg-gradient-cta rounded-2xl rounded-tl-md px-4 py-3 shadow-button">
                      <p className="text-xs font-jakarta text-white whitespace-pre-wrap leading-relaxed">
                        {dmMessage.replace(/\{\{username\}\}/g, "john_doe")}
                      </p>
                      {watch("dmLink") && (
                        <p className="text-[11px] font-jakarta text-primary-lightest mt-2 underline break-all">
                          {watch("dmLink")}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          <p className="mt-4 text-xs text-text-muted font-jakarta text-center">
            When someone comments{" "}
            <span className="font-bold text-primary-dark">
              &quot;{keyword || "keyword"}&quot;
            </span>{" "}
            on your post, this DM will be sent automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
