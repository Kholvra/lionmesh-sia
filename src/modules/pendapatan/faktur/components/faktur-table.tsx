"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { StatusBadge } from "@/components/ui/status-badge";
import { PATH_FAKTUR } from "../constants";
import { formatRupiah, formatTanggal } from "../format";
import styles from "../faktur.module.css";
import { STATUS_FAKTUR_OPTIONS, type FakturRingkas } from "../types";

type FakturTableProps = {
  items: FakturRingkas[];
};

export function FakturTable({ items }: FakturTableProps) {
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
      router.push(qs ? `${PATH_FAKTUR}?${qs}` : PATH_FAKTUR);
    });
  }

  return (
    <div className={styles.panelCard}>
      <div className={styles.filterBar}>
        <input
          aria-label="Cari nomor faktur, SJ, faktur pajak, atau pelanggan"
          className={`${styles.inputControl} ${styles.searchGrow}`}
          defaultValue={cari}
          onChange={(e) => updateFilter(e.target.value, statusFilter)}
          placeholder="Cari nomor faktur, surat jalan, faktur pajak, atau pelanggan..."
          type="search"
        />

        <select
          aria-label="Filter status faktur"
          className={styles.selectControl}
          defaultValue={statusFilter}
          onChange={(e) => updateFilter(cari, e.target.value)}
        >
          <option value="SEMUA">Semua Status</option>
          {STATUS_FAKTUR_OPTIONS.map((opt) => (
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
              <th>No. Faktur</th>
              <th>Tanggal</th>
              <th>Jatuh Tempo</th>
              <th>Surat Jalan</th>
              <th>Pelanggan</th>
              <th className={styles.alignRight}>Total</th>
              <th className={styles.alignRight}>Sisa Piutang</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={9}>
                  <p className={styles.emptyState}>
                    {cari || statusFilter !== "SEMUA"
                      ? "Tidak ada faktur yang sesuai filter."
                      : "Belum ada faktur penjualan tercatat."}
                  </p>
                </td>
              </tr>
            ) : (
              items.map((f) => (
                <tr key={f.id}>
                  <td style={{ fontWeight: 600 }}>{f.nomor}</td>
                  <td>{formatTanggal(f.tanggalFaktur)}</td>
                  <td>{formatTanggal(f.jatuhTempo)}</td>
                  <td>{f.pengirimanNomor}</td>
                  <td>{f.pelangganNama}</td>
                  <td className={`${styles.alignRight} ${styles.numeric}`}>
                    {formatRupiah(f.total)}
                  </td>
                  <td className={`${styles.alignRight} ${styles.numeric}`}>
                    {formatRupiah(f.sisaPiutang)}
                  </td>
                  <td>
                    <StatusBadge
                      status={f.status}
                      statuses={STATUS_FAKTUR_OPTIONS}
                    />
                  </td>
                  <td>
                    <Link
                      className={styles.secondaryButton}
                      href={`${PATH_FAKTUR}/${encodeURIComponent(f.nomor)}`}
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
