"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { OnboardingAlert } from "@/types/onboarding";

const severityStyle: Record<string, { bg: string; text: string; label: string; border: string; iconBg: string }> = {
  critical: { bg: "#FEE2E2", text: "#991B1B", label: "CRITICAL", border: "#DC2626", iconBg: "#FEE2E2" },
  high: { bg: "#FEF3C7", text: "#92400E", label: "HIGH", border: "#D97706", iconBg: "#FEF3C7" },
  medium: { bg: "#DBEAFE", text: "#1D4ED8", label: "MEDIUM", border: "#2563EB", iconBg: "#DBEAFE" },
};

function SeverityIcon({ severity, color }: { severity: string; color: string }) {
  if (severity === "critical") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill={color} stroke={color}>
        <path
          fill={color}
          d="M12 2a6 6 0 00-6 6v3.5L4 15v2h16v-2l-2-3.5V8a6 6 0 00-6-6zM9.5 19a2.5 2.5 0 005 0h-5z"
        />
      </svg>
    );
  }
  if (severity === "high") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <path d="M14 2v6h6M9 13h6M9 17h6M9 9h1" />
      </svg>
    );
  }
  // medium
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8h.01M11 12h1v4h1" />
    </svg>
  );
}

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
    <div
      className="flex gap-3 rounded-xl p-4"
      style={{ border: "1px solid #E5E7EB", borderLeft: `4px solid ${style.border}` }}
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
        style={{ background: style.iconBg }}
      >
        <SeverityIcon severity={alert.severity} color={style.border} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span
              className="inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold"
              style={{ backgroundColor: style.bg, color: style.text }}
            >
              {style.label}
            </span>
            <div className="mt-1 font-semibold text-vantara-navy">{alert.title}</div>
          </div>
          {(alert.time || alert.date) && (
            <div className="whitespace-nowrap text-right text-[11px] text-vantara-text-muted">
              {alert.time && <p>{alert.time}</p>}
              {alert.date && <p>{alert.date}</p>}
            </div>
          )}
        </div>

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
          {alert.kind === "ack" && <Button onClick={() => onDismiss(alert.id)}>Acknowledge</Button>}
        </div>
      </div>
    </div>
  );
}