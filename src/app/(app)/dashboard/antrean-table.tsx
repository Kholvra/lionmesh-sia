"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

import { DataTable, type DataTableColumn } from "@/components/ui";
import { useTableState } from "@/components/ui/use-table-state";
import type { TindakanAntrean } from "@/core/dashboard";

import { formatWaktu } from "./format";
import styles from "./dashboard.module.css";

export function AntreanTable({
  errorMessage,
  rows,
}: {
  errorMessage?: string;
  rows: readonly TindakanAntrean[];
}) {
  const router = useRouter();
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

  const {
    onPageChange,
    onSortChange,
    page,
    sort,
    totalItems,
    visibleRows,
  } = useTableState(rows, {
    columns,
    emptyMessage: "Tidak ada tindakan yang menunggu",
    initialSort: { columnId: "menunggu", direction: "ascending" },
  });


  return (
    <DataTable
      caption="Dokumen yang menunggu tindakan Anda"
      columns={columns}
      emptyMessage="Tidak ada tindakan yang menunggu"
      errorMessage={errorMessage}
      onPageChange={onPageChange}
      onRetry={() => router.refresh()}
      onSortChange={onSortChange}
      page={page}
      rowKey={(row) => row.dokumenId}
      rows={visibleRows}
      sort={sort}
      totalItems={totalItems}
    />
  );
}
