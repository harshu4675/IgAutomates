import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineCalendarDays,
  HiOutlineChevronDown,
  HiOutlineCheck,
} from "react-icons/hi2";

const PRESETS = [
  { label: "Today", days: 1 },
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
  { label: "Last 6 months", days: 180 },
  { label: "Last year", days: 365 },
];

export default function DateRangePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentLabel = (() => {
    if (value?.label) return value.label;
    if (value?.startDate && value?.endDate) {
      const start = new Date(value.startDate);
      const end = new Date(value.endDate);
      return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
    }
    return "Last 30 days";
  })();

  const handlePresetSelect = (preset) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - preset.days);
    onChange({
      label: preset.label,
      days: preset.days,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
    setOpen(false);
  };

  const handleCustomApply = () => {
    if (!customStart || !customEnd) return;
    onChange({
      label: null,
      startDate: new Date(customStart).toISOString(),
      endDate: new Date(customEnd).toISOString(),
    });
    setOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-border-light hover:border-primary-mid transition-all text-xs font-jakarta font-semibold text-primary-darkest"
      >
        <HiOutlineCalendarDays className="w-4 h-4 text-primary-mid" />
        {currentLabel}
        <HiOutlineChevronDown
          className={`w-3 h-3 text-text-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl border border-border-light shadow-glass-lg z-30 overflow-hidden"
          >
            <div className="p-3 border-b border-border-light">
              <p className="text-[10px] font-jakarta font-bold text-text-muted uppercase tracking-wider mb-2">
                Quick Select
              </p>
              <div className="space-y-1">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => handlePresetSelect(preset)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-jakarta transition-colors ${
                      value?.label === preset.label
                        ? "bg-primary-lightest/50 text-primary-dark font-semibold"
                        : "text-text-primary hover:bg-surface-cream"
                    }`}
                  >
                    {preset.label}
                    {value?.label === preset.label && (
                      <HiOutlineCheck className="w-3.5 h-3.5" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3">
              <p className="text-[10px] font-jakarta font-bold text-text-muted uppercase tracking-wider mb-2">
                Custom Range
              </p>
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] font-jakarta text-text-muted">
                    From
                  </label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-surface-cream border border-border-light text-xs font-jakarta"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-jakarta text-text-muted">
                    To
                  </label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-surface-cream border border-border-light text-xs font-jakarta"
                  />
                </div>
                <button
                  onClick={handleCustomApply}
                  disabled={!customStart || !customEnd}
                  className="w-full py-2 rounded-lg bg-gradient-cta text-white text-xs font-jakarta font-semibold shadow-button hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Apply Custom Range
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
