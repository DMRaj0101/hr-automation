"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTicketDetail } from "@/hooks/useTicketDetail";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ProgressBar } from "@/components/common/ProgressBar";
import { ErrorDetailsCard } from "@/components/tickets/ErrorDetailsCard";
import { StatusHistory } from "@/components/tickets/StatusHistory";
import { TicketDetail } from "@/types/ticket";

const STATUS_COLOR: Record<string, string> = {
  Open: "#1D4ED8",
  "In Progress": "#92400E",
  Pending: "#92400E",
  Failed: "#991B1B",
  Closed: "#166534",
};

function buildFallbackDetail(status: string, priority: string): TicketDetail {
  const slaTotalHours = priority === "Critical" ? 4 : priority === "High" ? 8 : 24;
  return {
    slaTotalHours,
    slaRemainingHours: Math.round(slaTotalHours * 0.6 * 10) / 10,
    slaPercentElapsed: 40,
    errorType: "—",
    errorCode: "—",
    errorMessage: "No error recorded for this ticket.",
    retryCount: 0,
    nextRetry: "—",
    statusHistory: [
      { status, time: "—", color: STATUS_COLOR[status] ?? "#6B7280" },
    ],
    notes: [],
  };
}

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { ticket, detail } = useTicketDetail(id);

  if (ticket.isLoading || !ticket.data) {
    return <div className="page-content text-vantara-text-muted">Loading ticket...</div>;
  }

  const t = ticket.data;
  const d = detail.data ?? buildFallbackDetail(t.status, t.priority);

  return (
    <div className="page-content mx-auto max-w-[900px] space-y-5">
      <Link
        href="/tickets"
        className="inline-block text-[13px] font-semibold"
        style={{ color: "#D9A653", marginBottom: 20 }}
      >
        ← Ticket Queue
      </Link>

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold text-vantara-navy">{t.id}</h1>
          <PriorityBadge priority={t.priority} />
          <StatusBadge status={t.status} />
        </div>
        <p className="mt-1 text-sm text-vantara-text-muted">
          {t.issue} — {t.system} · {t.employee} ({t.dept})
        </p>
      </div>

      <div className="rounded-2xl p-6" style={{ backgroundColor: "#FEF3C7", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div className="flex items-center justify-between text-sm" style={{ color: "#92400E" }}>
          <span className="font-semibold">SLA — {d.slaTotalHours} hours total</span>
          <span className="font-semibold">{d.slaRemainingHours} hours remaining</span>
        </div>
        <ProgressBar
          value={d.slaPercentElapsed}
          className="mt-3"
          height={8}
          trackColor="rgba(146,64,14,0.15)"
          fillColor="#92400E"
        />
      </div>

      <ErrorDetailsCard detail={d} />
      <StatusHistory history={d.statusHistory} />

      <div className="card">
        <h3 className="font-semibold text-vantara-navy">Notes</h3>
        <div className="mt-4 space-y-3">
          {d.notes.length === 0 && (
            <p className="text-sm text-vantara-text-muted">No notes yet.</p>
          )}
          {d.notes.map((note, idx) => (
            <p key={idx} className="text-sm text-vantara-navy">
              <span className="font-semibold">
                {note.author} · {note.time}:
              </span>{" "}
              <span className="text-vantara-text-muted">{note.text}</span>
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
