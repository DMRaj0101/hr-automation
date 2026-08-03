"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import {
  CheckCircle2,
  Clock,
  XOctagon,
  ShieldOff,
  Hourglass,
  X as CloseIcon,
} from "lucide-react";
import { ChecklistItem, ChecklistStatus } from "@/types/employee";
import { StatusBadge } from "@/components/common/StatusBadge";

const iconMap: Record<
  ChecklistStatus,
  { icon: React.ElementType; bg: string; text: string; glow: string; ring: string }
> = {
  done: {
    icon: CheckCircle2,
    bg: "linear-gradient(135deg, #34d399, #059669)",
    text: "#ffffff",
    glow: "rgba(16,185,129,.45)",
    ring: "rgba(16,185,129,.35)",
  },
  inProgress: {
    icon: Clock,
    bg: "linear-gradient(135deg, #fbbf24, #f59e0b)",
    text: "#ffffff",
    glow: "rgba(245,158,11,.45)",
    ring: "rgba(245,158,11,.35)",
  },
  failed: {
    icon: XOctagon,
    bg: "linear-gradient(135deg, #fb7185, #e11d48)",
    text: "#ffffff",
    glow: "rgba(225,29,72,.45)",
    ring: "rgba(225,29,72,.35)",
  },
  blocked: {
    icon: ShieldOff,
    bg: "linear-gradient(135deg, #94a3b8, #475569)",
    text: "#ffffff",
    glow: "rgba(71,85,105,.45)",
    ring: "rgba(71,85,105,.35)",
  },
  pending: {
    icon: Hourglass,
    bg: "linear-gradient(135deg, #a5b4fc, #6366f1)",
    text: "#ffffff",
    glow: "rgba(99,102,241,.4)",
    ring: "rgba(99,102,241,.3)",
  },
};

const statusLabelMap: Record<ChecklistStatus, string> = {
  done: "Completed",
  inProgress: "In Progress",
  failed: "Failed",
  blocked: "Blocked",
  pending: "Pending",
};

// maps status -> animation class applied to the icon circle
const statusAnimClass: Record<ChecklistStatus, string> = {
  done: "icon-pop",
  inProgress: "icon-ticking",
  failed: "icon-shake",
  blocked: "icon-shake",
  pending: "icon-pulse-soft",
};

const legendItems: { status: ChecklistStatus; title: string; desc: string }[] = [
  { status: "done", title: "Completed", desc: "Successfully finished all tasks." },
  { status: "inProgress", title: "In Progress", desc: "Work is currently in progress." },
  { status: "pending", title: "Pending", desc: "Awaiting start or further action." },
  { status: "blocked", title: "Blocked", desc: "Blocked by dependency or external issue." },
  { status: "failed", title: "Failed", desc: "Task failed and needs attention." },
];

