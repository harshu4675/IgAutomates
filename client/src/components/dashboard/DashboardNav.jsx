import { motion } from "framer-motion";
import { HiOutlineBell } from "react-icons/hi2";
import useAuthStore from "@/store/useAuthStore";
import useUIStore from "@/store/useUIStore";
import Avatar from "@/components/common/Avatar";
import Button from "@/components/common/Button";

export default function DashboardNav({
  title,
  subtitle,
  onAction,
  actionLabel,
  actionIcon,
}) {
  const { user } = useAuthStore();
  const { isSidebarOpen } = useUIStore();

  return (
    <motion.header
      animate={{ marginLeft: isSidebarOpen ? 260 : 80 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-border-light"
    >
      <div className="flex items-center justify-between px-6 md:px-8 h-18">
        <div>
          <h1 className="text-lg md:text-xl font-manrope font-bold text-primary-darkest">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-text-muted font-jakarta mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-primary-lightest/30 transition-colors relative"
            aria-label="Notifications"
          >
            <HiOutlineBell className="w-5 h-5 text-text-muted" />
          </button>

          {actionLabel && onAction && (
            <Button
              variant="primary"
              size="small"
              icon={actionIcon}
              iconPosition="left"
              onClick={onAction}
            >
              <span className="hidden sm:inline">{actionLabel}</span>
            </Button>
          )}

          <div className="w-px h-8 bg-border-light mx-1" />

          <div className="flex items-center gap-2.5">
            <Avatar name={user?.name || "User"} size="small" />
            <div className="hidden md:block">
              <p className="text-xs font-jakarta font-bold text-primary-darkest">
                {user?.name || "User"}
              </p>
              <p className="text-[10px] text-text-muted font-jakarta">
                {user?.email || ""}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
