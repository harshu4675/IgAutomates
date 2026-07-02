import { motion } from "framer-motion";
import {
  HiOutlineArrowTrendingUp,
  HiOutlineArrowTrendingDown,
} from "react-icons/hi2";
import AnimatedCounter from "@/components/common/AnimatedCounter";

export default function StatsCard({
  icon: Icon,
  label,
  value,
  change,
  positive,
  gradient,
  suffix,
}) {
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      className="bg-white rounded-2xl border border-border-light p-5 shadow-card hover:shadow-card-hover transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div
          className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold font-jakarta ${
            positive
              ? "bg-emerald-50 text-emerald-600"
              : "bg-red-50 text-red-500"
          }`}
        >
          {positive ? (
            <HiOutlineArrowTrendingUp className="w-3 h-3" />
          ) : (
            <HiOutlineArrowTrendingDown className="w-3 h-3" />
          )}
          {change}
        </div>
      </div>

      <p className="text-2xl font-manrope font-extrabold text-primary-darkest mb-1">
        <AnimatedCounter
          end={typeof value === "number" ? value : 0}
          suffix={suffix || ""}
          duration={1500}
        />
      </p>
      <p className="text-xs text-text-muted font-jakarta">{label}</p>
    </motion.div>
  );
}
