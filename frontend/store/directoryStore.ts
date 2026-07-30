import { create } from "zustand";

interface DirectoryState {
  search: string;
  dept: string;
  setSearch: (search: string) => void;
  setDept: (dept: string) => void;
}

export const useDirectoryStore = create<DirectoryState>((set) => ({
  search: "",
  dept: "All",
  setSearch: (search) => set({ search }),
  setDept: (dept) => set({ dept }),
}));
