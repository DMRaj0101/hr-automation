import { create } from "zustand";

interface NavProgressState {
  loading: boolean;
  start: () => void;
  done: () => void;
}

// Tracks route-change progress so the top bar and content fade
// can react from anywhere (Sidebar triggers start, AppShell triggers done).
export const useNavProgressStore = create<NavProgressState>((set) => ({
  loading: false,
  start: () => set({ loading: true }),
  done: () => set({ loading: false }),
}));