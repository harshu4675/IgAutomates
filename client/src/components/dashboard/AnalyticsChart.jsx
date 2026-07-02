import { useState } from "react";
import { motion } from "framer-motion";

const weeklyData = [
  { day: "Mon", dms: 145, leads: 42 },
  { day: "Tue", dms: 232, leads: 68 },
  { day: "Wed", dms: 178, leads: 52 },
  { day: "Thu", dms: 289, leads: 85 },
  { day: "Fri", dms: 215, leads: 63 },
  { day: "Sat", dms: 342, leads: 98 },
  { day: "Sun", dms: 267, leads: 78 },
];

const monthlyData = [
  { day: "W1", dms: 890, leads: 267 },
  { day: "W2", dms: 1234, leads: 370 },
  { day: "W3", dms: 1067, leads: 320 },
  { day: "W4", dms: 1456, leads: 437 },
];

export default function AnalyticsChart() {
  const [period, setPeriod] = useState("weekly");
  const data = period === "weekly" ? weeklyData : monthlyData;
  const maxDM = Math.max(...data.map((d) => d.dms));

  return (
    <div className="bg-white rounded-2xl border border-border-light shadow-card p-5">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-manrope font-bold text-primary-darkest">
          Performance Overview
        </h3>
        <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-cream">
          {["weekly", "monthly"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-jakarta font-semibold capitalize transition-all duration-200 ${
                period === p
                  ? "bg-white text-primary-darkest shadow-sm"
                  : "text-text-muted hover:text-primary-darkest"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-6 mb-4">
        <span className="flex items-center gap-1.5 text-[11px] text-text-muted font-jakarta">
          <span className="w-3 h-2 rounded-sm bg-primary-dark" /> DMs Sent
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-text-muted font-jakarta">
          <span className="w-3 h-2 rounded-sm bg-primary-lightest" /> Leads
        </span>
      </div>

      <div className="flex items-end gap-3 h-52">
        {data.map((bar, i) => (
          <div
            key={bar.day}
            className="flex-1 flex flex-col items-center gap-1.5"
          >
            <div className="w-full flex gap-1 items-end h-44">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(bar.dms / maxDM) * 100}%` }}
                transition={{
                  delay: i * 0.08,
                  duration: 0.5,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="flex-1 bg-gradient-to-t from-primary-dark to-primary-mid rounded-t-md hover:opacity-80 transition-opacity cursor-pointer"
              />
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(bar.leads / maxDM) * 100}%` }}
                transition={{
                  delay: i * 0.08 + 0.1,
                  duration: 0.5,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="flex-1 bg-gradient-to-t from-primary-lightest/60 to-primary-lightest rounded-t-md hover:opacity-80 transition-opacity cursor-pointer"
              />
            </div>
            <span className="text-[10px] text-text-muted font-jakarta">
              {bar.day}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
