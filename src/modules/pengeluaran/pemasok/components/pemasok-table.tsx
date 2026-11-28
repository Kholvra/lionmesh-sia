"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { useTableState } from "@/components/ui/use-table-state";
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

export function PemasokTable({
  errorMessage,
  rows,
  selectedId,
}: PemasokTableProps) {
  const router = useRouter();

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

  const table = useTableState(rows, {
    columns,
    emptyMessage: "Belum ada pemasok. Tambahkan pemasok pertama.",
    initialSort: { columnId: "nama", direction: "ascending" },
  });

  return (
    <DataTable
      caption="Daftar pemasok"
      columns={columns}
      emptyMessage={table.emptyMessage}
      errorMessage={errorMessage}
      onPageChange={table.onPageChange}
      onRetry={() => router.refresh()}
      onSortChange={table.onSortChange}
      page={table.page}
      rowKey={(row) => row.id}
      rows={table.visibleRows}
      sort={table.sort}
      totalItems={table.totalItems}
    />
  );
}
