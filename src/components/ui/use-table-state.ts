"use client";

import { useCallback, useMemo, useState } from "react";

import {
  ROWS_PER_PAGE,
  type DataTableColumn,
  type TableSort,
} from "@/components/ui/data-table.types";

export type { TableSort } from "@/components/ui/data-table.types";

/** Missing values behave like empty strings, as in the existing table copies. */
export type TableCellValue = string | number | null | undefined;

export type SortValueAccessor<Row> = (
  row: Row,
  columnId: string,
) => TableCellValue;

export type SortableColumn<Row> = Pick<DataTableColumn<Row>, "id" | "sortValue">;

export type SortRowsOptions<Row> = {
  columns?: readonly SortableColumn<Row>[];
  getSortValue?: SortValueAccessor<Row>;
  locale?: string;
};

export type TableFilterState = {
  filterText: string;
  filterValue: string;
};

export type FilterRowsOptions<Row> = {
  getFilterValues?: (row: Row) => readonly TableCellValue[];
  getFilterValue?: (row: Row) => TableCellValue;
  matchAllFilterValue?: string;
  predicate?: (row: Row, filter: TableFilterState) => boolean;
};

export type UseTableStateOptions<Row> = SortRowsOptions<Row> &
  FilterRowsOptions<Row> & {
    initialSort?: TableSort | null;
    initialPage?: number;
    initialFilterText?: string;
    initialFilterValue?: string;
    pageSize?: number;
    resetPageOnSort?: boolean;
    resetPageOnFilterChange?: boolean;
    emptyMessage?: string;
  };

export type TableState<Row> = {
  page: number;
  pageSize: number;
  sort: TableSort | null;
  filterText: string;
  filterValue: string;
  filteredRows: Row[];
  sortedRows: Row[];
  visibleRows: Row[];
  totalItems: number;
  totalPages: number;
  isEmpty: boolean;
  emptyMessage: string;
  setPage: (page: number) => void;
  setSort: (sort: TableSort | null) => void;
  setFilterText: (text: string) => void;
  setFilterValue: (value: string) => void;
  setFilter: (filter: Partial<TableFilterState>) => void;
  toggleSort: (columnId: string) => void;
  onPageChange: (page: number) => void;
  onSortChange: (sort: TableSort) => void;
  reset: () => void;
};

function resolveSortValue<Row>(
  row: Row,
  columnId: string,
  columns: readonly SortableColumn<Row>[] | undefined,
  getSortValue: SortValueAccessor<Row> | undefined,
): TableCellValue {
  const column = columns?.find((item) => item.id === columnId);
  if (column?.sortValue) return column.sortValue(row);
  return getSortValue?.(row, columnId) ?? "";
}

/** Sorts a copy of the rows; numeric columns compare numerically, others use the Indonesian locale. */
export function sortRows<Row>(
  rows: readonly Row[],
  sort: TableSort | null,
  options: SortRowsOptions<Row> = {},
): Row[] {
  if (!sort) return [...rows];

  const factor = sort.direction === "ascending" ? 1 : -1;
  const locale = options.locale ?? "id";

  return [...rows].sort((leftRow, rightRow) => {
    const left = resolveSortValue(
      leftRow,
      sort.columnId,
      options.columns,
      options.getSortValue,
    );
    const right = resolveSortValue(
      rightRow,
      sort.columnId,
      options.columns,
      options.getSortValue,
    );
    if (typeof left === "number" && typeof right === "number") {
      return (left - right) * factor;
    }
    return String(left ?? "").localeCompare(String(right ?? ""), locale) * factor;
  });
}

/** Applies free-text search, an optional categorical value, and an optional extra rule. */
export function filterRows<Row>(
  rows: readonly Row[],
  filter: TableFilterState,
  options: FilterRowsOptions<Row> = {},
): Row[] {
  const kata = filter.filterText.trim().toLowerCase();
  const matchAll = options.matchAllFilterValue ?? "SEMUA";

  return rows.filter((row) => {
    if (kata) {
      const values = options.getFilterValues?.(row) ?? [];
      if (!values.some((value) => String(value ?? "").toLowerCase().includes(kata))) {
        return false;
      }
    }
    if (options.getFilterValue && filter.filterValue && filter.filterValue !== matchAll) {
      if (String(options.getFilterValue(row) ?? "") !== filter.filterValue) return false;
    }
    return options.predicate ? options.predicate(row, filter) : true;
  });
}

