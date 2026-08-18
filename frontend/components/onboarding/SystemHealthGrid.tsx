"use client";

import { useState } from "react";
import { statusStyle } from "@/lib/utils";
import { SystemHealthDetail } from "@/types/monitoring";
import { Modal, ModalRow } from "@/components/common/Model";

const SPARKLINE_WIDTH = 100;
const SPARKLINE_HEIGHT = 34;
// Reserve room at the top/bottom of the SVG's own coordinate space so the
// threshold line and its label never sit flush against the plot edge --
// without this, a threshold far outside the data's own range (e.g. a
// system idling at 60ms against a 1000ms threshold) pins the line to
// y=0 and the label collides with whatever sits above the chart.
const SPARKLINE_Y_PADDING = 6;

interface SparklinePoint {
  x: number;
  y: number;
  value: number;
  // Sweeps before the most recent one -- 0 is "the latest sweep", 1 is
  // one CHECK_INTERVAL_SECONDS (default 5 min) before that, etc. Used for
  // the hover label since the raw array carries no timestamps, only its
  // position in the last-24h window.
  sweepsAgo: number;
}

// history is one raw latency reading per health-check sweep, oldest
// first (see healthcheck.py's _latency_history_and_uptime docstring) --
// null marks a Down sweep (no successful round-trip to time). Returns
// per-point layout plus the polyline segments to draw: a null breaks the
// line rather than being interpolated across or drawn as 0, so a real
// outage reads as a gap right where it happened -- the line moves in
// lockstep with the status badge sweep-by-sweep, not smoothed away.
//
// The y-scale spans [min(data, thresholdMs), max(data, thresholdMs)] --
// widened to always include the Degraded threshold, not just the data's
// own range, so the reference line drawn by the caller is never pushed
// off-chart just because every reading so far happened to be fast (or
// slow). Without that, a healthy system's threshold line would silently
// never appear.
function layoutSparkline(
  history: (number | null)[],
  thresholdMs: number | null
): {
  points: SparklinePoint[];
  segments: string[];
  thresholdY: number | null;
} {
  const known = history.filter((v): v is number => v != null);
  if (known.length === 0) return { points: [], segments: [], thresholdY: null };

  const dataMin = Math.min(...known);
  const dataMax = Math.max(...known);
  const min = thresholdMs != null ? Math.min(dataMin, thresholdMs) : dataMin;
  const max = thresholdMs != null ? Math.max(dataMax, thresholdMs) : dataMax;
  const range = max - min || 1;
  const lastIndex = history.length - 1;

  const plotHeight = SPARKLINE_HEIGHT - SPARKLINE_Y_PADDING * 2;
  const toY = (value: number) =>
    SPARKLINE_HEIGHT - SPARKLINE_Y_PADDING - ((value - min) / range) * plotHeight;

  const points: SparklinePoint[] = [];
  const segments: string[] = [];
  let current: string[] = [];

  history.forEach((value, i) => {
    const x = lastIndex === 0 ? SPARKLINE_WIDTH : (i / lastIndex) * SPARKLINE_WIDTH;
    if (value == null) {
      if (current.length > 1) segments.push(current.join(" "));
      current = [];
      return;
    }
    // Higher latency draws lower on the sparkline (y grows downward).
    const y = toY(value);
    points.push({ x, y, value, sweepsAgo: lastIndex - i });
    current.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  });
  if (current.length > 1) segments.push(current.join(" "));
  // A single known point (no line to draw) still gets a flat 2-point
  // segment so the lone reading is visible as a short mark, not invisible.
  if (points.length === 1 && segments.length === 0) {
    const { y } = points[0];
    segments.push(`0,${y.toFixed(1)} ${SPARKLINE_WIDTH},${y.toFixed(1)}`);
  }

  return { points, segments, thresholdY: thresholdMs != null ? toY(thresholdMs) : null };
}

// CHECK_INTERVAL_SECONDS default (health_check_orchestrator.py) -- keep
// in sync if that env-configurable default changes.
const SWEEP_INTERVAL_MINUTES = 5;

