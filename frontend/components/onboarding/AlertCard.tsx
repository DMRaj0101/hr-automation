"use client";

import { useState } from "react";
import { ChevronRight, Clock3 } from "lucide-react";
import { OnboardingAlert } from "@/types/onboarding";

const severityStyle = {
  critical: {
    label: "CRITICAL",
    border: "#EF4444",
    glow: "rgba(239,68,68,.45)",
    badge: "rgba(239,68,68,.12)",
    text: "#FCA5A5",
    bg: "rgba(239,68,68,.08)",
    accent: "#EF4444",
  },
  high: {
    label: "HIGH",
    border: "#F59E0B",
    glow: "rgba(245,158,11,.40)",
    badge: "rgba(245,158,11,.12)",
    text: "#FCD34D",
    bg: "rgba(245,158,11,.08)",
    accent: "#F59E0B",
  },
  medium: {
    label: "MEDIUM",
    border: "#3B82F6",
    glow: "rgba(59,130,246,.40)",
    badge: "rgba(59,130,246,.12)",
    text: "#93C5FD",
    bg: "rgba(59,130,246,.08)",
    accent: "#3B82F6",
  },
} as const;

function SeverityIcon({
  severity,
  color,
}: {
  severity: string;
  color: string;
}) {
  switch (severity) {
    case "critical":
      return (
        <svg
          width="34"
          height="34"
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="1.8"
        >
          <path d="M12 9v4" />
          <circle cx="12" cy="17" r="1" fill={color} />
          <path d="M10.3 3.9L2.9 17a2 2 0 001.7 3h14.8a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
        </svg>
      );

    case "high":
      return (
        <svg
          width="34"
          height="34"
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="1.8"
        >
          <path d="M14 2H7a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V8z" />
          <path d="M14 2v6h6" />
          <path d="M9 13h6" />
          <path d="M9 17h6" />
          <path d="M9 9h1" />
        </svg>
      );

    default:
      return (
        <svg
          width="34"
          height="34"
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="1.8"
        >
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v4l3 2" />
        </svg>
      );
  }
}

function DecorativeGlow({
  color,
}: {
  color: string;
}) {
  return (
    <>
      <div
        className="absolute inset-y-0 left-0 w-[4px] rounded-full"
        style={{
          background: color,
          boxShadow: `0 0 18px ${color}`,
        }}
      />

      <div
        className="absolute -right-10 top-1/2 h-52 w-52 -translate-y-1/2 rounded-full blur-3xl opacity-20"
        style={{
          background: color,
        }}
      />

      <div
        className="absolute right-0 top-0 h-full w-80 opacity-60"
        style={{
          background: `
          radial-gradient(circle at right,
          ${color}18,
          transparent 70%)
          `,
        }}
      />

      <svg
        className="absolute right-0 top-0 h-full w-72 opacity-60"
        viewBox="0 0 320 180"
        preserveAspectRatio="none"
      >
        <path
          d="M160 180 C220 150 240 120 260 90 S300 40 320 10"
          stroke={color}
          strokeWidth="1.5"
          fill="none"
          opacity=".55"
        />

        <path
          d="M145 180 C205 145 225 118 245 90 S285 48 320 20"
          stroke={color}
          strokeWidth="1.2"
          fill="none"
          opacity=".35"
        />

        <path
          d="M170 180 C230 155 250 132 270 102 S300 70 320 45"
          stroke={color}
          strokeWidth="1"
          fill="none"
          opacity=".25"
        />
      </svg>
    </>
  );
}

export function AlertCard({
  alert,
  onDismiss,
}: {
  alert: OnboardingAlert;
  onDismiss: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);

  const style =
    severityStyle[
      (alert.severity as keyof typeof severityStyle) ?? "medium"
    ];

  const impactLabel =
    alert.severity === "critical"
      ? "High Impact"
      : alert.severity === "high"
      ? "Requires Attention"
      : "Monitoring";
        return (
    <div
      onClick={() => onDismiss(alert.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative cursor-pointer overflow-hidden rounded-3xl border transition-all duration-500"
      style={{
        borderColor: "rgba(255,255,255,.08)",
        background:
          "linear-gradient(135deg, rgba(16,23,42,.96), rgba(25,35,60,.92))",
        backdropFilter: "blur(22px)",
        WebkitBackdropFilter: "blur(22px)",
        boxShadow: hovered
          ? `0 20px 45px rgba(0,0,0,.45),0 0 35px ${style.glow}`
          : "0 10px 30px rgba(0,0,0,.22)",
        transform: hovered ? "translateY(-4px)" : "translateY(0px)",
      }}
    >
      <DecorativeGlow color={style.border} />

      <div className="relative flex items-start gap-6 p-6">

        {/* Icon */}

        <div
          className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl"
          style={{
            background: `
            radial-gradient(circle,
            ${style.bg},
            rgba(255,255,255,.02))
            `,
            border: `1px solid ${style.border}30`,
            boxShadow: `0 0 25px ${style.glow}`,
          }}
        >
          <SeverityIcon
            severity={alert.severity}
            color={style.border}
          />
        </div>

        {/* Content */}

        <div className="min-w-0 flex-1">

          <div className="flex items-start justify-between gap-6">

            <div className="flex-1">

              <span
                className="inline-flex rounded-full px-3 py-1 text-[11px] font-bold tracking-[.15em]"
                style={{
                  background: style.badge,
                  color: style.text,
                  border: `1px solid ${style.border}40`,
                  backdropFilter: "blur(12px)",
                }}
              >
                {style.label}
              </span>

              <h3 className="mt-3 text-lg font-semibold tracking-wide text-white">
                {alert.title}
              </h3>

              <div className="mt-4 flex flex-wrap gap-2">

                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 backdrop-blur-xl">
                  {impactLabel}
                </div>

                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 backdrop-blur-xl">
                  Active
                </div>

                {alert.kind && (
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 backdrop-blur-xl">
                    {alert.kind.toUpperCase()}
                  </div>
                )}

              </div>

            </div>

            {/* Time */}

            <div className="hidden min-w-[130px] rounded-2xl border border-white/10 bg-white/5 p-4 text-right backdrop-blur-xl md:block">

              <div className="flex items-center justify-end gap-2 text-slate-300">

                <Clock3 size={14} />

                <span className="text-xs">
                  {alert.time ?? "--:--"}
                </span>

              </div>

              {alert.date && (
                <div className="mt-2 text-xs text-slate-500">
                  {alert.date}
                </div>
              )}

            </div>

          </div>

          {/* Body */}

          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-lg">

            <div className="flex items-start gap-3">

              <div
                className="mt-1 h-2.5 w-2.5 rounded-full"
                style={{
                  background: style.border,
                  boxShadow: `0 0 10px ${style.glow}`,
                }}
              />

              <p className="text-sm leading-7 text-slate-300">
                {alert.body}
              </p>

            </div>

          </div>

        </div>

        {/* Chevron */}

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-all duration-300 ${
            hovered ? "translate-x-1" : ""
          }`}
        >
          <ChevronRight
            size={20}
            color="#CBD5E1"
          />
        </div>

      </div>

      {/* Bottom Shine */}

      <div
        className="absolute bottom-0 left-0 h-[2px] w-full"
        style={{
          background: `linear-gradient(
            90deg,
            transparent,
            ${style.border},
            transparent
          )`,
          opacity: .8,
        }}
      />
    </div>
  );
}