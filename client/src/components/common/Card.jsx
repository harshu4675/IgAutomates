import { cn } from "@/utils/cn";

export default function Card({
  children,
  className,
  padding = "default",
  ...props
}) {
  const paddingClasses = {
    none: "",
    small: "p-4",
    default: "p-6",
    large: "p-8",
  };

  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-border-light shadow-card",
        paddingClasses[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
