import { motion } from "framer-motion";
import { cn } from "@/utils/cn";

export default function ProgressBar({
  value = 0,
  max = 100,
  size = "default",
  showLabel = false,
  className,
}) {
  const percentage = Math.min((value / max) * 100, 100);

  const sizes = {
    small: "h-1",
    default: "h-2",
    large: "h-3",
  };

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-text-muted font-jakarta">
            {value} / {max}
          </span>
          <span className="text-xs font-semibold text-primary-darkest font-jakarta">
            {percentage.toFixed(0)}%
          </span>
        </div>
      )}
      <div
        className={cn(
          "w-full bg-primary-lightest/40 rounded-full overflow-hidden",
          sizes[size],
        )}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="h-full bg-gradient-accent rounded-full"
        />
      </div>
    </div>
  );
}
