"use client";

import { useState } from "react";
import { statusStyle } from "@/lib/utils";
import { SystemHealthDetail } from "@/types/monitoring";
import { Modal, ModalRow } from "@/components/common/Model";

// item.latency is a pre-formatted string from the backend ("22ms" or
// "Timeout" -- see health_check_orchestrator._to_frontend_status()), not
// a raw number -- parse the ms value back out for gauge positioning.
// null for "Timeout" (a Down reading has no latency to place on the gauge).
function parseLatencyMs(latency: string | null | undefined): number | null {
  if (!latency) return null;
  const match = latency.match(/^(\d+(?:\.\d+)?)ms$/);
  return match ? Number(match[1]) : null;
}

// Current-latency gauge: "how close is this system to Degraded right
// now", not a history. Track is always the green/amber/red band
// (0 -> threshold/2 -> threshold -> 1.5x threshold) regardless of
// status -- a fixed reference the reader can learn once, not something
// that changes shape per system. A marker tick shows exactly where the
// current reading falls on that fixed scale. Down has nothing to place
// (the endpoint didn't respond at all) so it skips the band entirely and
// shows a flat solid-red track instead. Only degradedThresholdMs
// (health_check_orchestrator._DEGRADED_THRESHOLD_MS) is a real value;
// the green/amber split is a purely visual midpoint of it.
function LatencyGauge({
  latencyMs,
  degradedThresholdMs,
  status,
}: {
  latencyMs: number | null;
  degradedThresholdMs: number | null;
  status: string;
}) {
  if (status === "Down" || degradedThresholdMs == null) {
    return (
      <div className="mt-3">
        <p className="text-xs text-vantara-text-muted">
          {status === "Down" ? "No latency reading" : "No data yet"}
        </p>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#F3B4B4]" />
        <div className="mt-1.5 flex items-center justify-between text-[10px] text-vantara-text-muted">
          <span>0ms</span>
          <span>{status === "Down" ? "Endpoint unreachable" : "—"}</span>
        </div>
      </div>
    );
  }

  const scaleMax = Math.max(degradedThresholdMs * 1.5, latencyMs ?? 0);
  const midMs = degradedThresholdMs / 2;
  const midPct = (midMs / scaleMax) * 100;
  const thresholdPct = (degradedThresholdMs / scaleMax) * 100;
  const markerPct = latencyMs != null ? Math.min((latencyMs / scaleMax) * 100, 100) : null;

  return (
    <div className="mt-3">
      <p className="text-xs text-vantara-text-muted">
        {latencyMs != null ? `${latencyMs}ms latency` : "—"}
      </p>

      <div className="relative mt-2 h-2 w-full overflow-hidden rounded-full">
        <div
          className="absolute inset-y-0 left-0"
          style={{ width: `${midPct}%`, backgroundColor: "#A7E3C3" }}
        />
        <div
          className="absolute inset-y-0"
          style={{
            left: `${midPct}%`,
            width: `${thresholdPct - midPct}%`,
            backgroundColor: "#FBDA9D",
          }}
        />
        <div
          className="absolute inset-y-0"
          style={{
            left: `${thresholdPct}%`,
            right: 0,
            backgroundColor: "#F3B4B4",
          }}
        />
        {markerPct != null && (
          <div
            className="absolute top-1/2 h-3.5 w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-vantara-navy"
            style={{ left: `${markerPct}%` }}
          />
        )}
      </div>

      <div className="mt-1.5 flex items-center justify-between text-[10px] text-vantara-text-muted">
        <span>0ms</span>
        <span>{Math.round(midMs)}ms</span>
        <span>{degradedThresholdMs}ms threshold</span>
      </div>
    </div>
  );
}

export function SystemHealthGrid({
  items,
  degradedThresholdMs,
}: {
  items: SystemHealthDetail[];
  degradedThresholdMs: number | null;
}) {
  const [selected, setSelected] = useState<SystemHealthDetail | null>(null);

  return (
    <div className="grid grid-cols-4 gap-3">
      {items.map((item, idx) => {
        const { text } = statusStyle(item.status);

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
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: text }}
                />
                <span className="text-sm font-medium text-vantara-navy">{item.name}</span>
              </div>
              <span
                className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style={{ backgroundColor: statusStyle(item.status).bg, color: text }}
              >
                {item.status}
              </span>
            </div>

            <LatencyGauge
              latencyMs={parseLatencyMs(item.latency)}
              degradedThresholdMs={degradedThresholdMs}
              status={item.status}
            />
          </div>
        );
      })}

      {selected && (
        <Modal open onClose={() => setSelected(null)}>
          <div className="flex items-center justify-between gap-2 pr-6">
            <h3 className="text-lg font-bold text-vantara-navy">{selected.name}</h3>
            <span
              className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold"
              style={{
                backgroundColor: statusStyle(selected.status).bg,
                color: statusStyle(selected.status).text,
              }}
            >
              {selected.status}
            </span>
          </div>
          <p className="mb-3 text-xs text-vantara-text-muted">
            Why this agent is {selected.status.toLowerCase()}
          </p>

          <LatencyGauge
            latencyMs={parseLatencyMs(selected.latency)}
            degradedThresholdMs={degradedThresholdMs}
            status={selected.status}
          />

          <div className="mt-3">
            <ModalRow label="Latency" value={selected.latency ?? "—"} />
            <ModalRow label="Actions" value={selected.totalActions ?? "—"} />
            <ModalRow
              label="Success rate"
              value={selected.successRate != null ? `${selected.successRate}%` : "—"}
            />
          </div>

          <div
            className="mt-3 rounded-lg p-3 text-[13.5px] leading-snug"
            style={{
              backgroundColor: statusStyle(selected.status).bg,
              color: statusStyle(selected.status).text,
            }}
          >
            {selected.error}
          </div>
        </Modal>
      )}
    </div>
  );
}
