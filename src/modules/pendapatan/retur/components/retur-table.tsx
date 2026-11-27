"use client";

import Link from "next/link";

import { StatusBadge } from "@/components/ui/status-badge";
import { PATH_RETUR } from "../constants";
import { formatRupiah, formatTanggal } from "../format";
import styles from "../retur.module.css";
import { STATUS_RETUR_OPTIONS, type ReturRingkas } from "../types";

type ReturTableProps = {
  rows: ReturRingkas[];
};

export function ReturTable({ rows }: ReturTableProps) {
  if (rows.length === 0) {
    return (
      <p className={styles.emptyState}>
        Belum ada dokumen retur penjualan untuk filter saat ini.
      </p>
    );
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Nomor Retur</th>
            <th>Tanggal</th>
            <th>Faktur Asal</th>
            <th>Pelanggan</th>
            <th className={styles.alignRight}>Kredit Memo</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>
                <Link
                  className={styles.docLink}
                  href={`${PATH_RETUR}/${encodeURIComponent(row.nomor)}`}
                >
                  {row.nomor}
                </Link>
              </td>
              <td>{formatTanggal(row.tanggal)}</td>
              <td>
                <Link
                  className={styles.docLink}
                  href={`/pendapatan/faktur/${encodeURIComponent(row.fakturNomor)}`}
                >
                  {row.fakturNomor}
                </Link>
              </td>
              <td>
                <div>{row.pelangganNama}</div>
                <div className={styles.fieldHint}>{row.pelangganKode}</div>
              </td>
              <td className={`${styles.alignRight} ${styles.numeric}`}>
                {row.status === "SELESAI"
                  ? formatRupiah(row.totalKreditMemo)
                  : "-"}
              </td>
              <td>
                <StatusBadge
                  status={row.status}
                  statuses={STATUS_RETUR_OPTIONS}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
