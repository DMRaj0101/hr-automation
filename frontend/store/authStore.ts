import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "@/types/auth";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user) => {
        if (typeof document !== "undefined") {
          document.cookie = "vantara-auth-token=1; path=/; max-age=86400";
        }
        set({ user, isAuthenticated: true });
      },
      logout: () => {
        if (typeof document !== "undefined") {
          document.cookie = "vantara-auth-token=; path=/; max-age=0";
        }
        set({ user: null, isAuthenticated: false });
      },
    }),
    { name: "vantara-auth" }
  )
);
