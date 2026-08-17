"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";

import { Employee } from "@/types/employee";
import { DataTable } from "@/components/common/DataTable";
import { Avatar } from "@/components/common/Avatar";
import { StatusBadge } from "@/components/common/StatusBadge";
import { employeeTypeLabel } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export function EmployeeTable({
  employees,
}: {
  employees: Employee[];
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");

  const goToProfile = (id: string) => {
    router.push(`/employee/${id}`);
  };

  // ---------- MOBILE: card list ----------
  if (isMobile) {
    return (
      <div className="flex flex-col gap-3 p-3">
        {employees.map((emp) => {
          return (
            <div
              key={emp.id}
              onClick={() => goToProfile(emp.id)}
              className="cursor-pointer rounded-xl border border-vantara-border bg-white p-4 active:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <Avatar name={emp.name} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-semibold text-vantara-navy">
                    {emp.name}
                  </div>
                  <div className="text-xs text-vantara-text-muted">{emp.id}</div>
                </div>
                <StatusBadge status={emp.status} />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px]">
                <span className="rounded-full bg-vantara-navy/10 px-2.5 py-1 font-semibold text-vantara-navy whitespace-nowrap">
                  {employeeTypeLabel(emp.type)}
                </span>
                <span className="text-vantara-text-muted">{emp.dept}</span>
                <span className="text-vantara-text-muted">· {emp.manager}</span>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-[13px] font-medium text-vantara-navy">
                  {emp.progress}% complete
                </span>
                <span className="directory-view-link text-[13px]">View →</span>
              </div>
            </div>
          );
        })}

        {employees.length === 0 && (
          <div className="flex h-40 items-center justify-center text-sm text-vantara-text-muted">
            No employees found.
          </div>
        )}
      </div>
    );
  }

  // ---------- TABLET / DESKTOP: table, with fewer columns on tablet ----------
  const columns: ColumnDef<Employee>[] = [
    {
      id: "name",
      header: () => (
        <div className="flex w-full items-center justify-center text-gray-700">Employee</div>
      ),
      accessorKey: "name",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.original.name} size={36} />
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold text-vantara-navy">
              {row.original.name}
            </div>
            <div className="mt-0.5 text-xs text-vantara-text-muted">
              {row.original.employee_id}
            </div>
          </div>
        </div>
      ),
    },

    {
      id: "dept",
      header: () => (
        <div className="flex w-full items-center justify-center text-gray-700">Department</div>
      ),
      accessorKey: "dept",
      cell: ({ row }) => (
        <div className="flex w-full items-center justify-center">
          <span className="text-[13px] text-vantara-navy">{row.original.dept}</span>
        </div>
      ),
    },

    {
      id: "type",
      header: () => (
        <div className="flex w-full items-center justify-center text-gray-700">Employee Category</div>
      ),
      accessorKey: "type",
      cell: ({ row }) => (
        <div className="flex w-full items-center justify-center">
          <span className="inline-flex items-center rounded-full bg-vantara-navy/10 px-3 py-1 text-[13px] font-semibold text-vantara-navy whitespace-nowrap">
            {employeeTypeLabel(row.original.type)}
          </span>
        </div>
      ),
    },

    // Manager column hidden on tablet — too cramped
    ...(!isTablet
      ? [
          {
            id: "manager",
            header: () => (
              <div className="flex w-full items-center justify-center text-gray-700">Manager</div>
            ),
            accessorKey: "manager",
            cell: ({ row }: { row: { original: Employee } }) => (
              <div className="flex w-full items-center justify-center">
                <span className="truncate text-[13px] font-medium">
                  {row.original.manager}
                </span>
              </div>
            ),
          } as ColumnDef<Employee>,
        ]
      : []),

    {
      id: "status",
      header: () => (
        <div className="flex w-full items-center justify-center text-gray-700">Employment Lifecycle</div>
      ),
      accessorKey: "status",
      cell: ({ row }) => (
        <div className="flex w-full items-center justify-center">
          <StatusBadge status={row.original.status} />
        </div>
      ),
    },

    {
      id: "progress",
      header: () => (
        <div className="flex w-full items-center justify-center text-gray-700">Progress</div>
      ),
      accessorKey: "progress",
      cell: ({ row }) => (
        <div className="flex w-full items-center justify-center">
          <span className="text-[13px] font-medium text-vantara-navy">
            {row.original.progress}%
          </span>
        </div>
      ),
    },

    {
      id: "actions",
      header: () => (
        <div className="flex w-full items-center justify-center text-gray-700">Action</div>
      ),
      cell: ({ row }) => (
        <div className="flex w-full items-center justify-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goToProfile(row.original.id);
            }}
            className="rounded-lg bg-vantara-navy px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-vantara-navy/90"
          >
            View
          </button>
        </div>
      ),
    },
  ];

  const gridTemplateColumns = isTablet
  ? "minmax(200px,1.6fr) minmax(90px,0.9fr) minmax(110px,1fr) minmax(130px,1.1fr) minmax(70px,0.6fr)"
  : "minmax(220px,1.6fr) minmax(100px,0.9fr) minmax(120px,1fr) minmax(110px,1fr) minmax(140px,1.1fr) minmax(90px,0.9fr) minmax(70px,0.6fr)";

  return (
    <DataTable
      columns={columns}
      data={employees}
      getRowId={(row) => row.id}
      selectedRowId={selectedId}
      onRowClick={(row) => setSelectedId(row.id)}
      gridTemplateColumns={gridTemplateColumns}
    />
  );
}