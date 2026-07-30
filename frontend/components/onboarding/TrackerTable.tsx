"use client";

import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { Employee } from "@/types/employee";
import { DataTable } from "@/components/common/DataTable";
import { Avatar } from "@/components/common/Avatar";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ProgressBar } from "@/components/common/ProgressBar";
import { Button } from "@/components/ui/button";

export function TrackerTable({ employees }: { employees: Employee[] }) {
  const router = useRouter();

  const columns: ColumnDef<Employee>[] = [
    {
      header: "Employee",
      accessorKey: "name",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.original.name} size={36} />
          <div className="font-medium text-vantara-navy">{row.original.name}</div>
        </div>
      ),
    },
    { header: "Department", accessorKey: "dept" },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      header: "Progress",
      accessorKey: "progress",
      cell: ({ row }) => (
        <div className="w-32">
          <ProgressBar value={row.original.progress} />
        </div>
      ),
    },
    { header: "Blockers", accessorKey: "blockers" },
    { header: "Start", accessorKey: "start" },
    { header: "Est. Completion", accessorKey: "est" },
    {
      header: "Remaining",
      accessorKey: "remaining",
      cell: ({ row }) => <span>{row.original.remaining}d</span>,
    },
    {
      header: "",
      id: "actions",
      cell: ({ row }) => (
        <Button
          variant="secondary"
          onClick={() => router.push(`/onboarding/${row.original.id}`)}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={employees}
      gridTemplateColumns="1.5fr 1fr 1.1fr 1fr 0.8fr 0.9fr 0.9fr 1fr 0.7fr"
    />
  );
}
