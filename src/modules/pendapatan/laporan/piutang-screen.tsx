import Link from "next/link";

import { cekIzin } from "@/lib/auth/permissions";
import type { Profile } from "@/lib/auth/types";
import { validasiTanggalLaporan } from "./calc";
import { LaporanNav } from "./components/laporan-nav";
import styles from "./laporan.module.css";
import { getLaporanPiutang } from "./queries";

type PiutangLaporanScreenProps = {
  profile: Profile;
  tanggal?: string;
};

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export async function PiutangLaporanScreen({
  profile,
  tanggal,
}: PiutangLaporanScreenProps) {
  const canViewPiutang = cekIzin(profile.peran, "lihat_piutang");
  const canViewKas = cekIzin(profile.peran, "lihat_laporan_kas");

  if (!canViewPiutang) {
    return (
      <section aria-label="Laporan piutang" className={styles.page}>
        <section className={styles.panelCard} aria-labelledby="akses-ditolak">
          <h1 className={styles.title} id="akses-ditolak">
            Akses Ditolak
          </h1>
          <p className={styles.emptyState}>
            Anda tidak berwenang melihat laporan ini.
          </p>
        </section>
      </section>
    );
  }

  const todayIso = new Date().toISOString().slice(0, 10);
  const selectedTanggal = tanggal ?? todayIso;
  const validationError = validasiTanggalLaporan(selectedTanggal, todayIso);

  const data = validationError
    ? null
    : await getLaporanPiutang(selectedTanggal);

  return (
    <section aria-label="Laporan piutang dan aging" className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.breadcrumb}>
            Siklus Pendapatan / Laporan / Piutang & Aging
          </p>
          <h1 className={styles.title}>Laporan Piutang & Aging</h1>
          <p className={styles.description}>
            Posisi sisa piutang tiap faktur per tanggal laporan dengan
            pengelompokan umur jatuh tempo.
          </p>
        </div>

        <LaporanNav
          active="piutang"
          canViewKas={canViewKas}
          canViewPiutang={canViewPiutang}
        />
      </header>

      <div className={styles.panelCard}>
        <form
          action="/pendapatan/laporan/piutang"
          className={styles.filterForm}
          method="GET"
        >
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="tanggal-piutang">
              Tanggal Laporan
            </label>
            <input
              className={styles.input}
              defaultValue={selectedTanggal}
              id="tanggal-piutang"
              max={todayIso}
              name="tanggal"
              type="date"
            />
          </div>
          <button className={styles.primaryButton} type="submit">
            Tampilkan
          </button>
        </form>
      </div>

      {validationError ? (
        <div className={`${styles.alertBox} ${styles.alertError}`} role="alert">
          {validationError}
        </div>
      ) : data && data.rows.length === 0 ? (
        <div className={styles.panelCard}>
          <p className={styles.emptyState}>
            Tidak ada transaksi pada periode ini.
          </p>
        </div>
      ) : data ? (
        <>
          <div className={styles.panelCard}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>
                  Ringkasan Bucket Umur Piutang
                </h2>
                <p className={styles.panelSubtitle}>
                  Total Piutang Terbuka: {formatRupiah(data.totalPiutang)}
                </p>
              </div>
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Bucket Umur</th>
                    <th className={styles.alignRight}>Jumlah Faktur</th>
                    <th className={styles.alignRight}>Total Sisa Piutang</th>
                  </tr>
                </thead>
                <tbody>
                  {data.buckets.map((b) => (
                    <tr key={b.key}>
                      <td>{b.label}</td>
                      <td className={`${styles.alignRight} ${styles.numeric}`}>
                        {b.jumlahFaktur}
                      </td>
                      <td className={`${styles.alignRight} ${styles.numeric}`}>
                        {formatRupiah(b.totalSisa)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className={styles.panelCard}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>
                  Rincian Faktur Piutang Terbuka
                </h2>
              </div>
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Nomor Faktur</th>
                    <th>Pelanggan</th>
                    <th>Tgl Faktur</th>
                    <th>Jatuh Tempo</th>
                    <th className={styles.alignRight}>Umur (Hari)</th>
                    <th>Bucket</th>
                    <th className={styles.alignRight}>Sisa Piutang</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <Link
                          className={styles.docLink}
                          href={`/pendapatan/faktur/${encodeURIComponent(row.nomor)}`}
                        >
                          {row.nomor}
                        </Link>
                      </td>
                      <td>
                        <div>{row.pelangganNama}</div>
                        <div className={styles.fieldHint}>
                          {row.pelangganKode}
                        </div>
                      </td>
                      <td>{row.tanggalFaktur}</td>
                      <td>{row.jatuhTempo}</td>
                      <td className={`${styles.alignRight} ${styles.numeric}`}>
                        {row.umurHari > 0 ? `+${row.umurHari}` : row.umurHari}
                      </td>
                      <td>{row.bucketLabel}</td>
                      <td
                        className={`${styles.alignRight} ${styles.numeric}`}
                        style={{ fontWeight: 600 }}
                      >
                        {formatRupiah(row.sisaPiutang)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
