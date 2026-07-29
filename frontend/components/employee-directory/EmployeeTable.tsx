"use client";

import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { Employee } from "@/types/employee";
import { DataTable } from "@/components/common/DataTable";
import { Avatar } from "@/components/common/Avatar";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ProgressBar } from "@/components/common/ProgressBar";
import { employeeTypeStyle } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function EmployeeTable({ employees }: { employees: Employee[] }) {
  const router = useRouter();

  const columns: ColumnDef<Employee>[] = [
    {
      header: "Employee",
      accessorKey: "name",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.original.name} size={36} />
          <div>
            <div className="font-medium text-vantara-navy">{row.original.name}</div>
            <div className="text-xs text-vantara-text-muted">{row.original.id}</div>
          </div>
        </div>
      ),
    },
    { header: "Department", accessorKey: "dept" },
    {
      header: "Type",
      accessorKey: "type",
      cell: ({ row }) => {
        const { bg, text } = employeeTypeStyle(row.original.type);
        return (
          <span
            className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize"
            style={{ backgroundColor: bg, color: text }}
          >
            {row.original.type}
          </span>
        );
      },
    },
    { header: "Manager", accessorKey: "manager" },
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
          <ProgressBar value={row.original.progress} label={undefined} />
          <div className="mt-1 text-xs text-vantara-text-muted">
            {row.original.progress}%
          </div>
        </div>
      ),
    },
    { header: "Blockers", accessorKey: "blockers" },
    {
      header: "",
      id: "actions",
      cell: ({ row }) => (
        <Button
          variant="secondary"
          onClick={() => router.push(`/employee/${row.original.id}`)}
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
      gridTemplateColumns="1.4fr 0.8fr 0.9fr 1.1fr 1.1fr 1fr 0.8fr 0.7fr"
    />
  );
}
