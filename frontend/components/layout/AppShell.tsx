"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useHeaderStore } from "@/store/headerStore";
import { useNavProgressStore } from "@/store/navProgressStore";
import { usePageHeader } from "@/hooks/usePageHeader";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { title, subtitle, icon, clearHeader } = useHeaderStore();
  const fallback = usePageHeader();
  const done = useNavProgressStore((s) => s.done);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    clearHeader();
    const timer = setTimeout(() => done(), 260);
    return () => clearTimeout(timer);
  }, [pathname, clearHeader, done]);

  return (
    <div className="flex h-screen overflow-hidden bg-vantara-bg">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          title={title ?? fallback.title}
          subtitle={subtitle ?? fallback.subtitle}
          icon={icon ?? fallback.icon}
        />

        <main className="relative flex-1 overflow-y-auto">
          <ProgressBar />
          <motion.div
            key={pathname}
            initial={{ opacity: 0, scale: 0.97, filter: "blur(6px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.35, ease: [0.65, 0, 0.35, 1] }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}