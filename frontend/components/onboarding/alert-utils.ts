import {
  AlertTriangle,
  FileText,
  Gauge,
} from "lucide-react";

export type Severity = "critical" | "high" | "medium";

export const severityConfig = {
  critical: {
    label: "CRITICAL",

    color: "#EF4444",

    light: "#FEF2F2",

    glow: "rgba(239,68,68,.18)",

    badgeBg: "#FEE2E2",

    badgeText: "#DC2626",

    border: "#EF4444",

    Icon: AlertTriangle,

    illustration: "server",
  },

  high: {
    label: "HIGH",

    color: "#F59E0B",

    light: "#FFF7ED",

    glow: "rgba(245,158,11,.18)",

    badgeBg: "#FEF3C7",

    badgeText: "#D97706",

    border: "#F59E0B",

    Icon: FileText,

    illustration: "clipboard",
  },

  medium: {
    label: "MEDIUM",

    color: "#2563EB",

    light: "#EFF6FF",

    glow: "rgba(37,99,235,.18)",

    badgeBg: "#DBEAFE",

    badgeText: "#2563EB",

    border: "#2563EB",

    Icon: Gauge,

    illustration: "cloud",
  },
} as const;

export function getSeverityConfig(
  severity: string
) {
  return (
    severityConfig[
      severity as keyof typeof severityConfig
    ] ?? severityConfig.medium
  );
}

export function getAlertMeta(alert: any) {
  switch (alert.severity) {
    case "critical":
      return {
        infoTitle: "Blocking Client Document Repository",

        infoCode: "TKT-2004",

        infoTime: "Auto-retry scheduled 8/1 10:00 AM",

        impact: "High Impact",
      };

    case "high":
      return {
        infoTitle:
          "CCH Axcess Tax license ($15,000/yr) awaiting Finance sign-off.",

        impact: "Requires Attention",
      };

    default:
      return {
        infoTitle:
          "Response time 1.5s, above 500ms baseline.",

        impact: "Monitoring",
      };
  }
}