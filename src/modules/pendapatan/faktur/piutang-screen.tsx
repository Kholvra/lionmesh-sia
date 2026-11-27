import Link from "next/link";

import { StatusBadge } from "@/components/ui/status-badge";
import { cekIzin } from "@/lib/auth/permissions";
import type { Profile } from "@/lib/auth/types";
import { AGING_BUCKETS, PATH_FAKTUR } from "./constants";
import { formatRupiah, formatTanggal } from "./format";
import styles from "./faktur.module.css";
import { getDaftarPiutang } from "./queries";
import { STATUS_FAKTUR_OPTIONS } from "./types";

type PiutangScreenProps = {
  profile: Profile;
  tanggal: string;
  cari?: string;
};

export async function PiutangScreen({
  profile,
  tanggal,
  cari,
}: PiutangScreenProps) {
  // AC-13: Penjualan tidak melihat piutang; hanya Accounting & Manajemen
  const canViewPiutang = cekIzin(profile.peran, "lihat_piutang");

  if (!canViewPiutang) {
    return (
      <section aria-label="Daftar piutang" className={styles.page}>
        <section className={styles.panelCard} aria-labelledby="akses-ditolak">
          <h1 className={styles.title} id="akses-ditolak">
            Akses Ditolak
          </h1>
          <p className={styles.emptyState}>
            Peran Anda tidak berwenang melihat daftar piutang dan umur faktur.
          </p>
        </section>
      </section>
    );
  }

  const data = await getDaftarPiutang(tanggal, cari);

  return (
    <section aria-label="Daftar piutang dan umur" className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.breadcrumb}>
            Siklus Pendapatan / Faktur Penjualan / Piutang & Aging
          </p>
          <h1 className={styles.title}>Daftar Piutang & Umur Faktur</h1>
          <p className={styles.description}>
            Posisi piutang usaha per tanggal laporan {formatTanggal(data.tanggalLaporan)}{" "}
            dengan pengelompokan bucket umur jatuh tempo.
          </p>
        </div>

        <div className={styles.headerActions}>
          <Link className={styles.secondaryButton} href={PATH_FAKTUR}>
            ← Daftar Faktur
          </Link>
        </div>
      </header>

      <div className={styles.panelCard} style={{ marginBottom: "var(--space-6)" }}>
        <form className={styles.filterBar} method="GET">
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="tanggal">
              Tanggal Laporan
            </label>
            <input
              className={styles.inputControl}
              defaultValue={tanggal}
              id="tanggal"
              name="tanggal"
              type="date"
            />
          </div>
          <div className={`${styles.fieldGroup} ${styles.searchGrow}`}>
            <label className={styles.fieldLabel} htmlFor="q">
              Cari Pelanggan / Nomor Faktur
            </label>
            <input
              className={styles.inputControl}
              defaultValue={cari ?? ""}
              id="q"
              name="q"
              placeholder="Nama pelanggan atau nomor faktur..."
              type="search"
            />
          </div>
          <div style={{ alignSelf: "flex-end" }}>
            <button className={styles.primaryButton} type="submit">
              Terapkan
            </button>
          </div>
        </form>
      </div>

      {/* Aging Buckets Summary */}
      <div className={styles.panelCard} style={{ marginBottom: "var(--space-6)" }}>
        <div className={styles.panelHeader}>
          <div>
            <h2 className={styles.panelTitle}>Ringkasan Umur Piutang (Aging)</h2>
            <p className={styles.panelSubtitle}>
              Total Piutang Aktif: {formatRupiah(data.totalPiutang)}
            </p>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
            gap: "var(--space-4)",
          }}
        >
          {AGING_BUCKETS.map((b) => (
            <div
              key={b.key}
              style={{
                padding: "var(--space-3)",
                border: "var(--border-width-default) solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
              }}
            >
              <p className={styles.statLabel}>{b.label}</p>
              <p className={`${styles.statValue} ${styles.numeric}`}>
                {formatRupiah(data.totalsByBucket[b.key])}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.panelCard}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>No. Faktur</th>
                <th>Pelanggan</th>
                <th>Tanggal Faktur</th>
                <th>Jatuh Tempo</th>
                <th className={styles.alignRight}>Umur (Hari)</th>
                <th>Bucket Umur</th>
                <th className={styles.alignRight}>Sisa Piutang</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <p className={styles.emptyState}>
                      Tidak ada piutang terbuka per tanggal ini.
                    </p>
                  </td>
                </tr>
              ) : (
                data.rows.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>
                      <Link href={`${PATH_FAKTUR}/${encodeURIComponent(r.nomor)}`}>
                        {r.nomor}
                      </Link>
                    </td>
                    <td>{r.pelangganNama}</td>
                    <td>{formatTanggal(r.tanggalFaktur)}</td>
                    <td>{formatTanggal(r.jatuhTempo)}</td>
                    <td className={`${styles.alignRight} ${styles.numeric}`}>
                      {r.umurHari > 0 ? `+${r.umurHari}` : r.umurHari}
                    </td>
                    <td>{r.bucketLabel}</td>
                    <td className={`${styles.alignRight} ${styles.numeric}`}>
                      {formatRupiah(r.sisaPiutang)}
                    </td>
                    <td>
                      <StatusBadge
                        status={r.status}
                        statuses={STATUS_FAKTUR_OPTIONS}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
