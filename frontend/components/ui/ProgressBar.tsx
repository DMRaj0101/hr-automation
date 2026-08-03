"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useNavProgressStore } from "@/store/navProgressStore";

export function ProgressBar() {
  const loading = useNavProgressStore((s) => s.loading);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          className="absolute left-0 top-0 z-50 h-[2px] bg-vantara-gold"
          initial={{ width: "0%", opacity: 1 }}
          animate={{ width: "80%" }}
          exit={{ width: "100%", opacity: 0, transition: { duration: 0.2 } }}
          transition={{ duration: 0.4, ease: [0.65, 0, 0.35, 1] }}
        />
      )}
    </AnimatePresence>
  );
}