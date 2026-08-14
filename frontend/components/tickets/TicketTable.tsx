"use client";

import { ColumnDef } from "@tanstack/react-table";

import { Ticket } from "@/types/ticket";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export function TicketTable({ tickets }: { tickets: Ticket[] }) {
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");

  // ---------- MOBILE: card list ----------
  if (isMobile) {
    return (
      <div className="flex flex-col gap-3 p-3">
        {tickets.map((t) => (
          <div
            key={t.id}
            className="rounded-xl border border-vantara-border bg-white p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-semibold text-vantara-navy">
                  {t.id}
                </div>
                <div className="text-xs text-vantara-text-muted truncate">
                  {t.employee} · {t.employee_id}
                </div>
              </div>
              <StatusBadge status={t.status} />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px]">
              <PriorityBadge priority={t.priority} />
              <span className="text-vantara-text-muted">{t.dept}</span>
            </div>

            <div className="mt-2 flex" title={t.issue}>
              <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-vantara-navy">
                {t.issue}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-gray-700">{t.time}</span>
            </div>
          </div>
        ))}

        {tickets.length === 0 && (
          <div className="flex h-40 items-center justify-center text-sm text-vantara-text-muted">
            No tickets found.
          </div>
        )}
      </div>
    );
  }

  // ---------- TABLET / DESKTOP: table, with fewer columns on tablet ----------
  const columns: ColumnDef<Ticket>[] = [
    {
      id: "id",
      header: () => (
        <div className="flex w-full items-center justify-center text-gray-700">Ticket ID</div>
      ),
      accessorKey: "id",
      cell: ({ row }) => (
        <div className="flex w-full items-center justify-center">
          <span className="text-[13px] font-semibold text-vantara-navy">
            {row.original.id}
          </span>
        </div>
      ),
    },

    {
      id: "employeeId",
      header: () => (
        <div className="flex w-full items-center justify-center text-gray-700">Employee ID</div>
      ),
      accessorKey: "employee_id",
      cell: ({ row }) => (
        <div className="flex w-full items-center justify-center">
          <span
            className="text-[13px] text-gray-800"
            title={row.original.employee_id}
          >
            {row.original.employee_id}
          </span>
        </div>
      ),
    },

    {
      id: "employee",
      header: () => (
        <div className="flex w-full items-center justify-center text-gray-700">Employee Name</div>
      ),
      accessorKey: "employee",
      cell: ({ row }) => (
        <div className="flex w-full items-center justify-center">
          <span className="truncate text-[13px] font-semibold text-vantara-navy">
            {row.original.employee}
          </span>
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
          <span className="truncate text-[13px] text-vantara-navy">
            {row.original.dept}
          </span>
        </div>
      ),
    },

    {
      id: "issue",
      header: () => (
        <div className="flex w-full items-center justify-center text-gray-700">Request</div>
      ),
      accessorKey: "issue",
      cell: ({ row }) => (
        <div
          className="flex w-full items-center justify-center"
          title={row.original.issue}
        >
          <span className="flex-1 min-w-0 truncate text-[13px] font-semibold text-vantara-navy">
            {row.original.issue}
          </span>
        </div>
      ),
    },

    // System column hidden on tablet — too cramped
    ...(!isTablet
      ? [
          {
            id: "system",
            header: () => (
              <div className="flex w-full items-center justify-center text-gray-700">System</div>
            ),
            accessorKey: "system",
            cell: ({ row }: { row: { original: Ticket } }) => (
              <div
                className="flex w-full items-center justify-center"
                title={row.original.system}
              >
                <span className="flex-1 min-w-0 truncate text-xs text-gray-800">
                  {row.original.system}
                </span>
              </div>
            ),
          } as ColumnDef<Ticket>,
        ]
      : []),

    {
      id: "priority",
      header: () => (
        <div className="flex w-full items-center justify-center text-gray-700">Priority</div>
      ),
      accessorKey: "priority",
      cell: ({ row }) => (
        <div className="flex w-full items-center justify-center">
          <PriorityBadge priority={row.original.priority} />
        </div>
      ),
    },

    {
      id: "status",
      header: () => (
        <div className="flex w-full items-center justify-center text-gray-700">Status</div>
      ),
      accessorKey: "status",
      cell: ({ row }) => (
        <div className="flex w-full items-center justify-center">
          <StatusBadge status={row.original.status} />
        </div>
      ),
    },

    {
      id: "time",
      header: () => (
        <div className="flex w-full items-center justify-center text-gray-700">Created On</div>
      ),
      accessorKey: "time",
      cell: ({ row }) => (
        <div className="flex w-full items-center justify-center">
          <span className="text-xs text-gray-800" title={row.original.time}>
            {row.original.time}
          </span>
        </div>
      ),
    },
  ];

  // Tablet: id, employeeId, employee, dept, issue, priority, status, time = 8 columns
  // Desktop: id, employeeId, employee, dept, issue, system, priority, status, time = 9 columns
  const gridTemplateColumns = isTablet
    ? "minmax(80px,0.7fr) minmax(90px,0.7fr) minmax(120px,1fr) minmax(80px,0.7fr) minmax(140px,1.1fr) minmax(90px,0.8fr) minmax(90px,0.8fr) minmax(80px,0.7fr)"
    : "minmax(80px,0.7fr) minmax(90px,0.7fr) minmax(130px,1.1fr) minmax(90px,0.7fr) minmax(140px,1.2fr) minmax(110px,0.9fr) minmax(90px,0.8fr) minmax(90px,0.8fr) minmax(80px,0.7fr)";

  // Sum of the minmax floor widths — forces the grid to its true width so
  // it overflows the viewport and DataTable's internal wrapper scrolls
  // horizontally instead of squeezing every column down.
  const minTableWidth = isTablet ? "780px" : "900px";

  return (
    <div className="h-full w-full">
      <DataTable
        columns={columns}
        data={tickets}
        gridTemplateColumns={gridTemplateColumns}
        minWidth={minTableWidth}
      />
    </div>
  );
}