import { cn } from "@/utils/cn";

export default function StatusDot({
  status = "active",
  size = "default",
  label,
}) {
  const statusColors = {
    active: "bg-emerald-400",
    inactive: "bg-gray-300",
    pending: "bg-amber-400",
    error: "bg-red-400",
  };

  const sizes = {
    small: "w-1.5 h-1.5",
    default: "w-2 h-2",
    large: "w-3 h-3",
  };

  return (
    <div className="inline-flex items-center gap-2">
      <span className="relative flex">
        {status === "active" && (
          <span
            className={cn(
              "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
              statusColors[status],
            )}
          />
        )}
        <span
          className={cn(
            "relative inline-flex rounded-full",
            statusColors[status],
            sizes[size],
          )}
        />
      </span>
      {label && (
        <span className="text-xs font-jakarta text-text-muted capitalize">
          {label}
        </span>
      )}
    </div>
  );
}
