"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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

        <main className="relative flex-1 overflow-x-hidden overflow-y-auto">
          <ProgressBar />
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={pathname}
              initial={{ opacity: 0, x: 120 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -80 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              style={{ width: "100%", height: "100%" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}