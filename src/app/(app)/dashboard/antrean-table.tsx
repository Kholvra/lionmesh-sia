"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import {
  DataTable,
  ROWS_PER_PAGE,
  type DataTableColumn,
  type TableSort,
} from "@/components/ui";
import type { TindakanAntrean } from "@/core/dashboard";

import { formatWaktu } from "./format";
import styles from "./dashboard.module.css";

function sortRows(
  rows: readonly TindakanAntrean[],
  columns: readonly DataTableColumn<TindakanAntrean>[],
  sort: TableSort | null,
): TindakanAntrean[] {
  if (!sort) return [...rows];

  const column = columns.find((item) => item.id === sort.columnId);
  if (!column?.sortValue) return [...rows];

  const factor = sort.direction === "ascending" ? 1 : -1;
  return [...rows].sort((kiri, kanan) => {
    const a = column.sortValue?.(kiri) ?? "";
    const b = column.sortValue?.(kanan) ?? "";
    if (typeof a === "number" && typeof b === "number") {
      return (a - b) * factor;
    }
    return String(a).localeCompare(String(b), "id") * factor;
  });
}

export function AntreanTable({
  errorMessage,
  rows,
}: {
  errorMessage?: string;
  rows: readonly TindakanAntrean[];
}) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<TableSort | null>({
    columnId: "menunggu",
    direction: "ascending",
  });

  const columns = useMemo<DataTableColumn<TindakanAntrean>[]>(
    () => [
      {
        id: "nomor",
        header: "Nomor",
        sortValue: (row) => row.nomor,
        render: (row) => (
          <span className={styles.nomor}>
            {row.tautan ? (
              <Link className={styles.tableLink} href={row.tautan}>
                {row.nomor}
              </Link>
            ) : (
              row.nomor
            )}
          </span>
        ),
      },
      {
        id: "jenis",
        header: "Jenis",
        sortValue: (row) => row.jenis,
        render: (row) => row.jenis,
      },
      {
        id: "siklus",
        header: "Siklus",
        sortValue: (row) => row.siklus,
        render: (row) => row.siklus,
      },
      {
        id: "tahap",
        header: "Tahap",
        sortValue: (row) => row.tahap,
        render: (row) => row.tahap,
      },
      {
        id: "menunggu",
        header: "Mulai menunggu",
        align: "right",
        sortValue: (row) => Date.parse(row.mulaiMenunggu),
        render: (row) => (
          <span className={styles.waktu}>{formatWaktu(row.mulaiMenunggu)}</span>
        ),
      },
    ],
    [],
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
      caption="Dokumen yang menunggu tindakan Anda"
      columns={columns}
      emptyMessage="Tidak ada tindakan yang menunggu"
      errorMessage={errorMessage}
      onPageChange={setPage}
      onRetry={() => router.refresh()}
      onSortChange={(nextSort) => {
        setSort(nextSort);
        setPage(1);
      }}
      page={page}
      rowKey={(row) => row.dokumenId}
      rows={visibleRows}
      sort={sort}
      totalItems={sortedRows.length}
    />
  );
}
