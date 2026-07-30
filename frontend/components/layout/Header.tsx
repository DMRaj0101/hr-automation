"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Avatar } from "@/components/common/Avatar";

export function Header() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-vantara-border bg-white px-8">
      <div />
      <div className="flex items-center gap-3">
        <Avatar name={user?.name ?? "HR Admin"} size={32} />
        <div className="text-sm">
          <div className="font-medium text-vantara-navy">{user?.name ?? "HR Admin"}</div>
          <div className="text-xs text-vantara-text-muted">{user?.email}</div>
        </div>
        <button
          onClick={handleLogout}
          className="ml-2 rounded-lg p-2 text-vantara-text-muted hover:bg-vantara-muted-bg hover:text-vantara-navy"
          aria-label="Log out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
