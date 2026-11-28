"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { StatusBadge } from "@/components/ui/status-badge";
import { PATH_PEMBAYARAN } from "../constants";
import { formatRupiah, formatTanggal } from "../format";
import styles from "../pembayaran.module.css";
import { STATUS_PEMBAYARAN_OPTIONS, type PembayaranRingkas } from "../types";

type PembayaranTableProps = {
  items: PembayaranRingkas[];
};

export function PembayaranTable({ items }: PembayaranTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const cari = searchParams.get("q") ?? "";
  const statusFilter = searchParams.get("status") ?? "SEMUA";

  function updateFilter(nextCari: string, nextStatus: string) {
    const params = new URLSearchParams();
    if (nextCari.trim()) params.set("q", nextCari.trim());
    if (nextStatus && nextStatus !== "SEMUA") params.set("status", nextStatus);

    startTransition(() => {
      const qs = params.toString();
      router.push(qs ? `${PATH_PEMBAYARAN}?${qs}` : PATH_PEMBAYARAN);
    });
  }

  return (
    <div className={styles.panelCard}>
      <div className={styles.filterBar}>
        <input
          aria-label="Cari nomor bukti kas masuk, referensi, atau pelanggan"
          className={`${styles.inputControl} ${styles.searchGrow}`}
          defaultValue={cari}
          onChange={(e) => updateFilter(e.target.value, statusFilter)}
          placeholder="Cari nomor BKM, referensi, atau pelanggan..."
          type="search"
        />

        <select
          aria-label="Filter status penerimaan"
          className={styles.selectControl}
          defaultValue={statusFilter}
          onChange={(e) => updateFilter(cari, e.target.value)}
        >
          <option value="SEMUA">Semua Status</option>
          {STATUS_PEMBAYARAN_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>No. BKM</th>
              <th>Tanggal</th>
              <th>Pelanggan</th>
              <th>Metode</th>
              <th>No. Referensi</th>
              <th className={styles.alignRight}>Nominal</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <p className={styles.emptyState}>
                    {cari || statusFilter !== "SEMUA"
                      ? "Tidak ada penerimaan pembayaran yang sesuai filter."
                      : "Belum ada penerimaan pembayaran tercatat."}
                  </p>
                </td>
              </tr>
            ) : (
              items.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.nomor}</td>
                  <td>{formatTanggal(p.tanggal)}</td>
                  <td>{p.pelangganNama}</td>
                  <td>{p.metode}</td>
                  <td>{p.nomorReferensi ?? "-"}</td>
                  <td className={`${styles.alignRight} ${styles.numeric}`}>
                    {formatRupiah(p.nominal)}
                  </td>
                  <td>
                    <StatusBadge
                      status={p.status}
                      statuses={STATUS_PEMBAYARAN_OPTIONS}
                    />
                  </td>
                  <td>
                    <Link
                      className={styles.secondaryButton}
                      href={`${PATH_PEMBAYARAN}/${encodeURIComponent(p.nomor)}`}
                    >
                      Detail
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
