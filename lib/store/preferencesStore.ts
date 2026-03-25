import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SpecsListMode = "pagination" | "infinite";

interface PreferencesStoreState {
  specsListMode: SpecsListMode;
  setSpecsListMode: (mode: SpecsListMode) => void;
}

export const usePreferencesStore = create<PreferencesStoreState>()(
  persist(
    (set) => ({
      specsListMode: "pagination",
      setSpecsListMode: (specsListMode) => set({ specsListMode }),
    }),
    { name: "sdd-preferences", skipHydration: true },
  ),
);
