"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

export function DataTable<T>({
  columns,
  data,
  gridTemplateColumns,
}: {
  columns: ColumnDef<T, unknown>[];
  data: T[];
  gridTemplateColumns: string;
}) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: "fit-content" }}>
        {table.getHeaderGroups().map((headerGroup) => (
          <div
            key={headerGroup.id}
            className="grid items-center bg-vantara-muted-bg"
            style={{
              gridTemplateColumns,
              borderBottom: "1px solid #E5E7EB",
              padding: "16px",
              gap: "8px",
            }}
          >
            {headerGroup.headers.map((header) => (
              <div
                key={header.id}
                className="whitespace-nowrap text-[12px] font-semibold uppercase tracking-wide text-vantara-text-muted"
              >
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
              </div>
            ))}
          </div>
        ))}

        {table.getRowModel().rows.map((row) => (
          <div
            key={row.id}
            className="grid items-center hover:bg-vantara-muted-bg"
            style={{
              gridTemplateColumns,
              borderBottom: "1px solid #E5E7EB",
              padding: "16px",
              gap: "8px",
            }}
          >
            {row.getVisibleCells().map((cell) => (
              <div key={cell.id} className="min-w-0 text-sm">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </div>
            ))}
          </div>
        ))}

        {table.getRowModel().rows.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-vantara-text-muted">
            No results found.
          </div>
        )}
      </div>
    </div>
  );
}