function sweepsAgoLabel(sweepsAgo: number): string {
  if (sweepsAgo === 0) return "Latest";
  const minutesAgo = sweepsAgo * SWEEP_INTERVAL_MINUTES;
  if (minutesAgo < 60) return `${minutesAgo} min ago`;
  const hours = Math.round(minutesAgo / 60);
  return `${hours} hr ago`;
}

// 24h raw latency trend for one system, one point per health-check sweep
// -- moves in lockstep with the status badge (a Down sweep shows as a
// gap right where it happened, not smoothed into an hourly average).
// Hover snaps to the nearest sweep's point and shows its value -- the
// crosshair is how a reader turns "line goes up" into an actual number
// without needing a full chart's worth of axis labels in a compact grid card.
function LatencySparkline({
  history,
  color,
  degradedThresholdMs,
}: {
  history: (number | null)[];
  color: string;
  degradedThresholdMs: number | null;
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const { points, segments, thresholdY } = layoutSparkline(history, degradedThresholdMs);

  if (points.length === 0) {
    return (
      <div
        className="mt-2 flex items-center text-[10px] text-vantara-text-muted"
        style={{ height: SPARKLINE_HEIGHT }}
      >
        No data yet
      </div>
    );
  }

  const hovered = hoverIndex != null ? points[hoverIndex] : null;

  return (
    <div className="relative mt-3">
      <svg
        width="100%"
        height={SPARKLINE_HEIGHT}
        viewBox={`0 0 ${SPARKLINE_WIDTH} ${SPARKLINE_HEIGHT}`}
        preserveAspectRatio="none"
        onMouseLeave={() => setHoverIndex(null)}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const relX = ((e.clientX - rect.left) / rect.width) * SPARKLINE_WIDTH;
          let nearest = 0;
          let nearestDist = Infinity;
          points.forEach((p, i) => {
            const dist = Math.abs(p.x - relX);
            if (dist < nearestDist) {
              nearestDist = dist;
              nearest = i;
            }
          });
          setHoverIndex(nearest);
        }}
      >
        {thresholdY != null && (
          <line
            x1="0"
            x2={SPARKLINE_WIDTH}
            y1={thresholdY}
            y2={thresholdY}
            stroke="#D97706"
            strokeWidth="1.25"
            strokeDasharray="3,2"
            vectorEffect="non-scaling-stroke"
          >
            <title>Degraded threshold: {degradedThresholdMs}ms</title>
          </line>
        )}

        {segments.map((seg, i) => (
          <polyline
            key={i}
            points={seg}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {hovered && (
          <line
            x1={hovered.x}
            x2={hovered.x}
            y1={0}
            y2={SPARKLINE_HEIGHT}
            stroke="#D1D5DB"
            strokeWidth="1"
          />
        )}
        {hovered && (
          <circle
            cx={hovered.x}
            cy={hovered.y}
            r="3"
            fill={color}
            stroke="#FFFFFF"
            strokeWidth="1.5"
          />
        )}
        {/* Transparent hover strip, taller than the visible line so the
            hit target isn't limited to the 2px stroke. */}
        <rect x="0" y="0" width={SPARKLINE_WIDTH} height={SPARKLINE_HEIGHT} fill="transparent" />
      </svg>

      {thresholdY != null && (
        <span className="pointer-events-none absolute right-0 top-0 whitespace-nowrap rounded-full border border-[#FDE1B8] bg-[#FEF3E2] px-1.5 py-[1px] text-[9px] font-semibold leading-none text-[#B45309]">
          ⚠ {degradedThresholdMs}ms
        </span>
      )}

      {hovered && (
        <div
          className="pointer-events-none absolute -top-7 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-vantara-navy px-2 py-1 text-[10px] font-medium text-white shadow-md"
          style={{ left: `${(hovered.x / SPARKLINE_WIDTH) * 100}%` }}
        >
          <span className="font-semibold">{hovered.value}ms</span>
          <span className="ml-1 text-white/70">{sweepsAgoLabel(hovered.sweepsAgo)}</span>
        </div>
      )}
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

            <LatencySparkline
              history={item.latencyHistory24h}
              color={text}
              degradedThresholdMs={degradedThresholdMs}
            />

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
