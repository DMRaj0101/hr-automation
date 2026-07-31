"use client";

import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useHeaderStore } from "@/store/headerStore";
import { usePageHeader } from "@/hooks/usePageHeader";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { title, subtitle, icon } = useHeaderStore();
  const fallback = usePageHeader();

  return (
    <div className="flex h-screen overflow-hidden bg-vantara-bg">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          title={title ?? fallback.title}
          subtitle={subtitle ?? fallback.subtitle}
          icon={icon ?? fallback.icon}
        />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}