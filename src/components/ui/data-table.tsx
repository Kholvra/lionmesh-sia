"use client";

import { DataTableView } from "@/components/ui/data-table-view";
import type { DataTableProps } from "@/components/ui/data-table.types";

export type {
  DataTableColumn,
  DataTableProps,
  TableSort,
} from "@/components/ui/data-table.types";

export function DataTable<Row>(props: DataTableProps<Row>) {
  return (
    <DataTableView
      {...props}
      emptyMessage={props.emptyMessage ?? "Belum ada data."}
    />
  );
}
