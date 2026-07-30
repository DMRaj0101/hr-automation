import { create } from "zustand";

interface TrackerState {
  search: string;
  dept: string;
  setSearch: (search: string) => void;
  setDept: (dept: string) => void;
}

export const useTrackerStore = create<TrackerState>((set) => ({
  search: "",
  dept: "All",
  setSearch: (search) => set({ search }),
  setDept: (dept) => set({ dept }),
}));
