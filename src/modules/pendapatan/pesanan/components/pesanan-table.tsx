"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { StatusBadge } from "@/components/ui/status-badge";
import { PATH_PESANAN } from "../constants";
import { formatRupiah, formatTanggal } from "../format";
import styles from "../pesanan.module.css";
import { STATUS_PESANAN_OPTIONS, type PesananRingkas } from "../types";

type PesananTableProps = {
  items: PesananRingkas[];
};

export function PesananTable({ items }: PesananTableProps) {
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
      router.push(qs ? `${PATH_PESANAN}?${qs}` : PATH_PESANAN);
    });
  }

  return (
    <div className={styles.panelCard}>
      <div className={styles.filterBar}>
        <input
          aria-label="Cari nomor pesanan atau pelanggan"
          className={`${styles.inputControl} ${styles.searchGrow}`}
          defaultValue={cari}
          onChange={(e) => updateFilter(e.target.value, statusFilter)}
          placeholder="Cari nomor pesanan atau nama pelanggan..."
          type="search"
        />

        <select
          aria-label="Filter status pesanan"
          className={styles.selectControl}
          defaultValue={statusFilter}
          onChange={(e) => updateFilter(cari, e.target.value)}
        >
          <option value="SEMUA">Semua Status</option>
          {STATUS_PESANAN_OPTIONS.map((opt) => (
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
              <th>Nomor</th>
              <th>Tanggal</th>
              <th>Pelanggan</th>
              <th>Termin</th>
              <th className={styles.alignRight}>Total</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <p className={styles.emptyState}>
                    {cari || statusFilter !== "SEMUA"
                      ? "Tidak ada pesanan yang sesuai dengan filter pencarian."
                      : "Belum ada pesanan penjualan tercatat."}
                  </p>
                </td>
              </tr>
            ) : (
              items.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.nomor}</td>
                  <td>{formatTanggal(p.tanggal)}</td>
                  <td>
                    <div>{p.pelangganNama}</div>
                    <div
                      style={{
                        color: "var(--text-muted)",
                        fontSize: "var(--font-size-caption)",
                      }}
                    >
                      {p.pelangganKode}
                    </div>
                  </td>
                  <td>{p.terminHari} hari</td>
                  <td className={`${styles.alignRight} ${styles.numeric}`}>
                    {formatRupiah(p.total)}
                  </td>
                  <td>
                    <StatusBadge
                      status={p.status}
                      statuses={STATUS_PESANAN_OPTIONS}
                    />
                  </td>
                  <td>
                    <Link
                      className={styles.secondaryButton}
                      href={`${PATH_PESANAN}/${p.id}`}
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
