import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { fadeInUp, staggerContainer } from "@/animations/variants";
import { cn } from "@/utils/cn";

export default function SectionHeading({
  badge,
  title,
  subtitle,
  align = "center",
  className,
}) {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });

  const alignClasses = {
    center: "text-center items-center",
    left: "text-left items-start",
  };

  return (
    <motion.div
      ref={ref}
      variants={staggerContainer}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      className={cn(
        "flex flex-col gap-5 max-w-3xl",
        alignClasses[align],
        align === "center" && "mx-auto",
        className,
      )}
    >
      {badge && (
        <motion.div variants={fadeInUp}>
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-lightest/40 border border-border-light text-primary-dark text-xs font-semibold font-jakarta uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-mid animate-pulse-soft" />
            {badge}
          </span>
        </motion.div>
      )}
      <motion.h2
        variants={fadeInUp}
        className="text-heading md:text-display-sm font-manrope font-bold text-primary-darkest leading-tight"
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p
          variants={fadeInUp}
          className="text-base md:text-lg text-text-muted font-jakarta leading-relaxed max-w-2xl"
        >
          {subtitle}
        </motion.p>
      )}
    </motion.div>
  );
}
