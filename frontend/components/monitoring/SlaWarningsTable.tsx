import { ColumnDef } from "@tanstack/react-table";
import { SlaWarning } from "@/types/monitoring";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";

const BREACH_CAUSE_LABEL: Record<string, string> = {
  human_pending: "Pending with Team",
  agent_stuck_retry: "Agent Stuck Retrying",
  agent_not_escalated: "Agent Not Escalated",
};

const columns: ColumnDef<SlaWarning>[] = [
  { header: "Ticket", accessorKey: "ticket_id" },
  { header: "Employee", accessorKey: "employee_name" },
  { header: "System", accessorKey: "system" },
  {
    header: "Breach Cause",
    accessorKey: "breach_cause",
    cell: ({ row }) => (
      <StatusBadge
        status={BREACH_CAUSE_LABEL[row.original.breach_cause] ?? row.original.breach_cause}
      />
    ),
  },
  {
    header: "Breach Since",
    accessorKey: "breach_since",
    cell: ({ row }) =>
      row.original.breach_since ? new Date(row.original.breach_since).toLocaleString() : "—",
  },
  {
    header: "SLA (hrs)",
    accessorKey: "sla_hours",
  },
];

// Backed by GET /system-health/sla-warnings (routers/healthcheck.py) via
// useMonitoring()'s slaWarnings query -- currently breaching SLA tickets.
export function SlaWarningsTable({ warnings }: { warnings: SlaWarning[] }) {
  if (warnings.length === 0) {
    return (
      <div className="flex h-16 items-center justify-center text-sm text-vantara-text-muted">
        No SLA breaches right now.
      </div>
    );
  }

  return (
    <DataTable
      columns={columns}
      data={warnings}
      gridTemplateColumns="1fr 1.3fr 1fr 1.4fr 1.4fr 0.8fr"
      getRowId={(row) => row.ticket_id}
    />
  );
}
