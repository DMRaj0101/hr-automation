"use client";

import { type ElementType, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  CheckCircle2,
  Clock,
  XOctagon,
  X as CloseIcon,
  Eye,
  EyeOff,
  FileText,
  RefreshCw,
  Ticket as TicketIcon,
  ShieldCheck,
  CalendarClock,
  User,
  Lock,
  PartyPopper,
  AlertCircle,
  KeyRound,
  Mail,
  Monitor,
  ArrowRight,
  ClipboardCheck,
} from "lucide-react";

import type {
  ChecklistItem,
  ChecklistStatus,
} from "@/types/employee";

import { StatusBadge } from "@/components/common/StatusBadge";
import { getProvisionalStatus } from "@/services/onboarding.service";
import type { ProvisionalStatusItem } from "@/types/onboarding";

/* =========================================================
   CHECKLIST ICONS
   ========================================================= */

const iconMap: Record<
  string,
  {
    icon: ElementType;
    bg: string;
    color: string;
  }
> = {
  "Identity Account Creation": {
    icon: KeyRound,
    bg: "#DBEAFE",
    color: "#2563EB",
  },

  "Email Account Creation": {
    icon: Mail,
    bg: "#EDE9FE",
    color: "#7C3AED",
  },

  "Asset Allocation": {
    icon: Monitor,
    bg: "#F1F5F9",
    color: "#64748B",
  },

  "Document Management": {
    icon: FileText,
    bg: "#DCFCE7",
    color: "#16A34A",
  },
};

const fallbackIcon = {
  icon: FileText,
  bg: "#F3F4F6",
  color: "#6B7280",
};

function getChecklistIcon(item: ChecklistItem) {
  return iconMap[item.system] ?? fallbackIcon;
}

/* =========================================================
   STATUS LABEL
   ========================================================= */

const statusLabelMap: Record<ChecklistStatus, string> = {
  done: "Completed",
  inProgress: "In Progress",
  failed: "Failed",
  blocked: "Failed",
  pending: "Not Started",
};

/* =========================================================
   STATUS THEME
   ========================================================= */

const statusThemeMap: Record<
  ChecklistStatus,
  {
    titleColor: string;
    pillBg: string;
    pillText: string;
    noteBg: string;
    noteBorder: string;
    noteIconBg: string;
    noteTitleColor: string;
    noteTextColor: string;
  }
> = {
  done: {
    titleColor: "#16A34A",
    pillBg: "#DCFCE7",
    pillText: "#15803D",
    noteBg: "#F0FDF4",
    noteBorder: "#DCFCE7",
    noteIconBg: "#16A34A",
    noteTitleColor: "#166534",
    noteTextColor: "#15803D",
  },

  inProgress: {
    titleColor: "#2563EB",
    pillBg: "#DBEAFE",
    pillText: "#1D4ED8",
    noteBg: "#EFF6FF",
    noteBorder: "#DBEAFE",
    noteIconBg: "#2563EB",
    noteTitleColor: "#1E40AF",
    noteTextColor: "#1D4ED8",
  },

  failed: {
    titleColor: "#DC2626",
    pillBg: "#FEE2E2",
    pillText: "#B91C1C",
    noteBg: "#FEF2F2",
    noteBorder: "#FEE2E2",
    noteIconBg: "#DC2626",
    noteTitleColor: "#991B1B",
    noteTextColor: "#B91C1C",
  },

  blocked: {
    titleColor: "#DC2626",
    pillBg: "#FEE2E2",
    pillText: "#B91C1C",
    noteBg: "#FEF2F2",
    noteBorder: "#FEE2E2",
    noteIconBg: "#DC2626",
    noteTitleColor: "#991B1B",
    noteTextColor: "#B91C1C",
  },

  pending: {
    titleColor: "#6B7280",
    pillBg: "#F3F4F6",
    pillText: "#4B5563",
    noteBg: "#F9FAFB",
    noteBorder: "#E5E7EB",
    noteIconBg: "#6B7280",
    noteTitleColor: "#374151",
    noteTextColor: "#4B5563",
  },
};

/* =========================================================
   STYLES
   ========================================================= */

