import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineHashtag,
  HiOutlineChatBubbleLeftRight,
  HiOutlineLink,
  HiOutlineVariable,
  HiOutlineSparkles,
  HiOutlineUserPlus,
  HiOutlineChatBubbleBottomCenterText,
  HiOutlineClock,
  HiOutlineChevronDown,
  HiOutlineCog6Tooth,
  HiOutlineBolt,
  HiOutlineCalendarDays,
  HiOutlineDocumentDuplicate,
  HiPlus,
  HiXMark,
  HiOutlineTrash,
} from "react-icons/hi2";

const MATCH_TYPES = [
  { value: "contains", label: "Contains", desc: "Comment includes keyword" },
  { value: "exact", label: "Exact", desc: "Comment equals keyword" },
  { value: "starts_with", label: "Starts With", desc: "Comment starts with" },
  { value: "ends_with", label: "Ends With", desc: "Comment ends with" },
  { value: "any", label: "Any Comment", desc: "Reply to all comments" },
];

const DELAY_OPTIONS = [
  { value: "instant", label: "Instant", desc: "0 seconds" },
  { value: "short", label: "Short", desc: "2-5 seconds" },
  { value: "medium", label: "Medium", desc: "5-15 seconds" },
  { value: "long", label: "Long", desc: "15-30 seconds" },
];

const RATE_LIMIT_PRESETS = [
  {
    label: "Conservative",
    values: {
      maxPerHour: 20,
      maxPerDay: 100,
      userCooldownMinutes: 5,
    },
    desc: "Safest for new accounts",
  },
  {
    label: "Moderate",
    values: {
      maxPerHour: 40,
      maxPerDay: 200,
      userCooldownMinutes: 2,
    },
    desc: "Recommended default",
  },
  {
    label: "Aggressive",
    values: {
      maxPerHour: 80,
      maxPerDay: 400,
      userCooldownMinutes: 1,
    },
    desc: "For verified accounts only",
  },
];

const DAYS_OF_WEEK = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

const getUserTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
};

