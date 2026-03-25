import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UiThemePreference = "light" | "dark" | "system";

interface UiStoreState {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  themePreference: UiThemePreference;
  setThemePreference: (theme: UiThemePreference) => void;
  activeFilters: Record<string, string>;
  setActiveFilters: (patch: Record<string, string>) => void;
  clearActiveFilters: () => void;
}

export const useUiStore = create<UiStoreState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      themePreference: "system",
      setThemePreference: (themePreference) => set({ themePreference }),
      activeFilters: {},
      setActiveFilters: (patch) =>
        set((state) => ({
          activeFilters: { ...state.activeFilters, ...patch },
        })),
      clearActiveFilters: () => set({ activeFilters: {} }),
    }),
    {
      name: "sdd-ui-store",
      skipHydration: true,
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        themePreference: state.themePreference,
        activeFilters: state.activeFilters,
      }),
    },
  ),
);