export function ProvisioningChecklist({ items }: { items: ChecklistItem[] }) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const selectedItem = selectedIdx !== null ? items[selectedIdx] : null;

  return (
    <div>
      <style>{pcModalStyles}</style>

      <div className="checklist-grid">
        {items.map((item, idx) => {
          const { icon: Icon, bg, text, glow, ring } = iconMap[item.status];
          return (
            <div
              key={idx}
              className="pc-card flex flex-col gap-2.5"
              style={{ ["--pc-ring" as any]: ring }}
              onClick={() => setSelectedIdx(idx)}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`pc-icon-circle flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${statusAnimClass[item.status]}`}
                  style={{ background: bg, color: text, boxShadow: `0 6px 16px ${glow}` }}
                >
                  <Icon size={15} />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-vantara-navy">{item.system}</span>
                    <span className="pc-kind-pill">{item.kind}</span>
                  </div>
                  <div className="text-xs text-vantara-text-muted">{item.platform}</div>
                </div>
              </div>

              <div className="mt-auto flex items-center justify-between pt-1">
                <StatusBadge status={statusLabelMap[item.status]} />
                <span className="checklist-hint">view details</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= LEGEND ================= */}
      <div className="pc-legend">
        {legendItems.map((li) => {
          const { icon: Icon, bg, text, glow } = iconMap[li.status];
          return (
            <div key={li.status} className="pc-legend-item">
              <div
                className="pc-legend-icon"
                style={{ background: bg, color: text, boxShadow: `0 4px 12px ${glow}` }}
              >
                <Icon size={15} />
              </div>
              <div className="min-w-0">
                <div className="pc-legend-title">{li.title}</div>
                <div className="pc-legend-desc">{li.desc}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= DETAILS MODAL (rendered via portal to body) ================= */}
      {selectedItem &&
        createPortal(
          <div className="pc-overlay" onClick={() => setSelectedIdx(null)}>
            <div className="pc-modal" onClick={(e) => e.stopPropagation()}>
              <div
                className="pc-modal-glow"
                style={{ background: iconMap[selectedItem.status].glow }}
              />
              <button
                className="pc-modal-close"
                onClick={() => setSelectedIdx(null)}
                aria-label="Close"
              >
                <CloseIcon size={16} />
              </button>

              <div className="pc-modal-header">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${statusAnimClass[selectedItem.status]}`}
                  style={{
                    background: iconMap[selectedItem.status].bg,
                    color: iconMap[selectedItem.status].text,
                    boxShadow: `0 8px 20px ${iconMap[selectedItem.status].glow}`,
                  }}
                >
                  {(() => {
                    const Icon = iconMap[selectedItem.status].icon;
                    return <Icon size={18} />;
                  })()}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="pc-modal-title">{selectedItem.system}</span>
                    <span className="pc-kind-pill">{selectedItem.kind}</span>
                  </div>
                  <div className="text-xs text-vantara-text-muted">{selectedItem.platform}</div>
                </div>
              </div>

              <div className="pc-modal-status">
                <StatusBadge status={statusLabelMap[selectedItem.status]} />
              </div>

              <div className="pc-modal-body">
                <div className="checklist-detail-row">
                  <span>Type</span>
                  <span>{selectedItem.kind}</span>
                </div>
                <div className="checklist-detail-row">
                  <span>Detail</span>
                  <span>{selectedItem.detail}</span>
                </div>
                {selectedItem.outcome && (
                  <div className="checklist-detail-mono">{selectedItem.outcome}</div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

const pcModalStyles = `
/* ================= glass cards ================= */
.checklist-grid{
  display:grid;
  grid-template-columns:repeat(2, 1fr);
  gap:14px;
}

@media (max-width: 640px){
  .checklist-grid{
    grid-template-columns:1fr;
  }
}

.pc-card{
  position:relative;
  cursor:pointer;
  padding:16px;
  border-radius:16px;
  background:linear-gradient(160deg, rgba(255,255,255,.85), rgba(255,255,255,.5));
  backdrop-filter:blur(14px) saturate(160%);
  -webkit-backdrop-filter:blur(14px) saturate(160%);
  border:1px solid rgba(255,255,255,.6);
  box-shadow:0 8px 24px rgba(22,33,62,.08), inset 0 1px 0 rgba(255,255,255,.6);
  transition:transform .22s ease, box-shadow .22s ease, border-color .22s ease;
}
.pc-card:hover{
  transform:translateY(-3px);
  border-color:var(--pc-ring, rgba(99,102,241,.35));
  box-shadow:0 14px 30px rgba(22,33,62,.14), 0 0 0 3px var(--pc-ring, rgba(99,102,241,.15)), inset 0 1px 0 rgba(255,255,255,.7);
}

.pc-kind-pill{
  border-radius:999px;
  background:linear-gradient(135deg, rgba(99,102,241,.14), rgba(236,72,153,.14));
  border:1px solid rgba(99,102,241,.18);
  padding:2px 8px;
  font-size:10px;
  font-weight:700;
  color:#5b21b6;
}

.checklist-hint{
  font-size:11px;
  font-weight:600;
  color:#8a8578;
  opacity:.75;
  transition:opacity .2s ease;
}
.pc-card:hover .checklist-hint{opacity:1}

/* ================= modal overlay ================= */
.pc-overlay{
  position:fixed;inset:0;z-index:9999;
  background:rgba(22,20,45,.55);
  backdrop-filter:blur(6px) saturate(140%);
  -webkit-backdrop-filter:blur(6px) saturate(140%);
  display:flex;align-items:center;justify-content:center;
  padding:20px;
  animation:pc-fade-in .18s ease both;
}
@keyframes pc-fade-in{from{opacity:0}to{opacity:1}}

.pc-modal{
  position:relative;
  overflow:hidden;
  width:100%;max-width:440px;
  background:linear-gradient(165deg, rgba(255,255,255,.9), rgba(255,255,255,.65));
  backdrop-filter:blur(20px) saturate(180%);
  -webkit-backdrop-filter:blur(20px) saturate(180%);
  border-radius:22px;
  border:1px solid rgba(255,255,255,.6);
  box-shadow:0 25px 60px rgba(22,33,62,.3), inset 0 1px 0 rgba(255,255,255,.8);
  padding:26px;
  animation:pc-pop-in .22s cubic-bezier(.2,.8,.2,1) both;
}
@keyframes pc-pop-in{from{opacity:0;transform:translateY(12px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}

.pc-modal-glow{
  position:absolute;
  top:-60px;left:50%;
  transform:translateX(-50%);
  width:220px;height:140px;
  filter:blur(50px);
  opacity:.5;
  border-radius:50%;
  pointer-events:none;
}

.pc-modal-close{
  position:absolute;top:14px;right:14px;z-index:1;
  width:28px;height:28px;border-radius:999px;
  display:flex;align-items:center;justify-content:center;
  border:1px solid rgba(22,33,62,.1);
  background:rgba(255,255,255,.6);
  backdrop-filter:blur(6px);
  color:#6b6558;
  cursor:pointer;transition:background .2s ease, transform .15s ease;
}
.pc-modal-close:hover{background:rgba(255,255,255,.9);transform:scale(1.06)}

.pc-modal-header{position:relative;display:flex;align-items:center;gap:12px;margin-bottom:16px;padding-right:24px}
.pc-modal-title{font-size:16.5px;font-weight:800;color:#16213e}
.pc-modal-status{position:relative;margin-bottom:16px}
.pc-modal-body{position:relative;border-top:1px solid rgba(22,33,62,.1);padding-top:14px}

/* ================= status icon animations ================= */

.pc-icon-circle{transition:transform .2s ease}
.pc-card:hover .pc-icon-circle{transform:scale(1.08)}

.icon-pop{
  animation:pc-icon-pop .45s cubic-bezier(.34,1.56,.64,1) both;
}
@keyframes pc-icon-pop{
  0%{transform:scale(.4);opacity:0}
  60%{transform:scale(1.15);opacity:1}
  100%{transform:scale(1)}
}

.icon-ticking{
  animation:pc-icon-tick 2s steps(12) infinite;
}
@keyframes pc-icon-tick{
  from{transform:rotate(0deg)}
  to{transform:rotate(360deg)}
}

.icon-shake{
  animation:pc-icon-shake .5s ease both;
}
@keyframes pc-icon-shake{
  0%,100%{transform:translateX(0)}
  20%{transform:translateX(-2px)}
  40%{transform:translateX(2px)}
  60%{transform:translateX(-2px)}
  80%{transform:translateX(2px)}
}

.icon-pulse-soft{
  animation:pc-icon-pulse-soft 2.2s ease-in-out infinite;
}
@keyframes pc-icon-pulse-soft{
  0%,100%{opacity:1;transform:scale(1)}
  50%{opacity:.6;transform:scale(.92)}
}

/* ================= legend bar (glass) ================= */

.pc-legend{
  margin-top:16px;
  background:linear-gradient(160deg, rgba(255,255,255,.75), rgba(255,255,255,.4));
  backdrop-filter:blur(14px) saturate(160%);
  -webkit-backdrop-filter:blur(14px) saturate(160%);
  border:1px solid rgba(255,255,255,.55);
  border-radius:16px;
  padding:14px 20px;
  display:flex;
  flex-wrap:wrap;
  gap:20px;
  box-shadow:0 8px 20px rgba(22,33,62,.06), inset 0 1px 0 rgba(255,255,255,.6);
}
.pc-legend-item{
  display:flex;
  align-items:center;
  gap:10px;
  flex:1 1 150px;
  min-width:150px;
}
.pc-legend-icon{
  flex-shrink:0;
  width:28px;height:28px;
  border-radius:50%;
  display:flex;align-items:center;justify-content:center;
}
.pc-legend-title{
  font-size:12.5px;font-weight:700;color:#16213e;
}
.pc-legend-desc{
  font-size:11px;color:#8a8578;line-height:1.3;
}
`;