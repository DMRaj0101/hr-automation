import { ColumnDef } from "@tanstack/react-table";
import { AgentActivity } from "@/types/monitoring";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";

const columns: ColumnDef<AgentActivity>[] = [
  { header: "Employee", accessorKey: "name" },
  { header: "Department", accessorKey: "dept" },
  {
    header: "Status",
    accessorKey: "status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  { header: "Retries", accessorKey: "retries" },
  { header: "Open Tickets", accessorKey: "tickets" },
];

// Backend agent activity endpoint doesn't exist yet -- renders an empty
// state instead of table rows until it does. Swap the placeholder below
// for a real query (see useMonitoring) once the endpoint ships.
export function AgentActivityTable({ activity }: { activity: AgentActivity[] }) {
  if (activity.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-vantara-text-muted">
        Agent activity data isn&apos;t available yet.
      </div>
    );
  }

  return (
    <DataTable
      columns={columns}
      data={activity}
      gridTemplateColumns="1.3fr 1fr 1fr 1fr 1fr"
    />
  );
}
