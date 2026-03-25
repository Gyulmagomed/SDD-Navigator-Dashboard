import { create } from "zustand";
import type { FilterParams } from "@/types";

interface FilterStoreState {
  dashboardFilters: Partial<FilterParams>;
  setDashboardFilters: (patch: Partial<FilterParams>) => void;
  resetDashboardFilters: () => void;
}

export const useFilterStore = create<FilterStoreState>((set) => ({
  dashboardFilters: {},
  setDashboardFilters: (patch) =>
    set((state) => ({
      dashboardFilters: { ...state.dashboardFilters, ...patch },
    })),
  resetDashboardFilters: () => set({ dashboardFilters: {} }),
}));
