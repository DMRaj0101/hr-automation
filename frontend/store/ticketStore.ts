import { create } from "zustand";

interface TicketFilterState {
  search: string;
  role: string;
  setSearch: (search: string) => void;
  setRole: (role: string) => void;
}

export const useTicketStore = create<TicketFilterState>((set) => ({
  search: "",
  role: "All",
  setSearch: (search) => set({ search }),
  setRole: (role) => set({ role }),
}));
