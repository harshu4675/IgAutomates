import { cn } from "@/utils/cn";

export default function Avatar({
  src,
  alt,
  name,
  size = "default",
  className,
}) {
  const sizes = {
    small: "w-8 h-8 text-xs",
    default: "w-10 h-10 text-sm",
    large: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-lg",
  };

  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "";

  if (src) {
    return (
      <img
        src={src}
        alt={alt || name || "Avatar"}
        className={cn("rounded-full object-cover", sizes[size], className)}
        loading="lazy"
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full bg-gradient-accent flex items-center justify-center font-manrope font-bold text-white",
        sizes[size],
        className,
      )}
      aria-label={alt || name || "Avatar"}
    >
      {initials}
    </div>
  );
}
