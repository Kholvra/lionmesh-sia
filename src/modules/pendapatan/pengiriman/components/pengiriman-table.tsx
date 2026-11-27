"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { StatusBadge } from "@/components/ui/status-badge";
import { PATH_PENGIRIMAN } from "../constants";
import { formatTanggal } from "../format";
import styles from "../pengiriman.module.css";
import { STATUS_PENGIRIMAN_OPTIONS, type PengirimanRingkas } from "../types";

type PengirimanTableProps = {
  items: PengirimanRingkas[];
};

export function PengirimanTable({ items }: PengirimanTableProps) {
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
      router.push(qs ? `${PATH_PENGIRIMAN}?${qs}` : PATH_PENGIRIMAN);
    });
  }

  return (
    <div className={styles.panelCard}>
      <div className={styles.filterBar}>
        <input
          aria-label="Cari nomor surat jalan, pesanan, atau pelanggan"
          className={`${styles.inputControl} ${styles.searchGrow}`}
          defaultValue={cari}
          onChange={(e) => updateFilter(e.target.value, statusFilter)}
          placeholder="Cari nomor SJ, nomor pesanan, atau pelanggan..."
          type="search"
        />

        <select
          aria-label="Filter status pengiriman"
          className={styles.selectControl}
          defaultValue={statusFilter}
          onChange={(e) => updateFilter(cari, e.target.value)}
        >
          <option value="SEMUA">Semua Status</option>
          {STATUS_PENGIRIMAN_OPTIONS.map((opt) => (
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
              <th>No. Surat Jalan</th>
              <th>Tanggal</th>
              <th>Pesanan Asal</th>
              <th>Pelanggan</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <p className={styles.emptyState}>
                    {cari || statusFilter !== "SEMUA"
                      ? "Tidak ada pengiriman yang sesuai dengan filter."
                      : "Belum ada pengiriman / surat jalan tercatat."}
                  </p>
                </td>
              </tr>
            ) : (
              items.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.nomor}</td>
                  <td>{formatTanggal(p.tanggalPengiriman)}</td>
                  <td>{p.pesananNomor}</td>
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
                  <td>
                    <StatusBadge
                      status={p.status}
                      statuses={STATUS_PENGIRIMAN_OPTIONS}
                    />
                  </td>
                  <td>
                    <Link
                      className={styles.secondaryButton}
                      href={`${PATH_PENGIRIMAN}/${encodeURIComponent(p.nomor)}`}
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
