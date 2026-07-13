import { forwardRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/utils/cn";

const Button = forwardRef(function Button(
  {
    children,
    variant = "primary",
    size = "default",
    className,
    disabled,
    loading,
    icon,
    iconPosition = "right",
    ...props
  },
  ref,
) {
  const variants = {
    primary: "bg-gradient-cta text-white hover:shadow-button-hover",
    secondary:
      "bg-white text-primary-dark border border-border-light hover:shadow-card-hover hover:border-primary-mid",
    ghost: "bg-transparent text-primary-dark hover:bg-primary-lightest/30",
    accent: "bg-gradient-accent text-white hover:shadow-button-hover",
    outline:
      "bg-transparent text-primary-dark border-2 border-primary-dark hover:bg-primary-darkest hover:text-white",
  };

  const sizes = {
    small: "px-5 py-2.5 text-sm rounded-xl",
    default: "px-8 py-3.5 text-sm rounded-2xl",
    large: "px-10 py-4 text-base rounded-2xl",
  };

  return (
    <motion.button
      ref={ref}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={cn(
        "inline-flex items-center justify-center gap-2.5 font-jakarta font-semibold",
        "transition-all duration-300 ease-out",
        "focus:outline-none focus:ring-2 focus:ring-primary-mid focus:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="h-4 w-4 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          style={{
            animation: "buttonSpin 0.75s linear infinite",
          }}
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {icon && iconPosition === "left" && !loading && (
        <span className="text-lg">{icon}</span>
      )}
      {children}
      {icon && iconPosition === "right" && !loading && (
        <span className="text-lg">{icon}</span>
      )}
    </motion.button>
  );
});

export default Button;
