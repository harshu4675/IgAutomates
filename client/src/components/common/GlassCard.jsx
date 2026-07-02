import { forwardRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/utils/cn";

const GlassCard = forwardRef(function GlassCard(
  { children, className, hover = true, padding = "default", onClick, ...props },
  ref,
) {
  const paddingClasses = {
    none: "",
    small: "p-4",
    default: "p-6 md:p-8",
    large: "p-8 md:p-10 lg:p-12",
  };

  const MotionDiv = onClick ? motion.button : motion.div;

  return (
    <MotionDiv
      ref={ref}
      onClick={onClick}
      whileHover={hover ? { y: -4, scale: 1.01 } : {}}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "glass-card rounded-3xl shadow-card",
        "transition-shadow duration-500 ease-out",
        hover && "hover:shadow-card-hover",
        onClick && "cursor-pointer text-left w-full",
        paddingClasses[padding],
        className,
      )}
      {...props}
    >
      {children}
    </MotionDiv>
  );
});

export default GlassCard;
