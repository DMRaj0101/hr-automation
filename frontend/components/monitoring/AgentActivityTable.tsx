import { ColumnDef } from "@tanstack/react-table";
import { RecentLog } from "@/types/monitoring";
import { DataTable } from "@/components/common/DataTable";

const columns: ColumnDef<RecentLog>[] = [
  { header: "Agent", accessorKey: "agent" },
  { header: "Action", accessorKey: "action" },
  {
    header: "Employee",
    accessorKey: "employee_name",
    cell: ({ row }) => row.original.employee_name ?? "—",
  },
  {
    header: "When",
    accessorKey: "timestamp",
    cell: ({ row }) => row.original.timestamp ?? "—",
  },
];

// Overall recent agent activity across all employees, most-recent-first --
// backed directly by GET /system-health/recent-logs (routers/healthcheck.py)
// via useMonitoring()'s recentLogs query. Same feed the Live Banner shows
// the newest row of; this table shows all of it (currently capped at 10
// rows server-side), not a per-employee rollup.
export function AgentActivityTable({ activity }: { activity: RecentLog[] }) {
  if (activity.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-vantara-text-muted">
        No recent agent activity.
      </div>
    );
  }

  return (
    <DataTable
      columns={columns}
      data={activity}
      gridTemplateColumns="1fr 1.6fr 1.3fr 1fr"
      getRowId={(row) => `${row.timestamp}-${row.agent}-${row.action}`}
    />
  );
}
