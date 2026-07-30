import { ColumnDef } from "@tanstack/react-table";
import { ActiveRequest } from "@/types/monitoring";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";

const columns: ColumnDef<ActiveRequest>[] = [
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

export function ActiveRequestsTable({ requests }: { requests: ActiveRequest[] }) {
  return (
    <DataTable
      columns={columns}
      data={requests}
      gridTemplateColumns="1.3fr 1fr 1fr 1fr 1fr"
    />
  );
}
