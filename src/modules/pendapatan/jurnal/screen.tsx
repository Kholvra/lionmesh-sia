import Link from "next/link";

import { cekIzin } from "@/lib/auth/permissions";
import type { Profile } from "@/lib/auth/types";
import styles from "./jurnal.module.css";
import { listJurnalPenjualan } from "./queries";

type JurnalListScreenProps = {
  profile: Profile;
  sumberTipe?: string;
  cari?: string;
};

const FILTER_TABS = [
  { key: "SEMUA", label: "Semua" },
  { key: "PENGIRIMAN", label: "Pengiriman (HPP)" },
  { key: "FAKTUR", label: "Faktur" },
  { key: "PENERIMAAN", label: "Penerimaan" },
  { key: "RETUR", label: "Retur" },
  { key: "PEMBALIKAN", label: "Pembalik" },
];

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatTanggal(dateStr: string): string {
  if (!dateStr) return "-";
  const d = new Date(`${dateStr.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

export async function JurnalListScreen({
  profile,
  sumberTipe = "SEMUA",
  cari = "",
}: JurnalListScreenProps) {
  const canView =
    cekIzin(profile.peran, "lihat_piutang") ||
    cekIzin(profile.peran, "lihat_laporan_kas") ||
    cekIzin(profile.peran, "terbitkan_faktur");

  if (!canView) {
    return (
      <section aria-label="Jurnal penjualan" className={styles.page}>
        <section className={styles.panelCard} aria-labelledby="akses-ditolak">
          <h1 className={styles.title} id="akses-ditolak">
            Akses Ditolak
          </h1>
          <p className={styles.emptyState}>
            Hanya peran Accounting atau Manajemen yang dapat melihat jurnal
            penjualan dan HPP.
          </p>
        </section>
      </section>
    );
  }

  const rows = await listJurnalPenjualan({ sumberTipe, q: cari });

  return (
    <section aria-label="Daftar jurnal penjualan" className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.breadcrumb}>
            Siklus Pendapatan / Jurnal Penjualan & HPP
          </p>
          <h1 className={styles.title}>Jurnal Penjualan & HPP</h1>
          <p className={styles.description}>
            Jejak jurnal otomatis dari pengiriman (HPP), penerbitan faktur,
            penerimaan pembayaran, retur penjualan, dan jurnal pembalik.
          </p>
        </div>
      </header>

      <div className={styles.panelCard}>
        <div className={styles.toolbar}>
          <nav aria-label="Filter sumber jurnal" className={styles.filterGroup}>
            {FILTER_TABS.map((tab) => {
              const active = sumberTipe === tab.key;
              const href =
                tab.key === "SEMUA"
                  ? "/pendapatan/jurnal"
                  : `/pendapatan/jurnal?sumber=${tab.key}${cari ? `&q=${encodeURIComponent(cari)}` : ""}`;
              return (
                <Link
                  className={`${styles.filterPill} ${active ? styles.filterPillActive : ""}`}
                  href={href}
                  key={tab.key}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>

          <form
            action="/pendapatan/jurnal"
            className={styles.searchForm}
            method="GET"
          >
            {sumberTipe !== "SEMUA" ? (
              <input name="sumber" type="hidden" value={sumberTipe} />
            ) : null}
            <input
              aria-label="Cari jurnal"
              className={styles.searchInput}
              defaultValue={cari}
              name="q"
              placeholder="Cari nomor sumber atau pemicu..."
              type="search"
            />
            <button className={styles.secondaryButton} type="submit">
              Cari
            </button>
          </form>
        </div>

        {rows.length === 0 ? (
          <p className={styles.emptyState}>
            Belum ada jurnal penjualan untuk filter saat ini.
          </p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Sumber</th>
                  <th>Nomor Transaksi Asal</th>
                  <th>Pemicu</th>
                  <th className={styles.alignRight}>Total Debit</th>
                  <th className={styles.alignRight}>Total Kredit</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{formatTanggal(row.tanggal)}</td>
                    <td>{row.sumberTipe}</td>
                    <td>
                      <Link
                        className={styles.docLink}
                        href={`/pendapatan/jurnal/${row.id}`}
                      >
                        {row.sumberNomor}
                      </Link>
                    </td>
                    <td>{row.sumberPemicu}</td>
                    <td className={`${styles.alignRight} ${styles.numeric}`}>
                      {formatRupiah(row.totalDebit)}
                    </td>
                    <td className={`${styles.alignRight} ${styles.numeric}`}>
                      {formatRupiah(row.totalKredit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
