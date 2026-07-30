import { Check, Clock, X, Ban, Circle } from "lucide-react";
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
  return (
    <div>
      {items.map((item, idx) => {
        const { icon: Icon, bg, text } = iconMap[item.status];
        return (
          <div
            key={idx}
            className="flex items-start"
            style={{
              gap: 14,
              padding: "12px 0",
              borderBottom: idx < items.length - 1 ? "1px solid #F3F4F6" : "none",
            }}
          >
            <div
              className="mt-0.5 flex shrink-0 items-center justify-center rounded-full"
              style={{ width: 28, height: 28, backgroundColor: bg, color: text }}
            >
              <Icon size={14} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-vantara-navy">{item.system}</span>
                <span className="rounded-full bg-vantara-muted-bg px-2 py-0.5 text-[11px] text-vantara-text-muted">
                  {item.kind}
                </span>
              </div>
              <div className="text-sm text-vantara-text-muted">{item.platform}</div>
              <div className="mt-1 text-sm text-vantara-text-muted">{item.detail}</div>
              {item.outcome && (
                <div
                  className="mt-1 break-words"
                  style={{
                    fontFamily: "ui-monospace, Menlo, monospace",
                    fontSize: 11,
                    color: "#9CA3AF",
                  }}
                >
                  {item.outcome}
                </div>
              )}
            </div>
            <div className="shrink-0">
              <StatusBadge status={statusLabelMap[item.status]} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
