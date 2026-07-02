import { HiOutlineXMark } from "react-icons/hi2";
import { cn } from "@/utils/cn";

export default function Tag({
  children,
  onRemove,
  variant = "default",
  className,
}) {
  const variants = {
    default: "bg-primary-lightest/50 text-primary-dark border-border-light",
    active: "bg-primary-dark text-white border-primary-dark",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-jakarta font-semibold",
        variants[variant],
        className,
      )}
    >
      #{children}
      {onRemove && (
        <button
          onClick={onRemove}
          className="hover:opacity-70 transition-opacity"
          aria-label={`Remove ${children}`}
        >
          <HiOutlineXMark className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}
