import type { Key, ReactNode } from "react";

export const ROWS_PER_PAGE = 25;
export const LOADING_ROW_COUNT = 5;

export type TableSort = {
  columnId: string;
  direction: "ascending" | "descending";
};

export type DataTableColumn<Row> = {
  id: string;
  header: string;
  render: (row: Row) => ReactNode;
  sortValue?: (row: Row) => string | number;
  align?: "left" | "right";
};

/** Interactive callbacks stay in a client-owned module graph. */
export type DataTableProps<Row> = {
  caption: string;
  columns: readonly DataTableColumn<Row>[];
  rows: readonly Row[];
  rowKey: (row: Row) => Key;
  page: number;
  sort: TableSort | null;
  totalItems: number;
  loading?: boolean;
  emptyMessage?: string;
  errorMessage?: string;
  onRetry?: () => void;
  onPageChange: (page: number) => void;
  onSortChange: (sort: TableSort) => void;
};
