"use client";

import {
  CheckCircle2,
  Clock,
  XOctagon,
  Hourglass,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { ChecklistItem, ChecklistStatus } from "@/types/employee";
import { StatusBadge } from "@/components/common/StatusBadge";
// No CSS module import — these classes live in your global stylesheet
// (e.g. app/globals.css), which must already define .pcPills, .pcSection, etc.

// Simplified display statuses — "blocked" items from the data are folded into "failed"
type DisplayStatus = "done" | "inProgress" | "failed" | "pending";

function toDisplayStatus(status: ChecklistStatus): DisplayStatus {
  if (status === "blocked") return "failed";
  return status as DisplayStatus;
}

const iconMap: Record<
  DisplayStatus,
  { icon: React.ElementType; iconBg: string; iconColor: string }
> = {
  done: {
    icon: CheckCircle2,
    iconBg: "#DCFCE7",
    iconColor: "#16A34A",
  },
  inProgress: {
    icon: Clock,
    iconBg: "#FEF3C7",
    iconColor: "#D97706",
  },
  failed: {
    icon: XOctagon,
    iconBg: "#FEE2E2",
    iconColor: "#DC2626",
  },
  pending: {
    icon: Hourglass,
    iconBg: "#F1F5F9",
    iconColor: "#64748B",
  },
};

const statusLabelMap: Record<DisplayStatus, string> = {
  done: "Completed",
  inProgress: "In Progress",
  failed: "Failed",
  pending: "Pending",
};

const pillLabelMap: Record<DisplayStatus, string> = {
  done: "Done",
  inProgress: "In Progress",
  failed: "Failed",
  pending: "Not Started",
};

export function ProvisioningChecklist({ items }: { items: ChecklistItem[] }) {
  const [completedOpen, setCompletedOpen] = useState(false);
  const [notStartedOpen, setNotStartedOpen] = useState(false);

  // Needs Attention = Failed (incl. blocked) + In Progress
  const attentionItems = items.filter((item) => {
    const status = toDisplayStatus(item.status);
    return status === "failed" || status === "inProgress";
  });
  const completedItems = items.filter((item) => item.status === "done");
  const notStartedItems = items.filter((item) => item.status === "pending");

  const statusCounts: Record<DisplayStatus, number> = {
    done: 0,
    inProgress: 0,
    failed: 0,
    pending: 0,
  };
  items.forEach((item) => {
    statusCounts[toDisplayStatus(item.status)] += 1;
  });

  return (
    <div>
      {/* ================= SUMMARY PILLS ================= */}
      <div className="pcPills">
        {(Object.keys(statusCounts) as DisplayStatus[])
          .filter((status) => statusCounts[status] > 0)
          .map((status) => (
            <span
              key={status}
              className="pcPill"
              style={{
                background: iconMap[status].iconBg,
                color: iconMap[status].iconColor,
              }}
            >
              {statusCounts[status]} {pillLabelMap[status]}
            </span>
          ))}
      </div>

      {/* ================= NEEDS ATTENTION (Failed + In Progress) ================= */}
      {attentionItems.length > 0 && (
        <div className="pcSection">
          <div className="pcSectionHeader pcSectionHeaderAttention">
            <span className="pcSectionTitle pcSectionTitleAttention">
              Needs Attention
            </span>
            <span className="pcCountBadge pcCountBadgeAttention">
              {attentionItems.length}
            </span>
          </div>

          <div className="pcSectionBody">
            {attentionItems.map((item, idx) => {
              const displayStatus = toDisplayStatus(item.status);
              const { icon: Icon, iconBg, iconColor } = iconMap[displayStatus];
              return (
                <div key={idx} className="pcRow">
                  <div
                    className="pcRowIcon"
                    style={{ background: iconBg, color: iconColor }}
                  >
                    <Icon size={15} />
                  </div>
                  <div className="pcRowText">
                    <span className="pcRowTitle">{item.system}</span>
                    <span className="pcRowSep"> — </span>
                    <span className="pcRowPlatform">{item.platform}</span>
                  </div>
                  <div>
                    <StatusBadge status={statusLabelMap[displayStatus]} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= COMPLETED ================= */}
      {completedItems.length > 0 && (
        <div className="pcSection">
          <button
            type="button"
            className="pcSectionHeader pcSectionHeaderCompleted"
            onClick={() => setCompletedOpen((prev) => !prev)}
          >
            <span className="pcChevron">
              {completedOpen ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )}
            </span>
            <span className="pcSectionTitle pcSectionTitleCompleted">
              Completed
            </span>
            <span className="pcCountBadge pcCountBadgeCompleted">
              {completedItems.length}
            </span>
          </button>

          {completedOpen && (
            <div className="pcSectionBody">
              {completedItems.map((item, idx) => (
                <div key={idx} className="pcRow pcRowPlain">
                  <span className="pcCheck">✓</span>
                  <div className="pcRowText">
                    <span className="pcRowTitle">{item.system}</span>
                    <span className="pcRowSep"> — </span>
                    <span className="pcRowPlatform">{item.platform}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= NOT STARTED ================= */}
      {notStartedItems.length > 0 && (
        <div className="pcSection">
          <button
            type="button"
            className="pcSectionHeader pcSectionHeaderNotstarted"
            onClick={() => setNotStartedOpen((prev) => !prev)}
          >
            <span className="pcChevron">
              {notStartedOpen ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )}
            </span>
            <span className="pcSectionTitle pcSectionTitleNotstarted">
              Not Started
            </span>
            <span className="pcCountBadge pcCountBadgeNotstarted">
              {notStartedItems.length}
            </span>
          </button>

          {notStartedOpen && (
            <div className="pcSectionBody">
              {notStartedItems.map((item, idx) => (
                <div key={idx} className="pcRow pcRowPlain">
                  <div
                    className="pcRowIcon"
                    style={{
                      background: iconMap.pending.iconBg,
                      color: iconMap.pending.iconColor,
                    }}
                  >
                    <Hourglass size={15} />
                  </div>
                  <div className="pcRowText">
                    <span className="pcRowTitle">{item.system}</span>
                    <span className="pcRowSep"> — </span>
                    <span className="pcRowPlatform">{item.platform}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}