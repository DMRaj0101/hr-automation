"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { HrmsSyncPoller } from "./HrmsSyncPoller";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <HrmsSyncPoller />
      {children}
    </QueryClientProvider>
  );
}
