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
import type { PermintaanPembelianView } from "@/core/pengadaan";
import { PATH_PERMINTAAN } from "../constants";
import {
  formatTanggalSingkat,
  STATUS_PERMINTAAN,
} from "../format";
import styles from "../permintaan.module.css";

type Props = {
  rows: readonly PermintaanPembelianView[];
  selectedId?: string;
  errorMessage?: string;
};

function sortRows(
  rows: readonly PermintaanPembelianView[],
  columns: readonly DataTableColumn<PermintaanPembelianView>[],
  sort: TableSort | null,
): PermintaanPembelianView[] {
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

export function PermintaanTable({ errorMessage, rows, selectedId }: Props) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<TableSort | null>({
    columnId: "nomor",
    direction: "ascending",
  });

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

  const sorted = useMemo(() => sortRows(rows, columns, sort), [columns, rows, sort]);
  const visible = useMemo(
    () => sorted.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE),
    [page, sorted],
  );

  return (
    <DataTable
      caption="Daftar permintaan pembelian"
      columns={columns}
      emptyMessage="Belum ada permintaan pembelian."
      errorMessage={errorMessage}
      onPageChange={setPage}
      onRetry={() => router.refresh()}
      onSortChange={(next) => {
        setSort(next);
        setPage(1);
      }}
      page={page}
      rowKey={(row) => row.dokumenId}
      rows={visible}
      sort={sort}
      totalItems={sorted.length}
    />
  );
}
