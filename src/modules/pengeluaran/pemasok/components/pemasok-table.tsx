"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import {
  DataTable,
  ROWS_PER_PAGE,
  StatusBadge,
  type DataTableColumn,
  type TableSort,
} from "@/components/ui";
import type { Pemasok } from "@/core/pemasok";
import { formatRupiah } from "@/lib/format/money";
import { PATH_PEMASOK } from "../constants";
import {
  formatPersen,
  rupiahKeCents,
  STATUS_PEMASOK,
  statusPemasok,
} from "../format";
import styles from "../pemasok.module.css";

type PemasokTableProps = {
  rows: readonly Pemasok[];
  selectedId?: string;
  errorMessage?: string;
};

function sortRows(
  rows: readonly Pemasok[],
  columns: readonly DataTableColumn<Pemasok>[],
  sort: TableSort | null,
): Pemasok[] {
  if (!sort) return [...rows];

  const column = columns.find((item) => item.id === sort.columnId);
  if (!column?.sortValue) return [...rows];

  const factor = sort.direction === "ascending" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const left = column.sortValue?.(a) ?? "";
    const right = column.sortValue?.(b) ?? "";
    if (typeof left === "number" && typeof right === "number") {
      return (left - right) * factor;
    }
    return String(left).localeCompare(String(right), "id") * factor;
  });
}

export function PemasokTable({
  errorMessage,
  rows,
  selectedId,
}: PemasokTableProps) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<TableSort | null>({
    columnId: "nama",
    direction: "ascending",
  });

  const columns = useMemo<DataTableColumn<Pemasok>[]>(
    () => [
      {
        id: "nama",
        header: "Nama pemasok",
        sortValue: (row) => row.nama,
        render: (row) => (
          <Link
            aria-current={selectedId === row.id ? "true" : undefined}
            className={`${styles.tableLink} ${
              selectedId === row.id ? styles.tableLinkActive : ""
            }`}
            href={`${PATH_PEMASOK}?pemasok=${row.id}`}
          >
            {row.nama}
          </Link>
        ),
      },
      {
        id: "termin",
        header: "Termin",
        align: "right",
        sortValue: (row) => row.termin_hari,
        render: (row) => `${row.termin_hari} hari`,
      },
      {
        id: "toleransi",
        header: "Toleransi",
        align: "right",
        sortValue: (row) => Number(row.toleransi_persen),
        render: (row) =>
          `${formatPersen(row.toleransi_persen)} / ${formatRupiah(
            rupiahKeCents(row.toleransi_nominal),
          )}`,
      },
      {
        id: "status",
        header: "Status",
        sortValue: (row) => statusPemasok(row.aktif),
        render: (row) => (
          <span className={styles.statusCell}>
            <StatusBadge
              status={statusPemasok(row.aktif)}
              statuses={STATUS_PEMASOK}
            />
          </span>
        ),
      },
    ],
    [selectedId],
  );

  const sortedRows = useMemo(
    () => sortRows(rows, columns, sort),
    [columns, rows, sort],
  );
  const visibleRows = useMemo(
    () => sortedRows.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE),
    [page, sortedRows],
  );

  return (
    <DataTable
      caption="Daftar pemasok"
      columns={columns}
      emptyMessage="Belum ada pemasok. Tambahkan pemasok pertama."
      errorMessage={errorMessage}
      onPageChange={setPage}
      onRetry={() => router.refresh()}
      onSortChange={(nextSort) => {
        setSort(nextSort);
        setPage(1);
      }}
      page={page}
      rowKey={(row) => row.id}
      rows={visibleRows}
      sort={sort}
      totalItems={sortedRows.length}
    />
  );
}
