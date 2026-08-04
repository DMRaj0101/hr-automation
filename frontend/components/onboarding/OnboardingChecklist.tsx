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
  { icon: React.ElementType; bg: string; color: string }
> = {
  done: { icon: CheckCircle2, bg: "#DCFCE7", color: "#16A34A" },
  inProgress: { icon: Clock, bg: "#FEF3C7", color: "#D97706" },
  failed: { icon: XOctagon, bg: "#FEE2E2", color: "#DC2626" },
  blocked: { icon: ShieldOff, bg: "#F3F4F6", color: "#6B7280" },
  pending: { icon: Hourglass, bg: "#EEF2FF", color: "#6366F1" },
};

const statusLabelMap: Record<ChecklistStatus, string> = {
  done: "Completed",
  inProgress: "In Progress",
  failed: "Failed",
  blocked: "Blocked",
  pending: "Pending",
};

export function OnboardingChecklist({ items }: { items: ChecklistItem[] }) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const selectedItem = selectedIdx !== null ? items[selectedIdx] : null;

  return (
    <div>
      <style>{pcModalStyles}</style>

      <div className="checklist-grid">
        {items.map((item, idx) => {
          const { icon: Icon, bg, color } = iconMap[item.status];
          return (
            <div key={idx} className="pc-card flex flex-col gap-2.5" onClick={() => setSelectedIdx(idx)}>
              <div className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                  style={{ background: bg, color }}
                >
                  <Icon size={17} />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-vantara-navy">{item.system}</span>
                  </div>
                  <span className="pc-kind-pill">{item.kind}</span>
                  <div className="mt-0.5 text-xs text-vantara-text-muted">{item.platform}</div>
                </div>
              </div>

              <div className="mt-auto flex items-center justify-between pt-1">
                <StatusBadge status={statusLabelMap[item.status]} />
                <span className="checklist-hint">view details →</span>
              </div>
            </div>
          );
        })}
      </div>

      {selectedItem &&
        createPortal(
          <div className="pc-overlay" onClick={() => setSelectedIdx(null)}>
            <div className="pc-modal" onClick={(e) => e.stopPropagation()}>
              <button className="pc-modal-close" onClick={() => setSelectedIdx(null)} aria-label="Close">
                <CloseIcon size={16} />
              </button>

              <div className="pc-modal-header">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: iconMap[selectedItem.status].bg,
                    color: iconMap[selectedItem.status].color,
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
.checklist-grid{
  display:grid;
  grid-template-columns:repeat(2, 1fr);
  gap:14px;
}
@media (max-width: 640px){
  .checklist-grid{ grid-template-columns:1fr; }
}

.pc-card{
  cursor:pointer;
  padding:16px;
  border-radius:14px;
  background:#ffffff;
  border:1px solid #E5E7EB;
  transition:box-shadow .18s ease, border-color .18s ease;
}
.pc-card:hover{
  border-color:#D1D5DB;
  box-shadow:0 4px 12px rgba(22,33,62,.06);
}

.pc-kind-pill{
  display:inline-block;
  border-radius:999px;
  background:#EEF2FF;
  padding:2px 8px;
  font-size:10px;
  font-weight:700;
  color:#4338CA;
}

.checklist-hint{
  font-size:11px;
  font-weight:600;
  color:#D9A653;
}

.pc-overlay{
  position:fixed;inset:0;z-index:9999;
  background:rgba(22,20,45,.45);
  display:flex;align-items:center;justify-content:center;
  padding:20px;
}

.pc-modal{
  position:relative;
  width:100%;max-width:440px;
  background:#ffffff;
  border-radius:18px;
  border:1px solid #E5E7EB;
  box-shadow:0 20px 50px rgba(22,33,62,.18);
  padding:26px;
}

.pc-modal-close{
  position:absolute;top:14px;right:14px;
  width:28px;height:28px;border-radius:999px;
  display:flex;align-items:center;justify-content:center;
  border:1px solid #E5E7EB;
  background:#F9FAFB;
  color:#6B7280;
  cursor:pointer;
}
.pc-modal-close:hover{ background:#F3F4F6; }

.pc-modal-header{ display:flex;align-items:center;gap:12px;margin-bottom:16px;padding-right:24px }
.pc-modal-title{ font-size:16.5px;font-weight:800;color:#14213D }
.pc-modal-status{ margin-bottom:16px }
.pc-modal-body{ border-top:1px solid #E5E7EB;padding-top:14px }

.checklist-detail-row{
  display:flex;justify-content:space-between;
  font-size:13px;color:#374151;
  padding:6px 0;
}
.checklist-detail-mono{
  margin-top:8px;
  font-family:monospace;
  font-size:12px;
  background:#F9FAFB;
  border:1px solid #E5E7EB;
  border-radius:8px;
  padding:8px 10px;
  color:#374151;
}
`;