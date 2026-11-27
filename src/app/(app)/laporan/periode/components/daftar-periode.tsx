"use client";

import Link from "next/link";
import { useMemo } from "react";

import { DataTable } from "@/components/ui/data-table";
import type { DataTableColumn } from "@/components/ui/data-table.types";
import { StatusBadge } from "@/components/ui/status-badge";
import { useTableState } from "@/components/ui/use-table-state";
import type { PeriodeAkuntansiStatus } from "@/core/ledger";
import { formatTanggalWaktu } from "@/lib/format/date";

import { STATUS_PERIODE } from "../constants";
import styles from "../periode.module.css";

interface DaftarPeriodeProps {
  rows: readonly PeriodeAkuntansiStatus[];
}

export function DaftarPeriode({ rows }: DaftarPeriodeProps) {
  const { onPageChange, page, totalItems, visibleRows } = useTableState(rows, {
    initialSort: null,
  });

  const columns = useMemo<DataTableColumn<PeriodeAkuntansiStatus>[]>(
    () => [
      {
        id: "periode",
        header: "Periode",
        render: (row) => row.label,
      },
      {
        id: "status",
        header: "Status",
        render: (row) => (
          <StatusBadge status={row.status} statuses={STATUS_PERIODE} />
        ),
      },
      {
        id: "aksi",
        header: "Aksi",
        render: (row) => {
          if (row.status === "kunci") {
            return (
              <span className={styles.tableMeta}>
                Terkunci
                {row.dikunciAt
                  ? ` · ${formatTanggalWaktu(row.dikunciAt)}`
                  : ""}
              </span>
            );
          }

          if (row.bulan === 12) {
            return (
              <a className={styles.secondaryButton} href="#tutup-tahun">
                Tutup tahun
              </a>
            );
          }

          return (
            <Link
              className={styles.secondaryButton}
              href={`/laporan/periode/${row.kunci}/tutup`}
            >
              Tutup
            </Link>
          );
        },
      },
    ],
    [],
  );

  return (
    <DataTable
      caption="Daftar periode akuntansi"
      columns={columns}
      emptyMessage="Belum ada periode akuntansi."
      onPageChange={onPageChange}
      onSortChange={() => undefined}
      page={page}
      rowKey={(row) => row.kunci}
      rows={visibleRows}
      sort={null}
      totalItems={totalItems}
    />
  );
}
