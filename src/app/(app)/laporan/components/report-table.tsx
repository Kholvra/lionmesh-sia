"use client";

import { useMemo, useState } from "react";

import {
  DataTable,
  ROWS_PER_PAGE,
  type DataTableColumn,
} from "@/components/ui";

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
  const [page, setPage] = useState(1);

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

  const terlihat = useMemo(
    () => rows.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE),
    [page, rows],
  );

  return (
    <DataTable
      caption={caption}
      columns={tableColumns}
      emptyMessage={emptyMessage}
      onPageChange={setPage}
      onSortChange={tidakMengurutkan}
      page={page}
      rowKey={(row) => row.key}
      rows={terlihat}
      sort={null}
      totalItems={rows.length}
    />
  );
}
