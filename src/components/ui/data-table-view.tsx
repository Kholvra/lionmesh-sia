import type { Key } from "react";

import { LOADING_ROW_COUNT, ROWS_PER_PAGE } from "@/components/ui/data-table.types";
import type {
  DataTableColumn,
  DataTableProps,
  TableSort,
} from "@/components/ui/data-table.types";
import styles from "@/components/ui/data-table.module.css";

type DataTableViewProps<Row> = DataTableProps<Row> & {
  emptyMessage: string;
};

type TableHeadProps<Row> = {
  columns: readonly DataTableColumn<Row>[];
  sort: TableSort | null;
  onSort: (column: DataTableColumn<Row>) => void;
};

function nextSort<Row>(
  column: DataTableColumn<Row>,
  currentSort: TableSort | null,
): TableSort | undefined {
  if (!column.sortValue) return undefined;
  const direction =
    currentSort?.columnId === column.id && currentSort.direction === "ascending"
      ? "descending"
      : "ascending";
  return { columnId: column.id, direction };
}

function TableHead<Row>({ columns, onSort, sort }: TableHeadProps<Row>) {
  return (
    <thead className={styles.tableHead}>
      <tr>
        {columns.map((column) => {
          const sorted = sort?.columnId === column.id;
          const ariaSort = sorted ? sort?.direction ?? "none" : "none";
          return (
            <th
              key={column.id}
              aria-sort={ariaSort}
              className={styles.tableHeaderCell}
              data-align={column.align ?? "left"}
              scope="col"
            >
              {column.sortValue ? (
                <button
                  aria-label={`Urutkan ${column.header} ${
                    sorted && sort?.direction === "ascending" ? "menurun" : "menaik"
                  }`}
                  className={styles.sortButton}
                  onClick={() => onSort(column)}
                  type="button"
                >
                  {column.header}
                  <span aria-hidden="true" className={styles.sortIndicator}>
                    {sorted
                      ? sort?.direction === "ascending"
                        ? "↑"
                        : "↓"
                      : "↕"}
                  </span>
                </button>
              ) : (
                column.header
              )}
            </th>
          );
        })}
      </tr>
    </thead>
  );
}

function LoadingBody<Row>({ columns }: Pick<TableHeadProps<Row>, "columns">) {
  return (
    <tbody>
      {Array.from({ length: LOADING_ROW_COUNT }, (_, rowIndex) => (
        <tr aria-hidden="true" className={styles.tableRow} key={rowIndex}>
          {columns.map((column) => (
            <td
              className={styles.tableCell}
              data-align={column.align ?? "left"}
              key={`${column.id}-${rowIndex}`}
            >
              <span className={styles.skeleton} />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

function MessageBody({
  columnCount,
  message,
  onRetry,
  role,
}: {
  columnCount: number;
  message: string;
  onRetry?: () => void;
  role: "alert" | "status";
}) {
  return (
    <tbody>
      <tr>
        <td className={styles.tableMessage} colSpan={columnCount}>
          <span className={styles.tableMessageContent} role={role}>
            {message}
            {onRetry ? (
              <button
                className={styles.paginationButton}
                onClick={onRetry}
                type="button"
              >
                Coba lagi
              </button>
            ) : null}
          </span>
        </td>
      </tr>
    </tbody>
  );
}

function TableRows<Row>({
  columns,
  rowKey,
  rows,
}: {
  columns: readonly DataTableColumn<Row>[];
  rowKey: (row: Row) => Key;
  rows: readonly Row[];
}) {
  return (
    <tbody>
      {rows.map((row) => (
        <tr className={styles.tableRow} key={rowKey(row)}>
          {columns.map((column) => (
            <td
              className={styles.tableCell}
              data-align={column.align ?? "left"}
              key={column.id}
            >
              {column.render(row)}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

function TableBody<Row>({
  columns,
  emptyMessage,
  errorMessage,
  loading,
  onRetry,
  rowKey,
  rows,
}: {
  columns: readonly DataTableColumn<Row>[];
  emptyMessage: string;
  errorMessage?: string;
  loading: boolean;
  onRetry?: () => void;
  rowKey: (row: Row) => Key;
  rows: readonly Row[];
}) {
  if (loading) return <LoadingBody columns={columns} />;
  if (errorMessage !== undefined) {
    return (
      <MessageBody
        columnCount={columns.length}
        message={errorMessage}
        onRetry={onRetry}
        role="alert"
      />
    );
  }
  if (rows.length === 0) {
    return (
      <MessageBody
        columnCount={columns.length}
        message={emptyMessage}
        role="status"
      />
    );
  }

  return <TableRows columns={columns} rowKey={rowKey} rows={rows} />;
}

function TablePagination({
  currentPage,
  endItem,
  onPageChange,
  startItem,
  totalItems,
  totalPages,
}: {
  currentPage: number;
  endItem: number;
  onPageChange: (page: number) => void;
  startItem: number;
  totalItems: number;
  totalPages: number;
}) {
  return (
    <div className={styles.pagination}>
      <span>
        Menampilkan {startItem}–{endItem} dari {totalItems}
      </span>
      <nav aria-label="Navigasi halaman" className={styles.paginationControls}>
        <button
          aria-label="Halaman sebelumnya"
          className={styles.paginationButton}
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          type="button"
        >
          Sebelumnya
        </button>
        <span aria-current="page" className={styles.currentPage}>
          {currentPage} / {totalPages}
        </span>
        <button
          aria-label="Halaman berikutnya"
          className={styles.paginationButton}
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          type="button"
        >
          Berikutnya
        </button>
      </nav>
    </div>
  );
}

export function DataTableView<Row>({
  caption,
  columns,
  emptyMessage,
  errorMessage,
  loading = false,
  onPageChange,
  onRetry,
  onSortChange,
  page,
  rowKey,
  rows,
  sort,
  totalItems,
}: DataTableViewProps<Row>) {
  const totalPages = Math.max(1, Math.ceil(totalItems / ROWS_PER_PAGE));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * ROWS_PER_PAGE + 1;
  const endItem = Math.min(currentPage * ROWS_PER_PAGE, totalItems);
  const showStateRow = loading || errorMessage !== undefined || rows.length === 0;

  function changeSort(column: DataTableColumn<Row>) {
    const sortValue = nextSort(column, sort);
    if (sortValue) onSortChange(sortValue);
  }

  return (
    <div className={styles.dataTable}>
      <div className={styles.tableViewport}>
        <table className={styles.table}>
          <caption className={styles.srOnly}>{caption}</caption>
          <TableHead columns={columns} onSort={changeSort} sort={sort} />
          <TableBody
            columns={columns}
            emptyMessage={emptyMessage}
            errorMessage={errorMessage}
            loading={loading}
            onRetry={onRetry}
            rowKey={rowKey}
            rows={rows.slice(0, ROWS_PER_PAGE)}
          />
        </table>
      </div>
      {!showStateRow && totalItems > 0 ? (
        <TablePagination
          currentPage={currentPage}
          endItem={endItem}
          onPageChange={onPageChange}
          startItem={startItem}
          totalItems={totalItems}
          totalPages={totalPages}
        />
      ) : null}
    </div>
  );
}
