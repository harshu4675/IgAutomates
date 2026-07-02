import { cn } from "@/utils/cn";

export default function Badge({
  children,
  variant = "default",
  size = "default",
  dot = false,
  className,
}) {
  const variants = {
    default: "bg-primary-lightest/40 text-primary-dark border-border-light",
    success: "bg-emerald-50 text-emerald-600 border-emerald-200",
    warning: "bg-amber-50 text-amber-600 border-amber-200",
    error: "bg-red-50 text-red-600 border-red-200",
    info: "bg-blue-50 text-blue-600 border-blue-200",
  };

  const sizes = {
    small: "px-2.5 py-1 text-[10px]",
    default: "px-3.5 py-1.5 text-xs",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border font-jakarta font-semibold uppercase tracking-widest",
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {dot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full animate-pulse-soft",
            variant === "default" && "bg-primary-mid",
            variant === "success" && "bg-emerald-500",
            variant === "warning" && "bg-amber-500",
            variant === "error" && "bg-red-500",
            variant === "info" && "bg-blue-500",
          )}
        />
      )}
      {children}
    </span>
  );
}
