"use client";

import { useHrmsSyncPolling } from "@/hooks/useHrmsSyncPolling";

export function HrmsSyncPoller() {
  useHrmsSyncPolling();
  return null;
}
