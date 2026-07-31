"use client";

import { useState, useMemo } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

const PAGE_SIZE_OPTIONS = [5, 10, 20];

export function DataTable<T>({
  columns,
  data,
  gridTemplateColumns,
  getRowId,
  selectedRowId,
  onRowClick,
}: {
  columns: ColumnDef<T, unknown>[];
  data: T[];
  gridTemplateColumns: string;
  getRowId?: (row: T) => string;
  selectedRowId?: string | null;
  onRowClick?: (row: T) => void;
}) {
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(5);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const allRows = table.getRowModel().rows;
  const totalRows = allRows.length;
  const pageCount = Math.max(1, Math.ceil(totalRows / pageSize));

  const safePageIndex = Math.min(pageIndex, pageCount - 1);

  const paginatedRows = useMemo(() => {
    const start = safePageIndex * pageSize;
    return allRows.slice(start, start + pageSize);
  }, [allRows, safePageIndex, pageSize]);

  const startItem = totalRows === 0 ? 0 : safePageIndex * pageSize + 1;
  const endItem = Math.min(totalRows, (safePageIndex + 1) * pageSize);

  const goToPage = (index: number) => {
    setPageIndex(Math.max(0, Math.min(index, pageCount - 1)));
  };

  const pageNumbers = useMemo(() => {
    const nums: number[] = [];
    for (let i = 0; i < pageCount; i++) nums.push(i);
    return nums;
  }, [pageCount]);

  return (
    <div className="flex h-full w-full flex-col">
      <div className="directory-table-wrap flex-1 overflow-auto">
        <div className="w-full min-w-full">
          {/* ================= HEADER ================= */}

          {table.getHeaderGroups().map((headerGroup) => (
            <div
              key={headerGroup.id}
              className="directory-table-header grid"
              style={{
                gridTemplateColumns,
              }}
            >
              {headerGroup.headers.map((header) => (
                <div
                  key={header.id}
                  className={`directory-th directory-col-${header.column.id}`}
                  style={{
                    padding: "0",
                    fontSize: "11px",
                  }}
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

          {/* ================= BODY ================= */}

          {paginatedRows.map((row) => {
            const rowId = getRowId ? getRowId(row.original) : row.id;

            const isSelected = rowId === selectedRowId;

            return (
              <div
                key={row.id}
                onClick={() => onRowClick?.(row.original)}
                className={`directory-table-row grid ${
                  isSelected ? "directory-table-row--selected" : ""
                }`}
                style={{
                  gridTemplateColumns,
                  minHeight: "38px",
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <div
                    key={cell.id}
                    className={`directory-td directory-col-${cell.column.id}`}
                    style={{
                      padding: "0",
                      fontSize: "13px",
                    }}
                  >
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </div>
                ))}
              </div>
            );
          })}

          {/* ================= EMPTY ================= */}

          {totalRows === 0 && (
            <div className="flex h-[250px] items-center justify-center text-sm text-vantara-text-muted">
              No employees found.
            </div>
          )}
        </div>
      </div>

      {/* ================= PAGINATION ================= */}

      {totalRows > 0 && (
        <div
          className="directory-pagination shrink-0"
          style={{
            padding: "8px 12px",
            fontSize: "13px",
          }}
        >
          <span className="directory-pagination-summary">
            Showing {startItem}-{endItem} of {totalRows}
          </span>

          <div
            className="directory-pagination-pages"
            style={{ gap: "4px", display: "flex", alignItems: "center" }}
          >
            <button
              type="button"
              className="directory-pagination-btn"
              aria-label="Previous page"
              disabled={safePageIndex === 0}
              onClick={() => goToPage(safePageIndex - 1)}
              style={{ width: "26px", height: "26px", padding: 0 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                <path d="M15 6l-6 6 6 6" />
              </svg>
            </button>

            {pageNumbers.map((num) => (
              <button
                key={num}
                type="button"
                className={`directory-pagination-btn ${
                  num === safePageIndex ? "directory-pagination-btn--active" : ""
                }`}
                onClick={() => goToPage(num)}
                style={{
                  width: "26px",
                  height: "26px",
                  padding: 0,
                  fontSize: "12px",
                }}
              >
                {num + 1}
              </button>
            ))}

            <button
              type="button"
              className="directory-pagination-btn"
              aria-label="Next page"
              disabled={safePageIndex >= pageCount - 1}
              onClick={() => goToPage(safePageIndex + 1)}
              style={{ width: "26px", height: "26px", padding: 0 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
          </div>

          <div
            className="directory-pagination-size"
            style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}
          >
            <span>Rows per page</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPageIndex(0);
              }}
              style={{ padding: "2px 6px", fontSize: "12px" }}
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}