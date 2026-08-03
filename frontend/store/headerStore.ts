import { create } from "zustand";
import type { ReactNode } from "react";

interface HeaderState {
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  setHeader: (header: { title?: string; subtitle?: string; icon?: ReactNode }) => void;
  clearHeader: () => void;
}

export const useHeaderStore = create<HeaderState>((set) => ({
  title: undefined,
  subtitle: undefined,
  icon: undefined,
  setHeader: (header) => set(header),
  clearHeader: () => set({ title: undefined, subtitle: undefined, icon: undefined }),
}));