import { motion } from "framer-motion";
import { HiOutlineArrowTrendingUp } from "react-icons/hi2";
import { formatNumber } from "@/utils/formatNumber";

export default function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  gradient,
  suffix,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-border-light p-5 shadow-card hover:shadow-card-hover transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
        {subValue && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 text-[10px] font-semibold font-jakarta text-emerald-600">
            <HiOutlineArrowTrendingUp className="w-3 h-3" />
            {subValue}
          </div>
        )}
      </div>

      <p className="text-2xl font-manrope font-extrabold text-primary-darkest mb-1">
        {typeof value === "number" ? formatNumber(value) : value}
        {suffix && <span className="text-lg">{suffix}</span>}
      </p>
      <p className="text-xs text-text-muted font-jakarta">{label}</p>
    </motion.div>
  );
}
