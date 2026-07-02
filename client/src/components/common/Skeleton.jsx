import { cn } from "@/utils/cn";

export default function Skeleton({ className, variant = "rect", ...props }) {
  const variants = {
    rect: "rounded-xl",
    circle: "rounded-full",
    text: "rounded-md h-4",
  };

  return (
    <div
      className={cn(
        "bg-primary-lightest/40 animate-pulse",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="glass-card rounded-3xl p-6 space-y-4">
      <Skeleton className="w-12 h-12" variant="rect" />
      <Skeleton className="w-3/4 h-5" variant="text" />
      <Skeleton className="w-full h-4" variant="text" />
      <Skeleton className="w-2/3 h-4" variant="text" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <Skeleton className="w-8 h-8" variant="circle" />
          <Skeleton className="flex-1 h-4" variant="text" />
          <Skeleton className="w-20 h-4" variant="text" />
          <Skeleton className="w-16 h-4" variant="text" />
        </div>
      ))}
    </div>
  );
}
