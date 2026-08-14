"use client";

import { useState } from "react";
import { statusStyle } from "@/lib/utils";
import { SystemHealthDetail } from "@/types/monitoring";
import { Modal, ModalRow } from "@/components/common/Model";

const SPARKLINE_WIDTH = 100;
const SPARKLINE_HEIGHT = 22;

function sparklinePoints(history: number[]): string {
  if (history.length === 0) return "";
  if (history.length === 1) {
    const y = SPARKLINE_HEIGHT / 2;
    return `0,${y} ${SPARKLINE_WIDTH},${y}`;
  }

  const min = Math.min(...history);
  const max = Math.max(...history);
  const range = max - min || 1;

  return history
    .map((value, i) => {
      const x = (i / (history.length - 1)) * SPARKLINE_WIDTH;
      // Higher latency draws lower on the sparkline (y grows downward).
      const y = SPARKLINE_HEIGHT - ((value - min) / range) * SPARKLINE_HEIGHT;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export function SystemHealthGrid({ items }: { items: SystemHealthDetail[] }) {
  const [selected, setSelected] = useState<SystemHealthDetail | null>(null);

  return (
    <div className="grid grid-cols-4 gap-3">
      {items.map((item, idx) => {
        const { text } = statusStyle(item.status);
        const successRate = item.successRate;

        return (
          <div
            key={item.name}
            role="button"
            tabIndex={0}
            onClick={() => setSelected(item)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setSelected(item);
              }
            }}
            className="animate-fade-in cursor-pointer rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
            style={{
              border: "1px solid #E5E7EB",
              padding: "12px 14px",
              animationDelay: `${idx * 40}ms`,
              animationFillMode: "backwards",
            }}
          >
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: text }}
              />
              <span className="text-sm font-medium text-vantara-navy">{item.name}</span>
            </div>

            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="text-vantara-text-muted">{item.latency ?? "—"}</span>
              <span className="font-semibold" style={{ color: text }}>
                {item.status}
              </span>
            </div>

            <svg
              width="100%"
              height={SPARKLINE_HEIGHT}
              viewBox={`0 0 ${SPARKLINE_WIDTH} ${SPARKLINE_HEIGHT}`}
              className="mt-2"
              preserveAspectRatio="none"
            >
              <polyline
                points={sparklinePoints(item.latencyHistory24h)}
                fill="none"
                stroke={text}
                strokeWidth="1.5"
                className="transition-all duration-300"
              />
            </svg>

            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-vantara-text-muted">Actions</span>
              <span className="font-semibold text-vantara-navy">
                {item.totalActions ?? "—"}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="text-vantara-text-muted">Success</span>
              <span className="font-semibold" style={{ color: text }}>
                {successRate != null ? `${successRate}%` : "—"}
              </span>
            </div>
            <div
              className="mt-1 h-1 w-full overflow-hidden rounded-full"
              style={{ backgroundColor: "#F3F4F6" }}
            >
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${successRate ?? 0}%`,
                  backgroundColor: text,
                }}
              />
            </div>
          </div>
        );
      })}

      {selected && (
        <Modal open onClose={() => setSelected(null)}>
          <h3 className="mb-1 text-lg font-bold text-vantara-navy">{selected.name}</h3>
          <p className="mb-3 text-xs text-vantara-text-muted">
            Why this agent is {selected.status.toLowerCase()}
          </p>

          <ModalRow label="Status" value={selected.status} />
          <ModalRow label="Latency" value={selected.latency ?? "—"} />
          <ModalRow label="Actions" value={selected.totalActions ?? "—"} />
          <ModalRow
            label="Success rate"
            value={selected.successRate != null ? `${selected.successRate}%` : "—"}
          />

          <div className="mt-3 rounded-lg bg-[#F3F4F6] p-3 text-[13.5px] leading-snug text-vantara-navy">
            {selected.error}
          </div>
        </Modal>
      )}
    </div>
  );
}
