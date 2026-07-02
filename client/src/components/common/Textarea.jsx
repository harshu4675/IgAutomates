import { forwardRef } from "react";
import { cn } from "@/utils/cn";

const Textarea = forwardRef(function Textarea(
  { label, error, className, rows = 4, ...props },
  ref,
) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-jakarta font-semibold text-primary-darkest mb-2 uppercase tracking-wider">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={cn(
          "w-full px-4 py-3.5 rounded-xl bg-white border text-sm font-jakarta text-primary-darkest",
          "placeholder:text-text-muted/40 resize-none",
          "focus:outline-none focus:ring-2 focus:ring-primary-mid/20",
          "transition-all duration-300",
          error
            ? "border-red-400 focus:border-red-400"
            : "border-border-light focus:border-primary-mid",
          className,
        )}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-xs text-red-500 font-jakarta">{error}</p>
      )}
    </div>
  );
});

export default Textarea;
