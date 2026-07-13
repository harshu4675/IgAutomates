import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Logo({ variant = "dark", size = "default" }) {
  const sizeClasses = {
    small: "text-lg",
    default: "text-xl",
    large: "text-2xl",
  };

  const colorClasses = {
    dark: "text-primary-darkest",
    light: "text-white",
  };

  return (
    <Link to="/" aria-label="IGAutomates Home">
      <motion.div
        className="flex items-center gap-2.5"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="relative">
          <div className="w-9 h-9 rounded-xl bg-gradient-cta flex items-center justify-center">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2Z"
                stroke="#C1E8FF"
                strokeWidth="1.8"
              />
              <circle cx="12" cy="12" r="3.5" fill="#C1E8FF" />
              <circle cx="17" cy="7" r="1.2" fill="#7DA0CA" />
              <path
                d="M9 19L5 23"
                stroke="#7DA0CA"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M5 23L7.5 22.2"
                stroke="#7DA0CA"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M5 23L5.8 20.5"
                stroke="#7DA0CA"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-primary-mid rounded-full animate-pulse-soft" />
        </div>
        <span
          className={`font-manrope font-bold tracking-tight ${sizeClasses[size]} ${colorClasses[variant]}`}
        >
          IGAutomates
        </span>
      </motion.div>
    </Link>
  );
}
