"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  DataTable,
  ROWS_PER_PAGE,
  StatusBadge,
  type DataTableColumn,
} from "@/components/ui";
import type { PeriodeAkuntansiStatus } from "@/core/ledger";
import { formatTanggalWaktu } from "@/lib/format/date";

import { STATUS_PERIODE } from "../constants";
import styles from "../periode.module.css";

interface DaftarPeriodeProps {
  rows: readonly PeriodeAkuntansiStatus[];
}

export function DaftarPeriode({ rows }: DaftarPeriodeProps) {
  const [page, setPage] = useState(1);

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

  const terlihat = useMemo(
    () => rows.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE),
    [page, rows],
  );

  return (
    <DataTable
      caption="Daftar periode akuntansi"
      columns={columns}
      emptyMessage="Belum ada periode akuntansi."
      onPageChange={setPage}
      onSortChange={() => undefined}
      page={page}
      rowKey={(row) => row.kunci}
      rows={terlihat}
      sort={null}
      totalItems={rows.length}
    />
  );
}
