import { create } from "zustand";

interface TicketFilterState {
  search: string;
  role: string;
  status: string;
  setSearch: (search: string) => void;
  setRole: (role: string) => void;
  setStatus: (status: string) => void;
}

export const useTicketStore = create<TicketFilterState>((set) => ({
  search: "",
  role: "All",
  status: "All",
  setSearch: (search) => set({ search }),
  setRole: (role) => set({ role }),
  setStatus: (status) => set({ status }),
}));