const pcModalStyles = `
/* =========================================================
   HEADER
   ========================================================= */

.checklist-header {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 18px;
}

.checklist-header-icon {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;

  color: #7C3AED;
  background: #F5F3FF;

  border-radius: 9px;

  flex-shrink: 0;
}

.checklist-header-content {
  min-width: 0;
}

.checklist-header-title {
  margin: 0;
  font-size: 20px;
  line-height: 1.25;
  font-weight: 800;
  color: #14213D;
  letter-spacing: -0.02em;
}

.checklist-header-line {
  width: 40px;
  height: 2px;
  margin-top: 9px;
  background: #7C3AED;
  border-radius: 999px;
}

/* =========================================================
   GRID
   ========================================================= */

.checklist-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

@media (max-width: 640px) {
  .checklist-grid {
    grid-template-columns: 1fr;
  }
}

/* =========================================================
   CARD
   ========================================================= */

.pc-card {
  cursor: pointer;

  padding: 16px;

  min-height: 132px;

  display: flex;
  flex-direction: column;

  border-radius: 14px;

  background: #ffffff;

  border: 1px solid #E5E7EB;

  transition:
    box-shadow 0.18s ease,
    border-color 0.18s ease,
    transform 0.18s ease;
}

.pc-card:hover {
  border-color: #D9A653;

  box-shadow:
    0 6px 18px rgba(20, 33, 61, 0.07);

  transform: translateY(-1px);
}

/* =========================================================
   CARD ICON
   ========================================================= */

.pc-card-icon {
  width: 38px;
  height: 38px;

  flex-shrink: 0;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 12px;
}

/* =========================================================
   CARD TITLE
   ========================================================= */

.pc-card-title {
  font-size: 15px;
  line-height: 1.3;

  font-weight: 700;

  color: #14213D;
}

.pc-card-platform {
  margin-top: 3px;

  font-size: 12px;

  color: #7A8495;
}

/* =========================================================
   CARD FOOTER
   ========================================================= */

.pc-card-footer {
  margin-top: auto;

  display: flex;
  align-items: center;
  justify-content: space-between;

  padding-top: 12px;
}

/* =========================================================
   VIEW DETAILS
   ========================================================= */

.pc-view-details {
  display: inline-flex;
  align-items: center;
  gap: 4px;

  border: none;
  background: transparent;

  padding: 0;

  font-size: 12px;
  font-weight: 700;

  color: #D9A653;

  cursor: pointer;

  transition:
    color 0.15s ease,
    gap 0.15s ease;
}

.pc-view-details:hover {
  color: #B8862E;
  gap: 6px;
}

.pc-view-details svg {
  flex-shrink: 0;
}

/* =========================================================
   MODAL OVERLAY
   ========================================================= */

.pc-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;

  background: rgba(20, 33, 61, 0.28);

  display: flex;
  align-items: center;
  justify-content: center;

  padding: 20px;

  animation: pc-overlay-in 0.15s ease-out;
}

@keyframes pc-overlay-in {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes pc-modal-in {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.98);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* =========================================================
   MODAL
   ========================================================= */

.pc-modal {
  position: relative;

  width: 100%;
  max-width: 600px;

  background: #ffffff;

  border-radius: 10px;

  border: 1px solid #ECEDF1;

  box-shadow:
    0 16px 40px -8px rgba(20, 33, 61, 0.2);

  padding: 22px 22px 20px;

  animation:
    pc-modal-in 0.18s cubic-bezier(0.16, 1, 0.3, 1);
}

/* =========================================================
   MODAL CLOSE
   ========================================================= */

.pc-modal-close {
  position: absolute;

  top: 18px;
  right: 18px;

  width: 26px;
  height: 26px;

  border-radius: 8px;

  display: flex;
  align-items: center;
  justify-content: center;

  border: 1px solid #E5E7EB;

  background: #ffffff;

  color: #9CA3AF;

  cursor: pointer;

  transition:
    background 0.15s ease,
    color 0.15s ease;
}

.pc-modal-close:hover {
  background: #F9FAFB;
  color: #374151;
}

.pc-modal-close:focus-visible {
  outline: 2px solid #6366F1;
  outline-offset: 2px;
}

/* =========================================================
   MODAL HEADER
   ========================================================= */

.pc-modal-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;

  margin-bottom: 14px;

  padding-right: 26px;
}

.pc-modal-icon {
  display: flex;
  align-items: center;
  justify-content: center;

  width: 42px;
  height: 42px;

  border-radius: 12px;

  flex-shrink: 0;
}

.pc-modal-title {
  font-size: 16px;
  font-weight: 800;

  color: #14213D;

  line-height: 1.3;
}

.pc-modal-platform {
  margin-top: 1px;

  font-size: 12.5px;

  color: #8A93A3;
}

.pc-modal-status {
  margin-bottom: 14px;
}

/* =========================================================
   DETAILS
   ========================================================= */

.pc-details-card {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 10px;

  background: #F9FAFB;

  border: 1px solid #EEF0F3;

  border-radius: 12px;

  padding: 11px 13px;

  margin-bottom: 16px;
}

.pc-details-left {
  display: flex;
  align-items: center;
  gap: 8px;

  font-size: 13px;
  font-weight: 700;

  color: #374151;
}

.pc-details-right {
  display: flex;
  align-items: center;
  gap: 6px;

  font-size: 12.5px;
  font-weight: 600;

  color: #4F46E5;
}

.pc-details-right svg {
  flex-shrink: 0;
}

/* =========================================================
   SECTION TITLE
   ========================================================= */

.pc-section-title {
  display: flex;
  align-items: center;

  gap: 6px;

  margin-bottom: 8px;

  font-size: 11.5px;
  font-weight: 800;

  letter-spacing: 0.04em;

  text-transform: uppercase;
}

/* =========================================================
   DETAIL ROW
   ========================================================= */

.checklist-detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;

  gap: 12px;

  font-size: 13px;

  color: #374151;

  padding: 8px 2px;
}

.pc-row-label {
  display: flex;
  align-items: center;

  gap: 8px;

  color: #6B7280;

  font-weight: 500;
}

.pc-row-label svg {
  color: #9CA3AF;

  flex-shrink: 0;
}

.pc-row-value {
  font-weight: 700;

  color: #1F2937;
}

/* =========================================================
   STATUS PILL
   ========================================================= */

.pc-status-pill {
  display: inline-flex;

  align-items: center;

  gap: 5px;

  font-size: 12px;

  font-weight: 700;

  padding: 4px 10px;

  border-radius: 999px;
}

/* =========================================================
   CREDENTIALS
   ========================================================= */

.pc-cred-box {
  margin-top: 4px;
  margin-bottom: 4px;

  display: flex;

  flex-direction: column;

  background: #F3F4F6;

  border-radius: 12px;

  padding: 3px 13px;
}

.pc-cred-row {
  display: flex;

  justify-content: space-between;

  align-items: center;

  gap: 10px;

  font-size: 13px;

  padding: 9px 0;
}

.pc-cred-row + .pc-cred-row {
  border-top: 1px solid #E5E7EB;
}

.pc-cred-label {
  display: flex;
  align-items: center;

  gap: 8px;

  color: #4B5563;

  font-weight: 500;
}

.pc-cred-label svg {
  color: #9CA3AF;

  flex-shrink: 0;
}

.pc-cred-value-wrap {
  display: flex;

  align-items: center;

  gap: 6px;

  min-width: 0;
}

.pc-cred-value {
  font-weight: 700;

  color: #14213D;

  overflow: hidden;

  text-overflow: ellipsis;

  white-space: nowrap;

  max-width: 150px;
}

/* =========================================================
   ICON BUTTON
   ========================================================= */

.pc-icon-btn {
  display: flex;

  align-items: center;

  justify-content: center;

  width: 22px;
  height: 22px;

  border-radius: 6px;

  border: none;

  background: transparent;

  color: #9CA3AF;

  cursor: pointer;

  flex-shrink: 0;

  transition:
    background 0.15s ease,
    color 0.15s ease;
}

.pc-icon-btn:hover {
  background: #E5E7EB;
  color: #374151;
}

.pc-icon-btn:focus-visible {
  outline: 2px solid #6366F1;
  outline-offset: 2px;
}

/* =========================================================
   NOTE
   ========================================================= */

.pc-note {
  margin-top: 14px;

  display: flex;

  gap: 10px;

  align-items: flex-start;

  border-radius: 14px;

  padding: 12px 14px;

  position: relative;

  overflow: hidden;
}

.pc-note-icon {
  width: 26px;
  height: 26px;

  border-radius: 999px;

  display: flex;

  align-items: center;

  justify-content: center;

  flex-shrink: 0;

  margin-top: 1px;

  color: #fff;
}

.pc-note-title {
  font-size: 13px;

  font-weight: 800;
}

.pc-note-text {
  font-size: 12.5px;

  line-height: 1.45;

  margin-top: 2px;
}

.pc-note-decoration {
  position: absolute;

  right: 10px;

  bottom: 6px;

  opacity: 0.5;
}

/* =========================================================
   RESULT GRID
   ========================================================= */

.pc-result-grid {
  display: grid;

  grid-template-columns: 1fr 1fr;

  gap: 0 24px;

  align-items: start;
}

.pc-result-col-left
.checklist-detail-row:first-child {
  padding-top: 2px;
}

.pc-result-col-right .pc-note {
  margin-top: 0;
}

/* =========================================================
   LOADING
   ========================================================= */

.pc-loading {
  display: flex;

  align-items: center;

  gap: 10px;

  font-size: 12.5px;

  color: #6B7280;

  padding: 8px 2px 4px;
}

.pc-loading-spinner {
  width: 14px;
  height: 14px;

  border-radius: 999px;

  border: 2px solid #E5E7EB;

  border-top-color: #6366F1;

  animation: pc-spin 0.7s linear infinite;

  flex-shrink: 0;
}

@keyframes pc-spin {
  to {
    transform: rotate(360deg);
  }
}

/* =========================================================
   RESPONSIVE
   ========================================================= */

@media (max-width: 640px) {
  .pc-result-grid {
    grid-template-columns: 1fr;

    gap: 4px 0;
  }

  .pc-result-col-right {
    margin-top: 4px;
  }
}

@media (max-width: 480px) {
  .pc-modal {
    padding: 18px 16px 18px;
  }

  .checklist-header-title {
    font-size: 18px;
  }
}
`;