export function useTableState<Row>(
  rows: readonly Row[],
  options: UseTableStateOptions<Row> = {},
): TableState<Row> {
  const [initial] = useState(() => ({
    page: Math.max(1, options.initialPage ?? 1),
    sort: options.initialSort ?? null,
    filterText: options.initialFilterText ?? "",
    filterValue: options.initialFilterValue ?? "",
  }));
  const [page, setPageState] = useState(initial.page);
  const [sort, setSortState] = useState<TableSort | null>(initial.sort);
  const [filterText, setFilterTextState] = useState(initial.filterText);
  const [filterValue, setFilterValueState] = useState(initial.filterValue);

  const filter = useMemo<TableFilterState>(
    () => ({ filterText, filterValue }),
    [filterText, filterValue],
  );

  const filteredRows = useMemo(
    () =>
      filterRows(rows, filter, {
        getFilterValue: options.getFilterValue,
        getFilterValues: options.getFilterValues,
        matchAllFilterValue: options.matchAllFilterValue,
        predicate: options.predicate,
      }),
    [
      filter,
      options.getFilterValue,
      options.getFilterValues,
      options.matchAllFilterValue,
      options.predicate,
      rows,
    ],
  );

  const sortedRows = useMemo(
    () =>
      sortRows(filteredRows, sort, {
        columns: options.columns,
        getSortValue: options.getSortValue,
        locale: options.locale,
      }),
    [filteredRows, options.columns, options.getSortValue, options.locale, sort],
  );

  const pageSize = options.pageSize && options.pageSize > 0 ? options.pageSize : ROWS_PER_PAGE;
  const visibleRows = useMemo(
    () => sortedRows.slice((page - 1) * pageSize, page * pageSize),
    [page, pageSize, sortedRows],
  );
  const totalItems = sortedRows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const setPage = useCallback((nextPage: number) => setPageState(nextPage), []);

  const setSort = useCallback(
    (nextSort: TableSort | null) => {
      setSortState(nextSort);
      if (options.resetPageOnSort !== false) setPageState(1);
    },
    [options.resetPageOnSort],
  );

  const resetPageAfterFilter = useCallback(() => {
    if (options.resetPageOnFilterChange !== false) setPageState(1);
  }, [options.resetPageOnFilterChange]);

  const setFilterText = useCallback(
    (text: string) => {
      setFilterTextState(text);
      resetPageAfterFilter();
    },
    [resetPageAfterFilter],
  );

  const setFilterValue = useCallback(
    (value: string) => {
      setFilterValueState(value);
      resetPageAfterFilter();
    },
    [resetPageAfterFilter],
  );

  const setFilter = useCallback(
    (nextFilter: Partial<TableFilterState>) => {
      if (nextFilter.filterText !== undefined) setFilterTextState(nextFilter.filterText);
      if (nextFilter.filterValue !== undefined) setFilterValueState(nextFilter.filterValue);
      resetPageAfterFilter();
    },
    [resetPageAfterFilter],
  );

  const toggleSort = useCallback(
    (columnId: string) => {
      const direction =
        sort?.columnId === columnId && sort.direction === "ascending"
          ? "descending"
          : "ascending";
      setSort({ columnId, direction });
    },
    [setSort, sort],
  );

  const reset = useCallback(() => {
    setPageState(initial.page);
    setSortState(initial.sort);
    setFilterTextState(initial.filterText);
    setFilterValueState(initial.filterValue);
  }, [initial]);

  return {
    emptyMessage: options.emptyMessage ?? "Belum ada data.",
    filterText,
    filterValue,
    filteredRows,
    isEmpty: totalItems === 0,
    onPageChange: setPage,
    onSortChange: setSort,
    page,
    pageSize,
    reset,
    setFilter,
    setFilterText,
    setFilterValue,
    setPage,
    setSort,
    sortedRows,
    toggleSort,
    totalItems,
    totalPages,
    visibleRows,
    sort,
  };
}
