"use client";

import { useMemo, useState } from "react";
import { useTable, type ColumnDef, type PaginationState, type RowData, type SortingState } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { dataTableFeatures, type DataTableFeatures } from "@/components/ui/data-table-features";
import { cn } from "@/lib/utils";

export function DataTable<TData extends RowData>({
  columns,
  data,
  search,
  pageSize = 10,
  empty = "Tidak ada data.",
  framed = true,
  className,
}: {
  columns: ColumnDef<DataTableFeatures, TData, unknown>[];
  data: TData[];
  search?: string;
  pageSize?: number;
  empty?: string;
  framed?: boolean;
  className?: string;
}) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const paginate = pageSize > 0 && data.length > pageSize;
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: paginate ? pageSize : Math.max(data.length, 1),
  });
  const resolvedPagination = useMemo(
    () => ({
      pageIndex: paginate ? pagination.pageIndex : 0,
      pageSize: paginate ? pageSize : Math.max(data.length, 1),
    }),
    [data.length, pageSize, paginate, pagination.pageIndex],
  );

  const table = useTable(
    {
      features: dataTableFeatures,
      data,
      columns,
      globalFilterFn: "includesString",
      state: {
        globalFilter,
        pagination: resolvedPagination,
        sorting,
      },
      onGlobalFilterChange: (updater) => {
        setGlobalFilter(updater);
        setPagination((current) => ({ ...current, pageIndex: 0 }));
      },
      onPaginationChange: setPagination,
      onSortingChange: setSorting,
    },
    (state) => ({
      sorting: state.sorting,
      pagination: state.pagination,
      globalFilter: state.globalFilter,
    }),
  );

  const rows = table.getRowModel().rows;
  const pageCount = table.getPageCount();

  return (
    <div className={cn("grid gap-3", className)}>
      {search ? (
        <div className={framed ? "px-1" : "px-4 pt-1"}>
          <Input
            value={globalFilter}
            onChange={(event) => table.setGlobalFilter(event.target.value)}
            placeholder={search}
            className="max-w-sm"
          />
        </div>
      ) : null}
      <div className={cn(framed ? "overflow-hidden rounded-xl border border-border" : "overflow-x-auto")}>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="whitespace-nowrap">
                    {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length ? (
              rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getAllCells().map((cell) => (
                    <TableCell key={cell.id} className="whitespace-normal">
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  {empty}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {paginate && pageCount > 1 ? (
        <div className={cn("flex items-center justify-between gap-3 text-sm text-muted-foreground", framed ? "px-1" : "px-4")}>
          <p>
            Halaman {resolvedPagination.pageIndex + 1} dari {Math.max(pageCount, 1)}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Sebelumnya
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
