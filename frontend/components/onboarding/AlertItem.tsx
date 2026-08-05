"use client";

import {
  AlertTriangle,
  FileText,
  Gauge,
  Clock3,
  ChevronRight,
} from "lucide-react";

import { OnboardingAlert } from "@/types/onboarding";
import AlertEffects from "./AlertEffects";

interface AlertItemProps {
  alert: OnboardingAlert;
  onClick?: (alert: OnboardingAlert) => void;
}

const severityStyles = {
  critical: {
    border: "#EF4444",
    bg: "#FFF5F5",
    badge: "#FEE2E2",
    text: "#DC2626",
    glow: "rgba(239,68,68,.18)",
    card: "from-red-50 via-white to-white",
  },
  high: {
    border: "#F59E0B",
    bg: "#FFF8ED",
    badge: "#FEF3C7",
    text: "#D97706",
    glow: "rgba(245,158,11,.18)",
    card: "from-amber-50 via-white to-white",
  },
  medium: {
    border: "#2563EB",
    bg: "#F5F9FF",
    badge: "#DBEAFE",
    text: "#2563EB",
    glow: "rgba(37,99,235,.18)",
    card: "from-blue-50 via-white to-white",
  },
} as const;

function AlertIcon({
  severity,
  color,
}: {
  severity: string;
  color: string;
}) {
  switch (severity) {
    case "critical":
      return <AlertTriangle size={34} strokeWidth={2.2} color={color} />;

    case "high":
      return <FileText size={34} strokeWidth={2.2} color={color} />;

    default:
      return <Gauge size={34} strokeWidth={2.2} color={color} />;
  }
}

export default function AlertItem({
  alert,
  onClick,
}: AlertItemProps) {
  const style =
    severityStyles[
      (alert.severity as keyof typeof severityStyles) ?? "medium"
    ];

  return (
    <div
      onClick={() => onClick?.(alert)}
      className="
        group
        relative
        overflow-hidden
        rounded-[28px]
        border
        border-slate-200
        bg-gradient-to-r
        shadow-sm
        transition-all
        duration-500
        hover:shadow-xl
        hover:-translate-y-1
        cursor-pointer
      "
      style={{
        borderLeft: `5px solid ${style.border}`,
      }}
    >
      {/* Background Gradient */}

      <div
        className={`absolute inset-0 bg-gradient-to-r ${style.card} opacity-90`}
      />

      {/* Soft Glow */}

      <div
        className="absolute -right-20 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full blur-3xl"
        style={{
          background: style.glow,
        }}
      />

      {/* Decorative SVG */}

      <AlertEffects severity={alert.severity} />      <div className="relative z-10 flex items-start justify-between gap-6 p-6">

        {/* Left Side */}

        <div className="flex flex-1 gap-5">

          {/* Icon */}

          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border"
            style={{
              background: style.bg,
              borderColor: style.badge,
              boxShadow: `0 10px 30px ${style.glow}`,
            }}
          >
            <AlertIcon
              severity={alert.severity}
              color={style.border}
            />
          </div>

          {/* Content */}

          <div className="flex-1 min-w-0">

            {/* Severity + Title */}

            <div className="flex flex-wrap items-center gap-3">

              <span
                className="rounded-full px-4 py-1 text-xs font-bold tracking-[0.18em]"
                style={{
                  background: style.badge,
                  color: style.text,
                }}
              >
                {alert.severity.toUpperCase()}
              </span>

            </div>

            <h3 className="mt-4 text-[32px] font-bold leading-tight text-slate-900">

              {alert.title}

            </h3>

            <p className="mt-5 max-w-xl text-[16px] leading-8 text-slate-600">

              {alert.body}

            </p>

          </div>

        </div>

        {/* Right Side */}

        <div className="flex flex-col items-end justify-between gap-6">

          {/* Time */}

          <div className="rounded-2xl border border-slate-200 bg-white/70 px-5 py-3 backdrop-blur-md">

            <div className="flex items-center gap-2 text-slate-500">

              <Clock3 size={16} />

              <span className="text-sm font-medium">

                {alert.time ?? "--:--"}

              </span>

            </div>

          </div>

          {/* Illustration */}

          <div className="pointer-events-none opacity-80">

            <AlertEffects severity={alert.severity} />

          </div>

        </div>

      </div>

      {/* Glass Information Box */}

      <div className="relative z-10 px-6 pb-6">

        <div
          className="
            max-w-xl
            rounded-2xl
            border
            border-white/60
            bg-white/70
            backdrop-blur-xl
            shadow-lg
            p-5
          "
        >          <div className="flex items-center justify-between gap-5">

            {/* Left */}

            <div className="flex flex-1 items-start gap-3">

              <span
                className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full"
                style={{
                  background: style.border,
                }}
              />

              <div className="min-w-0">

                <p className="text-sm font-semibold leading-6 text-slate-800">
                  {alert.body}
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  {alert.time
                    ? `Auto-updated • ${alert.time}`
                    : "Awaiting action"}
                </p>

              </div>

            </div>

            {/* Status */}

            <div className="hidden items-center gap-5 lg:flex">

              <span
                className="rounded-full px-4 py-2 text-xs font-semibold"
                style={{
                  background: style.badge,
                  color: style.text,
                }}
              >
                {alert.severity === "critical"
                  ? "High Impact"
                  : alert.severity === "high"
                  ? "Requires Attention"
                  : "Monitoring"}
              </span>

              <span className="text-xs text-slate-400 whitespace-nowrap">
                Last updated
                <br />
                Just now
              </span>

            </div>

            {/* Arrow */}

            <button
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-full
                border
                border-slate-200
                bg-white
                transition-all
                duration-300
                group-hover:translate-x-1
                group-hover:shadow-md
              "
            >
              <ChevronRight
                size={18}
                className="text-slate-500"
              />
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}