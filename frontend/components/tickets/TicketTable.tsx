"use client";

import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { Ticket } from "@/types/ticket";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { Button } from "@/components/ui/button";

export function TicketTable({ tickets }: { tickets: Ticket[] }) {
  const router = useRouter();

  const columns: ColumnDef<Ticket>[] = [
    {
      header: "Ticket",
      accessorKey: "id",
      cell: ({ row }) => (
        <span className="font-semibold text-vantara-navy">{row.original.id}</span>
      ),
    },
    { header: "Employee", accessorKey: "employee" },
    { header: "Dept", accessorKey: "dept" },
    { header: "Issue", accessorKey: "issue" },
    {
      header: "System",
      accessorKey: "system",
      cell: ({ row }) => (
        <span className="text-xs text-vantara-text-muted">{row.original.system}</span>
      ),
    },
    { header: "Team", accessorKey: "team" },
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
    { header: "Time", accessorKey: "time" },
    {
      header: "",
      id: "actions",
      cell: ({ row }) => (
        <Button
          variant="secondary"
          onClick={() => router.push(`/tickets/${row.original.id}`)}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={tickets}
      gridTemplateColumns="0.8fr 1.1fr 0.9fr 1.3fr 1.2fr 0.7fr 0.8fr 0.9fr 0.8fr 0.6fr"
    />
  );
}
