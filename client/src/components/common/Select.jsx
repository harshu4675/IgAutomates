import { forwardRef } from "react";
import { cn } from "@/utils/cn";
import { HiOutlineChevronDown } from "react-icons/hi2";

const Select = forwardRef(function Select(
  { label, error, options = [], placeholder, className, ...props },
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
        <select
          ref={ref}
          className={cn(
            "w-full px-4 py-3.5 rounded-xl bg-white border text-sm font-jakarta text-primary-darkest",
            "appearance-none cursor-pointer",
            "focus:outline-none focus:ring-2 focus:ring-primary-mid/20",
            "transition-all duration-300",
            error
              ? "border-red-400 focus:border-red-400"
              : "border-border-light focus:border-primary-mid",
            className,
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <HiOutlineChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-red-500 font-jakarta">{error}</p>
      )}
    </div>
  );
});

export default Select;