export default function AutomationSetup({
  post,
  onSubmit,
  isSubmitting,
  defaultValues,
}) {
  const initialKeywords = (() => {
    if (defaultValues?.keywords && Array.isArray(defaultValues.keywords)) {
      return defaultValues.keywords;
    }
    if (defaultValues?.keyword) {
      return [defaultValues.keyword];
    }
    return [];
  })();

  const initialTemplates = (() => {
    if (
      defaultValues?.dmTemplates &&
      Array.isArray(defaultValues.dmTemplates) &&
      defaultValues.dmTemplates.length > 0
    ) {
      return defaultValues.dmTemplates;
    }
    return [];
  })();

  const [keywords, setKeywords] = useState(initialKeywords);
  const [keywordInput, setKeywordInput] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [rateLimitsOpen, setRateLimitsOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: defaultValues || {
      name: "",
      matchType: "contains",
      dmMessage: "",
      dmLink: "",
      dmTemplates: [],
      templateRotation: "random",
      requireFollow: false,
      followMessage:
        "Please follow us first! Once you follow, reply to this message with any word to get the link.",
      publicReply: {
        enabled: false,
        message: "Check your DMs!",
      },
      dmDelay: "short",
      rateLimits: {
        enabled: false,
        maxPerHour: 40,
        maxPerDay: 200,
        userCooldownMinutes: 2,
        skipRepeatUsers: true,
        repeatUserHours: 24,
      },
      schedule: {
        enabled: false,
        startDate: "",
        endDate: "",
        activeHoursStart: "00:00",
        activeHoursEnd: "23:59",
        activeDays: [0, 1, 2, 3, 4, 5, 6],
        timezone: getUserTimezone(),
      },
    },
  });

  const {
    fields: templateFields,
    append: appendTemplate,
    remove: removeTemplate,
  } = useFieldArray({
    control,
    name: "dmTemplates",
  });

  const dmMessage = watch("dmMessage", "");
  const matchType = watch("matchType", "contains");
  const requireFollow = watch("requireFollow", false);
  const publicReplyEnabled = watch("publicReply.enabled", false);
  const publicReplyMessage = watch("publicReply.message", "Check your DMs!");
  const followMessage = watch("followMessage", "");
  const dmDelay = watch("dmDelay", "short");
  const rateLimitsEnabled = watch("rateLimits.enabled", false);
  const scheduleEnabled = watch("schedule.enabled", false);
  const activeDays = watch("schedule.activeDays", []);
  const isAnyMode = matchType === "any";

  useEffect(() => {
    setValue("keywords", keywords);
  }, [keywords, setValue]);

  useEffect(() => {
    if (!watch("schedule.timezone")) {
      setValue("schedule.timezone", getUserTimezone());
    }
  }, [setValue, watch]);

  const addKeyword = (value) => {
    const clean = String(value || "")
      .toLowerCase()
      .trim();
    if (!clean) return;
    if (keywords.includes(clean)) return;
    if (clean.length > 50) return;
    setKeywords([...keywords, clean]);
    setKeywordInput("");
  };

  const removeKeyword = (kw) => {
    setKeywords(keywords.filter((k) => k !== kw));
  };

  const handleKeywordKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addKeyword(keywordInput);
    } else if (e.key === "Backspace" && !keywordInput && keywords.length > 0) {
      setKeywords(keywords.slice(0, -1));
    }
  };

  const applyRateLimitPreset = (preset) => {
    setValue("rateLimits.maxPerHour", preset.values.maxPerHour);
    setValue("rateLimits.maxPerDay", preset.values.maxPerDay);
    setValue(
      "rateLimits.userCooldownMinutes",
      preset.values.userCooldownMinutes,
    );
  };

  const toggleDay = (day) => {
    const current = activeDays || [];
    if (current.includes(day)) {
      setValue(
        "schedule.activeDays",
        current.filter((d) => d !== day),
      );
    } else {
      setValue("schedule.activeDays", [...current, day].sort());
    }
  };

  const handleFormSubmit = (data) => {
    if (!isAnyMode && keywords.length === 0) return;

    const cleanTemplates = (data.dmTemplates || [])
      .filter((t) => t?.message && t.message.trim().length >= 10)
      .map((t) => ({ message: t.message.trim(), timesUsed: t.timesUsed || 0 }));

    onSubmit({
      ...data,
      keywords: isAnyMode ? [] : keywords,
      keyword: isAnyMode ? "" : keywords[0] || "",
      dmTemplates: cleanTemplates,
    });
  };

  const previewKeyword = isAnyMode ? "any word" : keywords[0] || "keyword";

  const advancedCount =
    (requireFollow ? 1 : 0) +
    (publicReplyEnabled ? 1 : 0) +
    (dmDelay !== "short" ? 1 : 0);

  const templateCount = templateFields.length;
  const scheduleActive = scheduleEnabled ? 1 : 0;
  const rateLimitActive = rateLimitsEnabled ? 1 : 0;

  return (
    <div>
      <h3 className="text-lg font-manrope font-bold text-primary-darkest mb-2">
        Automation Setup
      </h3>
      <p className="text-sm text-text-muted font-jakarta mb-6">
        Configure trigger keywords, message templates, and advanced automation
        rules.
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
            onSubmit={handleSubmit(handleFormSubmit)}
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

            <div>
              <label className="block text-xs font-jakarta font-semibold text-primary-darkest mb-2 uppercase tracking-wider">
                Match Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {MATCH_TYPES.map((mt) => (
                  <label
                    key={mt.value}
                    className={`relative flex flex-col p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      matchType === mt.value
                        ? "border-primary-mid bg-primary-lightest/30"
                        : "border-border-light bg-surface-cream hover:border-primary-light"
                    }`}
                  >
                    <input
                      type="radio"
                      value={mt.value}
                      className="sr-only"
                      {...register("matchType")}
                    />
                    <span className="text-sm font-jakarta font-semibold text-primary-darkest">
                      {mt.label}
                    </span>
                    <span className="text-[10px] text-text-muted font-jakarta mt-0.5 leading-tight">
                      {mt.desc}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <AnimatePresence mode="wait">
              {!isAnyMode ? (
                <motion.div
                  key="keywords-input"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <label className="block text-xs font-jakarta font-semibold text-primary-darkest mb-2 uppercase tracking-wider">
                    <HiOutlineHashtag className="inline w-3 h-3 mr-1" />
                    Trigger Keywords
                  </label>

                  <div className="min-h-[52px] w-full px-3 py-2 rounded-xl bg-surface-cream border border-border-light text-sm font-jakarta focus-within:border-primary-mid focus-within:ring-2 focus-within:ring-primary-mid/20 transition-all">
                    <div className="flex flex-wrap gap-2 items-center">
                      {keywords.map((kw) => (
                        <motion.span
                          key={kw}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          className="inline-flex items-center gap-1 pl-3 pr-1 py-1 rounded-lg bg-primary-mid/15 text-primary-darkest text-xs font-jakarta font-semibold"
                        >
                          {kw}
                          <button
                            type="button"
                            onClick={() => removeKeyword(kw)}
                            className="p-0.5 rounded hover:bg-primary-mid/25 transition-colors"
                          >
                            <HiXMark className="w-3.5 h-3.5" />
                          </button>
                        </motion.span>
                      ))}
                      <input
                        value={keywordInput}
                        onChange={(e) => setKeywordInput(e.target.value)}
                        onKeyDown={handleKeywordKeyDown}
                        onBlur={() => addKeyword(keywordInput)}
                        placeholder={
                          keywords.length === 0
                            ? "Type keyword and press Enter"
                            : "Add another..."
                        }
                        className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm font-jakarta text-primary-darkest placeholder:text-text-muted/40 py-1.5"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-1.5">
                    <p className="text-[10px] text-text-muted font-jakarta">
                      Press Enter or comma to add multiple keywords.
                    </p>
                    <p className="text-[10px] text-text-muted font-jakarta">
                      {keywords.length} added
                    </p>
                  </div>

                  {keywords.length === 0 && (
                    <p className="mt-1.5 text-xs text-orange-500 font-jakarta">
                      At least one keyword is required
                    </p>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="any-info"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="p-4 rounded-xl bg-gradient-to-br from-primary-lightest/40 to-primary-light/20 border border-primary-mid/30"
                >
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary-mid/20 flex items-center justify-center flex-shrink-0">
                      <HiOutlineSparkles className="w-4 h-4 text-primary-dark" />
                    </div>
                    <div>
                      <p className="text-sm font-jakarta font-bold text-primary-darkest">
                        Auto-reply to every comment
                      </p>
                      <p className="text-xs text-text-muted font-jakarta mt-1 leading-relaxed">
                        This campaign will send a DM to anyone who comments on
                        the selected post.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-jakarta font-semibold text-primary-darkest uppercase tracking-wider">
                  <HiOutlineChatBubbleLeftRight className="inline w-3 h-3 mr-1" />
                  DM Message (Default)
                </label>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary-lightest/40 text-[10px] font-jakarta font-semibold text-primary-dark">
                  <HiOutlineVariable className="w-3 h-3" />
                  {"{{username}}"}
                </span>
              </div>
              <textarea
                rows={4}
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
            </div>

            <div className="border-t border-border-light pt-5">
              <SectionToggle
                icon={HiOutlineDocumentDuplicate}
                title="Message Templates"
                count={templateCount}
                countLabel={
                  templateCount > 0 ? `${templateCount} templates` : null
                }
                open={templatesOpen}
                onToggle={() => setTemplatesOpen(!templatesOpen)}
              />

              <AnimatePresence>
                {templatesOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 space-y-3">
                      <div className="p-3 rounded-xl bg-primary-lightest/20 border border-primary-mid/20">
                        <p className="text-xs text-primary-dark font-jakarta leading-relaxed">
                          Add message variations to rotate between. This helps
                          avoid spam detection and looks more natural. The
                          default message is used if no templates are added.
                        </p>
                      </div>

                      {templateFields.map((field, index) => (
                        <div
                          key={field.id}
                          className="p-3 rounded-xl border border-border-light bg-white"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-jakarta font-bold text-primary-darkest uppercase tracking-wider">
                              Template {index + 1}
                              {field.timesUsed > 0 && (
                                <span className="ml-2 text-text-muted font-normal normal-case">
                                  ({field.timesUsed} uses)
                                </span>
                              )}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeTemplate(index)}
                              className="p-1 rounded hover:bg-red-50 text-red-500 transition-colors"
                            >
                              <HiOutlineTrash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <textarea
                            rows={3}
                            className="w-full px-3 py-2 rounded-lg bg-surface-cream border border-border-light text-xs font-jakarta text-primary-darkest focus:outline-none focus:border-primary-mid focus:ring-2 focus:ring-primary-mid/20 transition-all resize-none"
                            placeholder="Template message..."
                            {...register(`dmTemplates.${index}.message`, {
                              minLength: {
                                value: 10,
                                message: "Min 10 chars",
                              },
                            })}
                          />
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() =>
                          appendTemplate({ message: "", timesUsed: 0 })
                        }
                        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 border-dashed border-border-light hover:border-primary-mid hover:bg-primary-lightest/10 transition-all text-xs font-jakarta font-semibold text-primary-dark"
                      >
                        <HiPlus className="w-4 h-4" />
                        Add Template
                      </button>

                      {templateFields.length > 1 && (
                        <div>
                          <label className="block text-[10px] font-jakarta font-bold text-primary-darkest uppercase tracking-wider mb-2">
                            Rotation Method
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              {
                                value: "random",
                                label: "Random",
                                desc: "Pick randomly",
                              },
                              {
                                value: "sequential",
                                label: "Sequential",
                                desc: "In order",
                              },
                            ].map((opt) => (
                              <label
                                key={opt.value}
                                className={`p-2.5 rounded-lg border-2 cursor-pointer transition-all ${
                                  watch("templateRotation") === opt.value
                                    ? "border-primary-mid bg-primary-lightest/30"
                                    : "border-border-light bg-surface-cream hover:border-primary-light"
                                }`}
                              >
                                <input
                                  type="radio"
                                  value={opt.value}
                                  className="sr-only"
                                  {...register("templateRotation")}
                                />
                                <p className="text-xs font-jakarta font-semibold text-primary-darkest">
                                  {opt.label}
                                </p>
                                <p className="text-[10px] text-text-muted font-jakarta">
                                  {opt.desc}
                                </p>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="border-t border-border-light pt-5">
              <SectionToggle
                icon={HiOutlineCog6Tooth}
                title="Advanced Options"
                count={advancedCount}
                countLabel={
                  advancedCount > 0 ? `${advancedCount} enabled` : null
                }
                open={advancedOpen}
                onToggle={() => setAdvancedOpen(!advancedOpen)}
              />

              <AnimatePresence>
                {advancedOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 space-y-5">
                      <div className="p-4 rounded-xl border border-border-light bg-white">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            className="mt-1 w-4 h-4 rounded border-border-light text-primary-mid focus:ring-primary-mid"
                            {...register("requireFollow")}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <HiOutlineUserPlus className="w-4 h-4 text-primary-dark" />
                              <span className="text-sm font-jakarta font-semibold text-primary-darkest">
                                Require Follow Before DM
                              </span>
                            </div>
                            <p className="text-xs text-text-muted font-jakarta mt-1 leading-relaxed">
                              Send follow request first. Actual link sent after
                              user replies to that DM.
                            </p>
                          </div>
                        </label>

                        <AnimatePresence>
                          {requireFollow && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-3 pl-7"
                            >
                              <textarea
                                rows={3}
                                className="w-full px-3 py-2.5 rounded-lg bg-surface-cream border border-border-light text-xs font-jakarta text-primary-darkest focus:outline-none focus:border-primary-mid focus:ring-2 focus:ring-primary-mid/20 transition-all resize-none"
                                placeholder="Please follow us first..."
                                {...register("followMessage")}
                              />
                              <p className="mt-1 text-[10px] text-text-muted font-jakarta">
                                {followMessage?.length || 0}/1000
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="p-4 rounded-xl border border-border-light bg-white">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            className="mt-1 w-4 h-4 rounded border-border-light text-primary-mid focus:ring-primary-mid"
                            {...register("publicReply.enabled")}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <HiOutlineChatBubbleBottomCenterText className="w-4 h-4 text-primary-dark" />
                              <span className="text-sm font-jakarta font-semibold text-primary-darkest">
                                Reply Publicly to Comment
                              </span>
                            </div>
                            <p className="text-xs text-text-muted font-jakarta mt-1 leading-relaxed">
                              Post a public reply in addition to sending DM.
                            </p>
                          </div>
                        </label>

                        <AnimatePresence>
                          {publicReplyEnabled && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-3 pl-7"
                            >
                              <input
                                className="w-full px-3 py-2.5 rounded-lg bg-surface-cream border border-border-light text-xs font-jakarta text-primary-darkest focus:outline-none focus:border-primary-mid focus:ring-2 focus:ring-primary-mid/20 transition-all"
                                placeholder="Check your DMs!"
                                maxLength={300}
                                {...register("publicReply.message")}
                              />
                              <p className="mt-1 text-[10px] text-text-muted font-jakarta">
                                {publicReplyMessage?.length || 0}/300
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="p-4 rounded-xl border border-border-light bg-white">
                        <div className="flex items-center gap-2 mb-3">
                          <HiOutlineClock className="w-4 h-4 text-primary-dark" />
                          <span className="text-sm font-jakarta font-semibold text-primary-darkest">
                            DM Delay
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {DELAY_OPTIONS.map((opt) => (
                            <label
                              key={opt.value}
                              className={`p-2.5 rounded-lg border-2 cursor-pointer transition-all ${
                                dmDelay === opt.value
                                  ? "border-primary-mid bg-primary-lightest/30"
                                  : "border-border-light bg-surface-cream hover:border-primary-light"
                              }`}
                            >
                              <input
                                type="radio"
                                value={opt.value}
                                className="sr-only"
                                {...register("dmDelay")}
                              />
                              <span className="text-xs font-jakarta font-semibold text-primary-darkest">
                                {opt.label}
                              </span>
                              <span className="block text-[10px] text-text-muted font-jakarta">
                                {opt.desc}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="border-t border-border-light pt-5">
              <SectionToggle
                icon={HiOutlineBolt}
                title="Rate Limits"
                count={rateLimitActive}
                countLabel={rateLimitsEnabled ? "Active" : null}
                open={rateLimitsOpen}
                onToggle={() => setRateLimitsOpen(!rateLimitsOpen)}
              />

              <AnimatePresence>
                {rateLimitsOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 space-y-4">
                      <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-white border border-border-light">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-border-light text-primary-mid focus:ring-primary-mid"
                          {...register("rateLimits.enabled")}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-jakarta font-semibold text-primary-darkest">
                            Enable Rate Limits
                          </p>
                          <p className="text-xs text-text-muted font-jakarta">
                            Prevent Instagram bans by limiting DM frequency
                          </p>
                        </div>
                      </label>

                      <AnimatePresence>
                        {rateLimitsEnabled && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-3"
                          >
                            <div>
                              <p className="text-[10px] font-jakarta font-bold text-primary-darkest uppercase tracking-wider mb-2">
                                Presets
                              </p>
                              <div className="grid grid-cols-3 gap-2">
                                {RATE_LIMIT_PRESETS.map((preset) => (
                                  <button
                                    key={preset.label}
                                    type="button"
                                    onClick={() => applyRateLimitPreset(preset)}
                                    className="p-2 rounded-lg border-2 border-border-light bg-surface-cream hover:border-primary-mid transition-all"
                                  >
                                    <p className="text-xs font-jakarta font-semibold text-primary-darkest">
                                      {preset.label}
                                    </p>
                                    <p className="text-[9px] text-text-muted font-jakarta">
                                      {preset.desc}
                                    </p>
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] font-jakarta font-bold text-primary-darkest uppercase tracking-wider mb-1">
                                  Max per Hour
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  max="1000"
                                  className="w-full px-3 py-2 rounded-lg bg-surface-cream border border-border-light text-xs font-jakarta"
                                  {...register("rateLimits.maxPerHour", {
                                    valueAsNumber: true,
                                  })}
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-jakarta font-bold text-primary-darkest uppercase tracking-wider mb-1">
                                  Max per Day
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  max="10000"
                                  className="w-full px-3 py-2 rounded-lg bg-surface-cream border border-border-light text-xs font-jakarta"
                                  {...register("rateLimits.maxPerDay", {
                                    valueAsNumber: true,
                                  })}
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-jakarta font-bold text-primary-darkest uppercase tracking-wider mb-1">
                                  User Cooldown (min)
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  max="1440"
                                  className="w-full px-3 py-2 rounded-lg bg-surface-cream border border-border-light text-xs font-jakarta"
                                  {...register(
                                    "rateLimits.userCooldownMinutes",
                                    { valueAsNumber: true },
                                  )}
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-jakarta font-bold text-primary-darkest uppercase tracking-wider mb-1">
                                  Repeat Block (hrs)
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  max="720"
                                  className="w-full px-3 py-2 rounded-lg bg-surface-cream border border-border-light text-xs font-jakarta"
                                  {...register("rateLimits.repeatUserHours", {
                                    valueAsNumber: true,
                                  })}
                                />
                              </div>
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-border-light text-primary-mid focus:ring-primary-mid"
                                {...register("rateLimits.skipRepeatUsers")}
                              />
                              <span className="text-xs font-jakarta text-primary-darkest">
                                Skip users who got DM in last 24 hours
                              </span>
                            </label>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="border-t border-border-light pt-5">
              <SectionToggle
                icon={HiOutlineCalendarDays}
                title="Schedule"
                count={scheduleActive}
                countLabel={scheduleEnabled ? "Active" : null}
                open={scheduleOpen}
                onToggle={() => setScheduleOpen(!scheduleOpen)}
              />

              <AnimatePresence>
                {scheduleOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 space-y-4">
                      <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-white border border-border-light">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-border-light text-primary-mid focus:ring-primary-mid"
                          {...register("schedule.enabled")}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-jakarta font-semibold text-primary-darkest">
                            Enable Schedule
                          </p>
                          <p className="text-xs text-text-muted font-jakarta">
                            Only run campaign during specific times
                          </p>
                        </div>
                      </label>

                      <AnimatePresence>
                        {scheduleEnabled && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-3"
                          >
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] font-jakarta font-bold text-primary-darkest uppercase tracking-wider mb-1">
                                  Start Date
                                </label>
                                <input
                                  type="datetime-local"
                                  className="w-full px-3 py-2 rounded-lg bg-surface-cream border border-border-light text-xs font-jakarta"
                                  {...register("schedule.startDate")}
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-jakarta font-bold text-primary-darkest uppercase tracking-wider mb-1">
                                  End Date
                                </label>
                                <input
                                  type="datetime-local"
                                  className="w-full px-3 py-2 rounded-lg bg-surface-cream border border-border-light text-xs font-jakarta"
                                  {...register("schedule.endDate")}
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-jakarta font-bold text-primary-darkest uppercase tracking-wider mb-1">
                                  Active Hours From
                                </label>
                                <input
                                  type="time"
                                  className="w-full px-3 py-2 rounded-lg bg-surface-cream border border-border-light text-xs font-jakarta"
                                  {...register("schedule.activeHoursStart")}
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-jakarta font-bold text-primary-darkest uppercase tracking-wider mb-1">
                                  Active Hours To
                                </label>
                                <input
                                  type="time"
                                  className="w-full px-3 py-2 rounded-lg bg-surface-cream border border-border-light text-xs font-jakarta"
                                  {...register("schedule.activeHoursEnd")}
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-jakarta font-bold text-primary-darkest uppercase tracking-wider mb-2">
                                Active Days
                              </label>
                              <div className="grid grid-cols-7 gap-1">
                                {DAYS_OF_WEEK.map((day) => (
                                  <button
                                    key={day.value}
                                    type="button"
                                    onClick={() => toggleDay(day.value)}
                                    className={`px-2 py-2 rounded-lg text-[10px] font-jakarta font-bold transition-all ${
                                      activeDays?.includes(day.value)
                                        ? "bg-primary-darkest text-white"
                                        : "bg-surface-cream text-text-muted hover:bg-primary-lightest/30"
                                    }`}
                                  >
                                    {day.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="p-2.5 rounded-lg bg-primary-lightest/20 border border-primary-mid/20">
                              <p className="text-[10px] text-primary-dark font-jakarta">
                                Timezone: {watch("schedule.timezone") || "UTC"}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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
                      {isAnyMode
                        ? "Any comment on your post"
                        : keywords.length > 0
                          ? `Commented "${keywords[0]}" on your post`
                          : "User comments trigger keyword..."}
                    </p>
                  </div>
                </div>

                {publicReplyEnabled && publicReplyMessage && (
                  <div className="flex justify-end">
                    <div className="max-w-[80%]">
                      <p className="text-[9px] font-jakarta text-text-muted mb-1 text-right">
                        Public reply
                      </p>
                      <div className="bg-primary-mid/20 rounded-2xl rounded-tr-md px-3 py-2 border border-primary-mid/30">
                        <p className="text-xs font-jakarta text-primary-darkest">
                          {publicReplyMessage}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {requireFollow && followMessage && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%]">
                      <p className="text-[9px] font-jakarta text-text-muted mb-1">
                        Follow request DM
                      </p>
                      <div className="bg-amber-100 border border-amber-200 rounded-2xl rounded-tl-md px-4 py-3">
                        <p className="text-xs font-jakarta text-amber-900 whitespace-pre-wrap leading-relaxed">
                          {followMessage}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {dmMessage && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%]">
                      {requireFollow && (
                        <p className="text-[9px] font-jakarta text-text-muted mb-1">
                          Sent after user replies
                        </p>
                      )}
                      {templateCount > 0 && (
                        <p className="text-[9px] font-jakarta text-text-muted mb-1">
                          Rotates between {templateCount + 1} messages
                        </p>
                      )}
                      <div className="bg-gradient-cta rounded-2xl rounded-tl-md px-4 py-3 shadow-button">
                        <p className="text-xs font-jakarta text-white whitespace-pre-wrap leading-relaxed">
                          {dmMessage.replace(/\{\{username\}\}/g, "john_doe")}
                        </p>
                        {watch("dmLink") && (
                          <p className="text-[11px] font-jakarta text-primary-lightest mt-2 underline break-all">
                            {watch("dmLink")}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <p className="mt-4 text-xs text-text-muted font-jakarta text-center">
            When someone comments{" "}
            <span className="font-bold text-primary-dark">
              &quot;{previewKeyword}&quot;
            </span>
            , this flow will run.
          </p>
        </div>
      </div>
    </div>
  );
}

function SectionToggle({ icon: Icon, title, countLabel, open, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between p-3 rounded-xl bg-surface-cream border border-border-light hover:border-primary-mid transition-all"
    >
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary-dark" />
        <span className="text-sm font-jakarta font-semibold text-primary-darkest">
          {title}
        </span>
        {countLabel && (
          <span className="px-2 py-0.5 rounded-md bg-primary-mid/20 text-[10px] font-jakarta font-bold text-primary-dark">
            {countLabel}
          </span>
        )}
      </div>
      <motion.div
        animate={{ rotate: open ? 180 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <HiOutlineChevronDown className="w-4 h-4 text-text-muted" />
      </motion.div>
    </button>
  );
}
