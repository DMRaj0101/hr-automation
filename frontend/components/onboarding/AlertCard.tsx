"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { OnboardingAlert } from "@/types/onboarding";

const severityStyle: Record<string, { bg: string; text: string; label: string }> = {
  critical: { bg: "#FEE2E2", text: "#991B1B", label: "CRITICAL" },
  high: { bg: "#FEF3C7", text: "#92400E", label: "HIGH" },
  medium: { bg: "#DBEAFE", text: "#1D4ED8", label: "MEDIUM" },
};

export function AlertCard({
  alert,
  onDismiss,
}: {
  alert: OnboardingAlert;
  onDismiss: (id: string) => void;
}) {
  const [retrying, setRetrying] = useState(false);
  const style = severityStyle[alert.severity];

  const handleRetry = () => {
    setRetrying(true);
    setTimeout(() => {
      setRetrying(false);
      onDismiss(alert.id);
    }, 1800);
  };

  return (
    <div className="rounded-xl p-4" style={{ border: "1px solid #E5E7EB" }}>
      <span
        className="inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold"
        style={{ backgroundColor: style.bg, color: style.text }}
      >
        {style.label}
      </span>
      <div className="mt-2 font-semibold text-vantara-navy">{alert.title}</div>
      <p className="mt-1 text-sm text-vantara-text-muted">{alert.body}</p>
      <div className="mt-3 flex gap-2">
        {alert.kind === "dismiss" && (
          <>
            <Button variant="secondary" onClick={() => onDismiss(alert.id)} disabled={retrying}>
              Dismiss
            </Button>
            <Button onClick={handleRetry} disabled={retrying}>
              {retrying ? "Retrying…" : "Retry Now"}
            </Button>
          </>
        )}
        {alert.kind === "view" && <Button>View Details</Button>}
        {alert.kind === "ack" && (
          <Button onClick={() => onDismiss(alert.id)}>Acknowledge</Button>
        )}
      </div>
    </div>
  );
}
