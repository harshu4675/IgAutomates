import { cn } from "@/utils/cn";

export default function Toggle({
  checked,
  onChange,
  label,
  disabled,
  size = "default",
}) {
  const sizes = {
    small: {
      track: "w-8 h-4.5",
      thumb: "w-3.5 h-3.5",
      translate: "translate-x-3.5",
    },
    default: {
      track: "w-11 h-6",
      thumb: "w-5 h-5",
      translate: "translate-x-5",
    },
  };

  const s = sizes[size];

  return (
    <label
      className={cn(
        "inline-flex items-center gap-3 cursor-pointer",
        disabled && "opacity-50 cursor-not-allowed",
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          "relative inline-flex items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary-mid/20 focus:ring-offset-2",
          s.track,
          checked ? "bg-primary-dark" : "bg-primary-lightest",
        )}
      >
        <span
          className={cn(
            "inline-block rounded-full bg-white shadow-sm transition-transform duration-300",
            s.thumb,
            checked ? s.translate : "translate-x-0.5",
          )}
        />
      </button>
      {label && (
        <span className="text-sm font-jakarta text-text-primary">{label}</span>
      )}
    </label>
  );
}
