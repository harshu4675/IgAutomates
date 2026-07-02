import { motion } from "framer-motion";
import Button from "./Button";

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      {icon && (
        <div className="w-16 h-16 rounded-2xl bg-primary-lightest/50 flex items-center justify-center mb-5">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-manrope font-bold text-primary-darkest mb-2">
        {title}
      </h3>
      <p className="text-sm text-text-muted font-jakarta max-w-sm mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}
