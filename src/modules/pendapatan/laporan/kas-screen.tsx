import Link from "next/link";

import { cekIzin } from "@/lib/auth/permissions";
import type { Profile } from "@/lib/auth/types";
import { validasiPeriodeBulan } from "./calc";
import { LaporanNav } from "./components/laporan-nav";
import styles from "./laporan.module.css";
import { getLaporanKas } from "./queries";

type KasScreenProps = {
  profile: Profile;
  periode?: string;
};

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export async function KasScreen({ profile, periode }: KasScreenProps) {
  const canViewPiutang = cekIzin(profile.peran, "lihat_piutang");
  const canViewKas = cekIzin(profile.peran, "lihat_laporan_kas");

  if (!canViewKas) {
    return (
      <section aria-label="Laporan penerimaan kas" className={styles.page}>
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
  const selectedPeriode = periode ?? todayIso.slice(0, 7);
  const validationError = validasiPeriodeBulan(selectedPeriode, todayIso);

  const data = validationError ? null : await getLaporanKas(selectedPeriode);

  return (
    <section aria-label="Laporan penerimaan kas" className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.breadcrumb}>
            Siklus Pendapatan / Laporan / Penerimaan Kas
          </p>
          <h1 className={styles.title}>Laporan Penerimaan Kas</h1>
          <p className={styles.description}>
            Total penerimaan kas/bank per bulan bersumber langsung dari debit
            buku besar akun kas/bank.
          </p>
        </div>

        <LaporanNav
          active="kas"
          canViewKas={canViewKas}
          canViewPiutang={canViewPiutang}
        />
      </header>

      <div className={styles.panelCard}>
        <form
          action="/pendapatan/laporan/kas"
          className={styles.filterForm}
          method="GET"
        >
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="periode-kas">
              Periode (Bulan)
            </label>
            <input
              className={styles.input}
              defaultValue={selectedPeriode}
              id="periode-kas"
              max={todayIso.slice(0, 7)}
              name="periode"
              type="month"
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
          <div className={styles.summaryStrip}>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Periode</p>
              <p className={styles.statValue}>{data.periode}</p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Total Debit Kas / Bank</p>
              <p className={`${styles.statValue} ${styles.numeric}`}>
                {formatRupiah(data.totalPenerimaanKas)}
              </p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Jumlah Transaksi</p>
              <p className={`${styles.statValue} ${styles.numeric}`}>
                {data.rows.length}
              </p>
            </div>
          </div>

          <div className={styles.panelCard}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>
                  Rincian Mutasi Debit Kas / Bank
                </h2>
              </div>
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Sumber</th>
                    <th>Nomor Dokumen</th>
                    <th>Akun</th>
                    <th className={styles.alignRight}>Nominal Debit</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row) => (
                    <tr key={`${row.jurnalId}-${row.sumberNomor}`}>
                      <td>{row.tanggal}</td>
                      <td>{row.sumberTipe}</td>
                      <td>
                        <Link
                          className={styles.docLink}
                          href={`/pendapatan/jurnal/${row.jurnalId}`}
                        >
                          {row.sumberNomor}
                        </Link>
                      </td>
                      <td>
                        {row.akunNomor} — {row.akunNama}
                      </td>
                      <td
                        className={`${styles.alignRight} ${styles.numeric}`}
                        style={{ fontWeight: 600 }}
                      >
                        {formatRupiah(row.nominalDebit)}
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
