import { forwardRef } from "react";
import { cn } from "@/utils/cn";

const Input = forwardRef(function Input(
  { label, error, icon, className, ...props },
  ref,
) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-jakarta font-semibold text-primary-darkest mb-2 uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full py-3.5 rounded-xl bg-white border text-sm font-jakarta text-primary-darkest",
            "placeholder:text-text-muted/40",
            "focus:outline-none focus:ring-2 focus:ring-primary-mid/20",
            "transition-all duration-300",
            icon ? "pl-11 pr-4" : "px-4",
            error
              ? "border-red-400 focus:border-red-400"
              : "border-border-light focus:border-primary-mid",
            className,
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-red-500 font-jakarta">{error}</p>
      )}
    </div>
  );
});

export default Input;
