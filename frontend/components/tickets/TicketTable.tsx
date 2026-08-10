"use client";

import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { Ticket } from "@/types/ticket";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PriorityBadge } from "@/components/common/PriorityBadge";

function TruncatedCell({ value, className }: { value: string; className?: string }) {
  return (
    <span className={`block truncate ${className ?? ""}`} title={value}>
      {value}
    </span>
  );
}

export function TicketTable({ tickets }: { tickets: Ticket[] }) {
  const router = useRouter();

  const columns: ColumnDef<Ticket>[] = [
    {
      header: "Ticket ID",
      accessorKey: "id",
      cell: ({ row }) => (
        <TruncatedCell value={row.original.id} className="font-semibold text-vantara-navy" />
      ),
    },
    {
      header: "Employee ID",
      accessorKey: "employeeId",
      cell: ({ row }) => <TruncatedCell value={row.original.employeeId} />,
    },
    {
      header: "Employee Name",
      accessorKey: "employeeName",
      cell: ({ row }) => <TruncatedCell value={row.original.employeeName} />,
    },
    {
      header: "Department",
      accessorKey: "department",
      cell: ({ row }) => <TruncatedCell value={row.original.department} />,
    },
    {
      header: "Request",
      accessorKey: "request",
      cell: ({ row }) => <TruncatedCell value={row.original.request} />,
    },
    {
      header: "System",
      accessorKey: "system",
      cell: ({ row }) => (
        <TruncatedCell value={row.original.system} className="text-xs text-vantara-text-muted" />
      ),
    },
    {
      header: "Priority",
      accessorKey: "priority",
      cell: ({ row }) => <PriorityBadge priority={row.original.priority} />,
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      header: "Created",
      accessorKey: "created",
      cell: ({ row }) => <TruncatedCell value={row.original.created} className="whitespace-nowrap" />,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={tickets}
      gridTemplateColumns="0.9fr 1fr 1.2fr 1fr 1.4fr 1.3fr 0.9fr 1fr 1fr"
      onRowClick={(ticket) => router.push(`/tickets/${ticket.id}`)}
    />
  );
}
