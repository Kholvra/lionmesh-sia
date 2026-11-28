"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import type { PelangganRingkas } from "@/core/pelanggan";
import { StatusBadge, type StatusOption } from "@/components/ui/status-badge";
import { formatRupiah, formatTermin } from "../format";
import { PATH_PELANGGAN } from "../constants";
import styles from "../pelanggan.module.css";

const STATUS_PELANGGAN_OPTIONS: readonly StatusOption[] = [
  { value: "aktif", label: "Aktif", tone: "success" },
  { value: "nonaktif", label: "Nonaktif", tone: "neutral" },
];

type PelangganTableProps = {
  items: PelangganRingkas[];
  terpilihId?: string;
  canManage: boolean;
};

export function PelangganTable({
  items,
  terpilihId,
  canManage,
}: PelangganTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const queryCari = searchParams.get("q") ?? "";

  function handleSearch(term: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (term.trim()) {
      params.set("q", term.trim());
    } else {
      params.delete("q");
    }
    startTransition(() => {
      router.push(`${PATH_PELANGGAN}?${params.toString()}`);
    });
  }

  return (
    <div className={styles.panelCard}>
      <div className={styles.panelHeader}>
        <div>
          <h2 className={styles.panelTitle}>Daftar Pelanggan</h2>
          <p className={styles.panelSubtitle}>
            Total {items.length} pelanggan terdaftar
          </p>
        </div>

        {canManage ? (
          <Link
            className={styles.primaryButton}
            href={`${PATH_PELANGGAN}?mode=new`}
          >
            + Pelanggan
          </Link>
        ) : null}
      </div>

      <div className={styles.searchBox}>
        <input
          aria-label="Cari pelanggan berdasarkan nama"
          className={styles.searchInput}
          defaultValue={queryCari}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Cari pelanggan berdasarkan nama..."
          type="search"
        />
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Kode</th>
              <th>Nama Pelanggan</th>
              <th>Termin</th>
              <th>Batas Kredit</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <p className={styles.emptyState}>
                    {queryCari
                      ? `Tidak ada pelanggan dengan nama "${queryCari}".`
                      : "Belum ada data pelanggan."}
                  </p>
                </td>
              </tr>
            ) : (
              items.map((p) => {
                const isSelected = p.id === terpilihId;
                return (
                  <tr
                    className={isSelected ? styles.rowSelected : undefined}
                    key={p.id}
                  >
                    <td style={{ fontWeight: 500 }}>{p.kodePelanggan}</td>
                    <td>{p.nama}</td>
                    <td>{formatTermin(p.terminHari)}</td>
                    <td className={styles.numeric}>
                      {formatRupiah(p.batasKredit)}
                    </td>
                    <td>
                      <StatusBadge
                        status={p.status}
                        statuses={STATUS_PELANGGAN_OPTIONS}
                      />
                    </td>
                    <td>
                      <Link
                        className={styles.secondaryButton}
                        href={`${PATH_PELANGGAN}?pelanggan=${p.id}${
                          queryCari ? `&q=${encodeURIComponent(queryCari)}` : ""
                        }`}
                        style={{ height: "30px", padding: "0 var(--space-2)" }}
                      >
                        Pilih
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
