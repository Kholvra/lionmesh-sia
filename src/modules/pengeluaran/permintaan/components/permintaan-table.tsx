"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { useTableState } from "@/components/ui/use-table-state";
import type { PermintaanPembelianView } from "@/core/pengadaan";
import { PATH_PERMINTAAN } from "../constants";
import { formatTanggalSingkat, STATUS_PERMINTAAN } from "../format";
import styles from "../permintaan.module.css";

type Props = {
  rows: readonly PermintaanPembelianView[];
  selectedId?: string;
  errorMessage?: string;
};

export function PermintaanTable({ errorMessage, rows, selectedId }: Props) {
  const router = useRouter();

  const columns = useMemo<DataTableColumn<PermintaanPembelianView>[]>(
    () => [
      {
        id: "nomor",
        header: "Nomor",
        sortValue: (row) => row.nomor,
        render: (row) => (
          <Link
            aria-current={selectedId === row.dokumenId ? "true" : undefined}
            className={`${styles.tableLink} ${
              selectedId === row.dokumenId ? styles.tableLinkActive : ""
            }`}
            href={`${PATH_PERMINTAAN}?permintaan=${row.dokumenId}`}
          >
            {row.nomor}
          </Link>
        ),
      },
      {
        id: "tanggal",
        header: "Butuh",
        sortValue: (row) => row.tanggalButuh,
        render: (row) => formatTanggalSingkat(row.tanggalButuh),
      },
      {
        id: "pemohon",
        header: "Pemohon",
        sortValue: (row) => row.pemohonNama,
        render: (row) => row.pemohonNama,
      },
      {
        id: "status",
        header: "Status",
        sortValue: (row) => row.status,
        render: (row) => (
          <span className={styles.statusCell}>
            <StatusBadge status={row.status} statuses={STATUS_PERMINTAAN} />
          </span>
        ),
      },
    ],
    [selectedId],
  );

  const table = useTableState(rows, {
    columns,
    emptyMessage: "Belum ada permintaan pembelian.",
    initialSort: { columnId: "nomor", direction: "ascending" },
  });

  return (
    <DataTable
      caption="Daftar permintaan pembelian"
      columns={columns}
      emptyMessage={table.emptyMessage}
      errorMessage={errorMessage}
      onPageChange={table.onPageChange}
      onRetry={() => router.refresh()}
      onSortChange={table.onSortChange}
      page={table.page}
      rowKey={(row) => row.dokumenId}
      rows={table.visibleRows}
      sort={table.sort}
      totalItems={table.totalItems}
    />
  );
}
