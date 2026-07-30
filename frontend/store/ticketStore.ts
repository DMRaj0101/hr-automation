import { create } from "zustand";

interface TicketFilterState {
  search: string;
  team: string;
  role: string;
  setSearch: (search: string) => void;
  setTeam: (team: string) => void;
  setRole: (role: string) => void;
}

export const useTicketStore = create<TicketFilterState>((set) => ({
  search: "",
  team: "All",
  role: "All",
  setSearch: (search) => set({ search }),
  setTeam: (team) => set({ team }),
  setRole: (role) => set({ role }),
}));
