"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Check, Clock, X, Ban, Circle, X as CloseIcon } from "lucide-react";
import { ChecklistItem, ChecklistStatus } from "@/types/employee";
import { StatusBadge } from "@/components/common/StatusBadge";

const iconMap: Record<ChecklistStatus, { icon: React.ElementType; bg: string; text: string }> = {
  done: { icon: Check, bg: "#DCFCE7", text: "#166534" },
  inProgress: { icon: Clock, bg: "#FEF3C7", text: "#92400E" },
  failed: { icon: X, bg: "#FEE2E2", text: "#991B1B" },
  blocked: { icon: Ban, bg: "#FEE2E2", text: "#991B1B" },
  pending: { icon: Circle, bg: "#F3F4F6", text: "#9CA3AF" },
};

const statusLabelMap: Record<ChecklistStatus, string> = {
  done: "Completed",
  inProgress: "In Progress",
  failed: "Failed",
  blocked: "Blocked",
  pending: "Pending",
};

export function ProvisioningChecklist({ items }: { items: ChecklistItem[] }) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const selectedItem = selectedIdx !== null ? items[selectedIdx] : null;

  return (
    <div className="checklist-grid">
      <style>{pcModalStyles}</style>

      {items.map((item, idx) => {
        const { icon: Icon, bg, text } = iconMap[item.status];
        return (
          <div
            key={idx}
            className="card-sm checklist-card flex flex-col gap-2.5"
            onClick={() => setSelectedIdx(idx)}
          >
            <div className="flex items-center gap-3">
              <div
                className={
                  item.status === "inProgress"
                    ? "icon-ticking flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                    : "flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                }
                style={{ backgroundColor: bg, color: text }}
              >
                <Icon size={14} />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-vantara-navy">{item.system}</span>
                  <span className="rounded-md bg-vantara-muted-bg px-1.5 py-0.5 text-[10px] font-semibold text-vantara-text-muted">
                    {item.kind}
                  </span>
                </div>
                <div className="text-xs text-vantara-text-muted">{item.platform}</div>
              </div>
            </div>

            <div className="mt-auto flex items-center justify-between pt-1">
              <StatusBadge status={statusLabelMap[item.status]} />
              <span className="checklist-hint">
                view details
              </span>
            </div>
          </div>
        );
      })}

      {/* ================= DETAILS MODAL (rendered via portal to body) ================= */}
      {selectedItem &&
        createPortal(
          <div className="pc-overlay" onClick={() => setSelectedIdx(null)}>
            <div className="pc-modal" onClick={(e) => e.stopPropagation()}>
              <button
                className="pc-modal-close"
                onClick={() => setSelectedIdx(null)}
                aria-label="Close"
              >
                <CloseIcon size={16} />
              </button>

              <div className="pc-modal-header">
                <div
                  className={
                    selectedItem.status === "inProgress"
                      ? "icon-ticking flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                      : "flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                  }
                  style={{
                    backgroundColor: iconMap[selectedItem.status].bg,
                    color: iconMap[selectedItem.status].text,
                  }}
                >
                  {(() => {
                    const Icon = iconMap[selectedItem.status].icon;
                    return <Icon size={17} />;
                  })()}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="pc-modal-title">{selectedItem.system}</span>
                    <span className="rounded-md bg-vantara-muted-bg px-1.5 py-0.5 text-[10px] font-semibold text-vantara-text-muted">
                      {selectedItem.kind}
                    </span>
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
.pc-overlay{
  position:fixed;inset:0;z-index:9999;
  background:rgba(22,33,62,.45);
  backdrop-filter:blur(3px);
  display:flex;align-items:center;justify-content:center;
  padding:20px;
  animation:pc-fade-in .18s ease both;
}
@keyframes pc-fade-in{from{opacity:0}to{opacity:1}}

.pc-modal{
  position:relative;
  width:100%;max-width:440px;
  background:#ffffff;
  border-radius:18px;
  border:1px solid rgba(22,33,62,.08);
  box-shadow:0 20px 50px rgba(22,33,62,.25);
  padding:24px;
  animation:pc-pop-in .22s cubic-bezier(.2,.8,.2,1) both;
}
@keyframes pc-pop-in{from{opacity:0;transform:translateY(12px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}

.pc-modal-close{
  position:absolute;top:14px;right:14px;
  width:28px;height:28px;border-radius:999px;
  display:flex;align-items:center;justify-content:center;
  border:1px solid rgba(22,33,62,.08);
  background:#f7f8fa;color:#6b6558;
  cursor:pointer;transition:background .2s ease;
}
.pc-modal-close:hover{background:#eceef1}

.pc-modal-header{display:flex;align-items:center;gap:12px;margin-bottom:16px;padding-right:24px}
.pc-modal-title{font-size:16px;font-weight:800;color:#16213e}
.pc-modal-status{margin-bottom:16px}
.pc-modal-body{border-top:1px solid rgba(22,33,62,.08);padding-top:14px}
`;