/* =========================================================
   FIND PROVISIONAL STATUS
   ========================================================= */

function findProvisionalMatch(
  item: ChecklistItem,
  provisionalStatus: ProvisionalStatusItem[] | undefined,
): ProvisionalStatusItem | undefined {
  if (!provisionalStatus || provisionalStatus.length === 0) {
    return undefined;
  }

  const platformText = item.platform.toLowerCase();

  return provisionalStatus.find((entry) =>
    platformText.includes(entry.platform.toLowerCase()),
  );
}

/* =========================================================
   COMPONENT
   ========================================================= */

export function OnboardingChecklist({
  items,
  employeeId,
}: {
  items: ChecklistItem[];
  employeeId: string;
}) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const [provisionalStatus, setProvisionalStatus] = useState<
    ProvisionalStatusItem[]
  >([]);

  const [loadingProvisional, setLoadingProvisional] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  /* =======================================================
     FETCH PROVISIONAL STATUS
     ======================================================= */

  useEffect(() => {
    if (!employeeId) return;

    let cancelled = false;

    setLoadingProvisional(true);

    getProvisionalStatus(employeeId)
      .then((data) => {
        if (!cancelled) {
          setProvisionalStatus(data);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingProvisional(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [employeeId]);

  /* =======================================================
     SORT CHECKLIST
     
     Priority:
     1. In Progress
     2. Not Started
     3. Completed
     4. Failed
     ======================================================= */

  const sortedItems = [...items].sort((a, b) => {
    const priority: Record<ChecklistStatus, number> = {
      inProgress: 1,
      pending: 2,
      done: 3,
      failed: 4,
      blocked: 4,
    };

    return priority[a.status] - priority[b.status];
  });

  const selectedItem =
    selectedIdx !== null ? sortedItems[selectedIdx] : null;

  const selectedProvisional = selectedItem
    ? findProvisionalMatch(
        selectedItem,
        provisionalStatus,
      )
    : undefined;

  /* =======================================================
     TICKET STATUS
     ======================================================= */

  const isTicketSuccess =
    selectedProvisional?.ticketStatus?.toLowerCase() === "success";

  /* =======================================================
     MODAL THEME
     ======================================================= */

  const theme = selectedItem
    ? statusThemeMap[selectedItem.status]
    : statusThemeMap.pending;

  const isDone = selectedItem?.status === "done";

  const isFailedLike =
    selectedItem?.status === "failed" ||
    selectedItem?.status === "blocked";

  /* =======================================================
     OPEN / CLOSE MODAL
     ======================================================= */

  const openItem = (idx: number) => {
    setShowPassword(false);
    setSelectedIdx(idx);
  };

  const closeModal = () => {
    setShowPassword(false);
    setSelectedIdx(null);
  };

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <>
      <style>{pcModalStyles}</style>

      {/* ===================================================
          ONBOARDING CHECKLIST HEADER
          =================================================== */}

      <div className="checklist-header">
        <div className="checklist-header-icon">
          <ClipboardCheck size={22} strokeWidth={2} />
        </div>

        <div className="checklist-header-content">
          <h2 className="checklist-header-title">
            Onboarding Checklist
          </h2>

          <div className="checklist-header-line" />
        </div>
      </div>

      {/* ===================================================
          CHECKLIST GRID
          =================================================== */}

      <div className="checklist-grid">
        {sortedItems.map((item, idx) => {
          const {
            icon: Icon,
            bg,
            color,
          } = getChecklistIcon(item);

          return (
            <div
              key={`${item.system}-${idx}`}
              className="pc-card"
              onClick={() => openItem(idx)}
            >
              {/* CARD TOP */}

              <div className="flex items-center gap-3">
                <div
                  className="pc-card-icon"
                  style={{
                    background: bg,
                    color,
                  }}
                >
                  <Icon size={18} />
                </div>

                <div className="min-w-0">
                  <div className="pc-card-title">
                    {item.system}
                  </div>

                  <div className="pc-card-platform">
                    {item.platform}
                  </div>
                </div>
              </div>

              {/* CARD FOOTER */}

              <div className="pc-card-footer">
                <StatusBadge
                  status={statusLabelMap[item.status]}
                />

                {/* VIEW DETAILS */}

                <button
                  type="button"
                  className="pc-view-details"
                  onClick={(e) => {
                    e.stopPropagation();
                    openItem(idx);
                  }}
                  aria-label={`View details for ${item.system}`}
                >
                  View details
                  <ArrowRight size={13} strokeWidth={2} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ===================================================
          MODAL
          =================================================== */}

      {selectedItem &&
        createPortal(
          <div
            className="pc-overlay"
            onClick={closeModal}
          >
            <div
              className="pc-modal"
              onClick={(e) => e.stopPropagation()}
            >
              {/* CLOSE */}

              <button
                className="pc-modal-close"
                onClick={closeModal}
                aria-label="Close"
              >
                <CloseIcon size={15} />
              </button>

              {/* MODAL HEADER */}

              <div className="pc-modal-header">
                <div
                  className="pc-modal-icon"
                  style={{
                    background:
                      getChecklistIcon(selectedItem).bg,

                    color:
                      getChecklistIcon(selectedItem).color,
                  }}
                >
                  {(() => {
                    const Icon =
                      getChecklistIcon(selectedItem).icon;

                    return <Icon size={19} />;
                  })()}
                </div>

                <div className="min-w-0">
                  <div className="pc-modal-title">
                    {selectedItem.system}
                  </div>

                  <div className="pc-modal-platform">
                    {selectedItem.platform}
                  </div>
                </div>
              </div>

              {/* STATUS */}

              <div className="pc-modal-status">
                <StatusBadge
                  status={
                    statusLabelMap[selectedItem.status]
                  }
                />
              </div>

              {/* DETAILS */}

              <div className="pc-details-card">
                <div className="pc-details-left">
                  <FileText size={15} />
                  Details
                </div>

                <div className="pc-details-right">
                  <RefreshCw size={13} />

                  {selectedItem.detail}
                </div>
              </div>

              {/* =================================================
                  PROVISIONING RESULT
                  ================================================= */}

              {loadingProvisional && (
                <div className="pc-loading">
                  <span className="pc-loading-spinner" />

                  Loading provisioning result...
                </div>
              )}

              {!loadingProvisional &&
                selectedProvisional && (
                  <>
                    {/* SECTION TITLE */}

                    <div
                      className="pc-section-title"
                      style={{
                        color: theme.titleColor,
                      }}
                    >
                      <ShieldCheck size={13} />

                      Provisioning Result
                    </div>

                    <div className="pc-result-grid">
                      {/* LEFT */}

                      <div className="pc-result-col-left">
                        {/* TICKET ID */}

                        <div className="checklist-detail-row">
                          <span className="pc-row-label">
                            <TicketIcon size={14} />

                            Ticket ID
                          </span>

                          <span className="pc-row-value">
                            {selectedProvisional.ticketID}
                          </span>
                        </div>

                        {/* TICKET STATUS */}

                        <div className="checklist-detail-row">
                          <span className="pc-row-label">
                            <ShieldCheck size={14} />

                            Ticket Status
                          </span>

                          <span
                            className="pc-status-pill"
                            style={{
                              background: isTicketSuccess
                                ? "#DCFCE7"
                                : "#FEE2E2",

                              color: isTicketSuccess
                                ? "#15803D"
                                : "#B91C1C",
                            }}
                          >
                            {isTicketSuccess ? (
                              <CheckCircle2 size={12} />
                            ) : (
                              <Clock size={12} />
                            )}

                            {
                              selectedProvisional.ticketStatus
                            }
                          </span>
                        </div>

                        {/* START TIME */}

                        <div className="checklist-detail-row">
                          <span className="pc-row-label">
                            <CalendarClock size={14} />

                            Start Time
                          </span>

                          <span className="pc-row-value">
                            {selectedProvisional.startTime}
                          </span>
                        </div>

                        {/* END TIME */}

                        <div className="checklist-detail-row">
                          <span className="pc-row-label">
                            <CalendarClock size={14} />

                            End Time
                          </span>

                          <span className="pc-row-value">
                            {selectedProvisional.endtime}
                          </span>
                        </div>
                      </div>

                      {/* RIGHT */}

                      <div className="pc-result-col-right">
                        {/* CREDENTIALS */}

                        {selectedProvisional.credentials
                          ?.username && (
                          <div className="pc-cred-box">
                            {/* USERNAME */}

                            <div className="pc-cred-row">
                              <span className="pc-cred-label">
                                <User size={14} />

                                Username
                              </span>

                              <div className="pc-cred-value-wrap">
                                <span className="pc-cred-value">
                                  {
                                    selectedProvisional
                                      .credentials
                                      .username
                                  }
                                </span>
                              </div>
                            </div>

                            {/* PASSWORD */}

                            {selectedProvisional
                              .credentials
                              ?.password && (
                              <div className="pc-cred-row">
                                <span className="pc-cred-label">
                                  <Lock size={14} />

                                  Password
                                </span>

                                <div className="pc-cred-value-wrap">
                                  <span className="pc-cred-value">
                                    {showPassword
                                      ? selectedProvisional
                                          .credentials
                                          .password
                                      : "•".repeat(
                                          selectedProvisional
                                            .credentials
                                            .password
                                            .length,
                                        )}
                                  </span>

                                  <button
                                    type="button"
                                    className="pc-icon-btn"
                                    onClick={() =>
                                      setShowPassword(
                                        (prev) => !prev,
                                      )
                                    }
                                    aria-label={
                                      showPassword
                                        ? "Hide password"
                                        : "Show password"
                                    }
                                  >
                                    {showPassword ? (
                                      <EyeOff size={13} />
                                    ) : (
                                      <Eye size={13} />
                                    )}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* NOTE */}

                        <div
                          className="pc-note"
                          style={{
                            background: theme.noteBg,
                            border: `1px solid ${theme.noteBorder}`,
                          }}
                        >
                          <div
                            className="pc-note-icon"
                            style={{
                              background:
                                theme.noteIconBg,
                            }}
                          >
                            {isDone ? (
                              <CheckCircle2 size={14} />
                            ) : isFailedLike ? (
                              <XOctagon size={14} />
                            ) : (
                              <AlertCircle size={14} />
                            )}
                          </div>

                          <div>
                            <div
                              className="pc-note-title"
                              style={{
                                color:
                                  theme.noteTitleColor,
                              }}
                            >
                              {isDone
                                ? "Provisioning Successful"
                                : isFailedLike
                                  ? "Provisioning Failed"
                                  : "Provisioning In Progress"}
                            </div>

                            <div
                              className="pc-note-text"
                              style={{
                                color:
                                  theme.noteTextColor,
                              }}
                            >
                              {selectedProvisional.note
                                ? selectedProvisional.note.replace(
                                    "{username}",
                                    selectedProvisional
                                      .credentials
                                      ?.username ?? "",
                                  )
                                : `${selectedItem.system} access for ${
                                    selectedProvisional
                                      .credentials
                                      ?.username ??
                                    "the employee"
                                  } has been ${
                                    isDone
                                      ? "successfully processed"
                                      : isFailedLike
                                        ? "unable to complete — check ticket status for details"
                                        : "processed — check ticket status for details"
                                  }.`}
                            </div>
                          </div>

                          {isDone && (
                            <PartyPopper
                              size={30}
                              className="pc-note-decoration"
                              style={{
                                color:
                                  theme.titleColor,
                              }}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}