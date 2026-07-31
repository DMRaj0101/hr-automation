"use client";

import { LogOut } from "lucide-react";
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

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-vantara-border bg-white px-6">
      {/* Left */}
      <div className="flex items-center gap-3 min-w-0">
        {icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FBEFD9] text-[#B8862E]">
            <div className="scale-90">
              {icon}
            </div>
          </div>
        )}

        {title && (
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold text-vantara-navy leading-tight">
              {title}
            </h1>

            {subtitle && (
              <p className="mt-0.5 truncate text-xs text-gray-500">
                {subtitle}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-3 shrink-0">
        <Avatar
          name={user?.name ?? "HR Admin"}
          size={34}
        />

        <div className="leading-tight">
          <div className="text-sm font-semibold text-vantara-navy">
            {user?.name ?? "HR Admin"}
          </div>

          <div className="text-xs text-vantara-text-muted">
            {user?.email}
          </div>
        </div>

        <button
          onClick={handleLogout}
          aria-label="Log out"
          className="rounded-xl p-2 text-vantara-text-muted transition-all duration-200 hover:bg-[#F5F7FA] hover:text-vantara-navy"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}