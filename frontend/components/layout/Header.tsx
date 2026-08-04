"use client";

import { useEffect, useRef, useState } from "react";
import { LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Avatar } from "@/components/common/Avatar";
import type { ReactNode } from "react";

export function Header({
  title,
  subtitle,
  icon,
}: {
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
}) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="header-glass relative flex h-20 shrink-0 items-center justify-between border-b border-vantara-border px-6">
      {/* Left */}
      <div className="relative z-10 flex items-center gap-3 min-w-0">
        {icon && (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FBEFD9] text-[#B8862E]">
            <div className="scale-95">
              {icon}
            </div>
          </div>
        )}

        {title && (
          <div className="min-w-0">
            <h1 className="header-title truncate leading-tight">
              {title}
            </h1>

            {subtitle && (
              <p className="header-subtitle mt-1.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Right */}
      <div className="relative z-10 flex items-center gap-3 shrink-0" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          className="flex items-center gap-2 rounded-xl p-1 transition-all duration-200 hover:bg-[#F5F7FA]"
        >
          <Avatar name={user?.name ?? "HR Admin"} size={34} />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-12 z-50 w-48 rounded-xl border border-vantara-border bg-white py-2 shadow-lg">
            <button
              onClick={() => setMenuOpen(false)}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-vantara-navy hover:bg-[#F5F7FA]"
            >
              <User size={16} />
              HR Admin
            </button>

            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-vantara-navy hover:bg-[#F5F7FA]"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}