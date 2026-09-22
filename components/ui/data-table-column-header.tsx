"use client";

import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon } from "lucide-react";
import type { Column, HeaderContext, RowData } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DataTableFeatures } from "@/components/ui/data-table-features";

export function DataTableColumnHeader<TData extends RowData, TValue>({
  column,
  title,
  className,
}: {
  column: Column<DataTableFeatures, TData, TValue>;
  title: string;
  className?: string;
}) {
  if (!column.getCanSort()) {
    return <span className={cn("text-xs font-medium uppercase tracking-wider text-muted-foreground", className)}>{title}</span>;
  }

  const sorted = column.getIsSorted();
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn("-ml-2 h-8 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground", className)}
      onClick={() => column.toggleSorting(sorted === "asc")}
    >
      {title}
      {sorted === "desc" ? (
        <ArrowDownIcon />
      ) : sorted === "asc" ? (
        <ArrowUpIcon />
      ) : (
        <ChevronsUpDownIcon className="opacity-50" />
      )}
    </Button>
  );
}

export function sortableHeader<TData extends RowData, TValue>(title: string, className?: string) {
  return ({ column }: HeaderContext<DataTableFeatures, TData, TValue>) => (
    <DataTableColumnHeader column={column} title={title} className={className} />
  );
}
