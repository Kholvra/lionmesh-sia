"use client";

import { useMemo } from "react";

import { DataTable } from "@/components/ui/data-table";
import type { DataTableColumn } from "@/components/ui/data-table.types";
import { useTableState } from "@/components/ui/use-table-state";

export interface ReportColumn {
  id: string;
  header: string;
  align?: "left" | "right";
}

export interface ReportCell {
  text: string;
}

export interface ReportRow {
  key: string;
  cells: readonly ReportCell[];
}

interface ReportTableProps {
  caption: string;
  columns: readonly ReportColumn[];
  rows: readonly ReportRow[];
  emptyMessage: string;
}

function tidakMengurutkan() {
  // Reports have a fixed, meaningful order (date or account number).
}

export function ReportTable({
  caption,
  columns,
  rows,
  emptyMessage,
}: ReportTableProps) {
  const { onPageChange, page, totalItems, visibleRows } = useTableState(rows, {
    initialSort: null,
  });

  const tableColumns = useMemo<DataTableColumn<ReportRow>[]>(
    () =>
      columns.map((column, index) => ({
        id: column.id,
        header: column.header,
        align: column.align,
        render: (row) => row.cells[index]?.text ?? "—",
      })),
    [columns],
  );

  return (
    <DataTable
      caption={caption}
      columns={tableColumns}
      emptyMessage={emptyMessage}
      onPageChange={onPageChange}
      onSortChange={tidakMengurutkan}
      page={page}
      rowKey={(row) => row.key}
      rows={visibleRows}
      sort={null}
      totalItems={totalItems}
    />
  );
}
