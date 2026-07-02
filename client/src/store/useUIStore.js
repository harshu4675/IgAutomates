import { create } from "zustand";

const useUIStore = create((set) => ({
  isMobileMenuOpen: false,
  isSidebarOpen: true,
  activeSection: "home",
  isPageLoading: true,

  toggleMobileMenu: () =>
    set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),

  closeMobileMenu: () => set({ isMobileMenuOpen: false }),

  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  setActiveSection: (section) => set({ activeSection: section }),

  setPageLoading: (isLoading) => set({ isPageLoading: isLoading }),
}));

export default useUIStore;
