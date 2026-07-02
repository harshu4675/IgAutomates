import { NavLink, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineSquares2X2,
  HiOutlineRocketLaunch,
  HiOutlineChartBarSquare,
  HiOutlineCog6Tooth,
  HiOutlineArrowLeftOnRectangle,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineShieldCheck,
} from "react-icons/hi2";
import Logo from "@/components/common/Logo";
import useAuthStore from "@/store/useAuthStore";
import useUIStore from "@/store/useUIStore";
import Avatar from "@/components/common/Avatar";

const sidebarLinks = [
  { label: "Dashboard", href: "/dashboard", icon: HiOutlineSquares2X2 },
  { label: "Campaigns", href: "/campaigns", icon: HiOutlineRocketLaunch },
  { label: "Analytics", href: "/analytics", icon: HiOutlineChartBarSquare },
  { label: "Settings", href: "/settings", icon: HiOutlineCog6Tooth },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const { isSidebarOpen, toggleSidebar } = useUIStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <motion.aside
      animate={{ width: isSidebarOpen ? 260 : 80 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="fixed left-0 top-0 bottom-0 z-40 bg-white border-r border-border-light flex flex-col"
    >
      <div className="flex items-center justify-between p-5 h-18 border-b border-border-light">
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Logo size="default" />
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={toggleSidebar}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-primary-lightest/30 transition-colors"
        >
          {isSidebarOpen ? (
            <HiOutlineChevronLeft className="w-4 h-4 text-text-muted" />
          ) : (
            <HiOutlineChevronRight className="w-4 h-4 text-text-muted" />
          )}
        </button>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {sidebarLinks.map((link) => (
          <NavLink
            key={link.href}
            to={link.href}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-jakarta font-medium transition-all duration-200 ${
                isActive
                  ? "bg-gradient-cta text-white shadow-button"
                  : "text-text-muted hover:bg-primary-lightest/20 hover:text-primary-darkest"
              }`
            }
          >
            <link.icon className="w-5 h-5 flex-shrink-0" />
            <AnimatePresence>
              {isSidebarOpen && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="whitespace-nowrap overflow-hidden"
                >
                  {link.label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>

      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-3 pb-3 overflow-hidden"
          >
            <div className="p-3 rounded-xl bg-surface-cream border border-border-light">
              <div className="flex items-center gap-2 mb-2">
                <HiOutlineShieldCheck className="w-3.5 h-3.5 text-primary-mid" />
                <span className="text-[10px] font-jakarta font-bold text-text-muted uppercase tracking-wider">
                  Legal
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <Link
                  to="/privacy-policy"
                  target="_blank"
                  className="text-[11px] font-jakarta text-text-muted hover:text-primary-dark transition-colors"
                >
                  Privacy Policy
                </Link>
                <Link
                  to="/terms"
                  target="_blank"
                  className="text-[11px] font-jakarta text-text-muted hover:text-primary-dark transition-colors"
                >
                  Terms of Service
                </Link>
                <Link
                  to="/data-deletion"
                  target="_blank"
                  className="text-[11px] font-jakarta text-text-muted hover:text-primary-dark transition-colors"
                >
                  Data Deletion
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-3 border-t border-border-light">
        <div
          className={`flex items-center gap-3 px-3 py-3 rounded-xl bg-surface-cream mb-2 ${isSidebarOpen ? "" : "justify-center"}`}
        >
          <Avatar name={user?.name || "User"} size="small" />
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="min-w-0 overflow-hidden"
              >
                <p className="text-xs font-jakarta font-bold text-primary-darkest truncate">
                  {user?.name || "User"}
                </p>
                <p className="text-[10px] text-text-muted font-jakarta truncate">
                  {user?.email || ""}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-jakarta font-medium text-red-500 hover:bg-red-50 transition-colors ${
            isSidebarOpen ? "" : "justify-center"
          }`}
        >
          <HiOutlineArrowLeftOnRectangle className="w-5 h-5 flex-shrink-0" />
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}
