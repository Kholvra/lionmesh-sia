import Link from "next/link";

import { cekIzin } from "@/lib/auth/permissions";
import type { Profile } from "@/lib/auth/types";
import { validasiPeriodeBulan } from "./calc";
import { LaporanNav } from "./components/laporan-nav";
import styles from "./laporan.module.css";
import { getLaporanPenjualan } from "./queries";

type PenjualanScreenProps = {
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

function formatAngka(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 4,
  }).format(value);
}

export async function PenjualanScreen({
  profile,
  periode,
}: PenjualanScreenProps) {
  const canViewPenjualan = cekIzin(profile.peran, "lihat_laporan_penjualan");
  const canViewPiutang = cekIzin(profile.peran, "lihat_piutang");
  const canViewKas = cekIzin(profile.peran, "lihat_laporan_kas");

  if (!canViewPenjualan) {
    return (
      <section aria-label="Laporan penjualan" className={styles.page}>
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

  const data = validationError
    ? null
    : await getLaporanPenjualan(selectedPeriode);

  return (
    <section aria-label="Laporan penjualan" className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.breadcrumb}>
            Siklus Pendapatan / Laporan / Penjualan
          </p>
          <h1 className={styles.title}>Laporan Penjualan</h1>
          <p className={styles.description}>
            Total penjualan neto retur per bulan beserta rincian per pelanggan
            dan per produk, rekonsiliasi dengan buku besar akun penjualan.
          </p>
        </div>

        <LaporanNav
          active="penjualan"
          canViewKas={canViewKas}
          canViewPiutang={canViewPiutang}
        />
      </header>

      <div className={styles.panelCard}>
        <form
          action="/pendapatan/laporan/penjualan"
          className={styles.filterForm}
          method="GET"
        >
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="periode-penjualan">
              Periode (Bulan)
            </label>
            <input
              className={styles.input}
              defaultValue={selectedPeriode}
              id="periode-penjualan"
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
      ) : data && data.dokumen.length === 0 ? (
        <div className={styles.panelCard}>
          <p className={styles.emptyState}>
            Tidak ada transaksi pada periode ini.
          </p>
        </div>
      ) : data ? (
        <>
          <div className={styles.summaryStrip}>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Total DPP Faktur</p>
              <p className={`${styles.statValue} ${styles.numeric}`}>
                {formatRupiah(data.totalDppFaktur)}
              </p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Pengurang Retur (DPP)</p>
              <p className={`${styles.statValue} ${styles.numeric}`}>
                {formatRupiah(data.totalDppRetur)}
              </p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Penjualan Neto</p>
              <p className={`${styles.statValue} ${styles.numeric}`}>
                {formatRupiah(data.totalPenjualanNeto)}
              </p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Buku Besar (Akun Penjualan)</p>
              <p className={`${styles.statValue} ${styles.numeric}`}>
                {formatRupiah(data.totalPenjualanBukuBesar)}
              </p>
            </div>
          </div>

          <div className={styles.panelCard}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>Rincian per Pelanggan</h2>
                <p className={styles.panelSubtitle}>
                  Neto retur berdasarkan faktur dan kredit memo periode{" "}
                  {data.periode}
                </p>
              </div>
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Pelanggan</th>
                    <th className={styles.alignRight}>DPP Faktur</th>
                    <th className={styles.alignRight}>DPP Retur</th>
                    <th className={styles.alignRight}>Penjualan Neto</th>
                  </tr>
                </thead>
                <tbody>
                  {data.perPelanggan.map((row) => (
                    <tr key={row.pelangganId}>
                      <td>
                        <div style={{ fontWeight: 500 }}>
                          {row.pelangganNama}
                        </div>
                        <div className={styles.fieldHint}>
                          {row.pelangganKode}
                        </div>
                      </td>
                      <td className={`${styles.alignRight} ${styles.numeric}`}>
                        {formatRupiah(row.dppFaktur)}
                      </td>
                      <td className={`${styles.alignRight} ${styles.numeric}`}>
                        {formatRupiah(row.dppRetur)}
                      </td>
                      <td
                        className={`${styles.alignRight} ${styles.numeric}`}
                        style={{ fontWeight: 600 }}
                      >
                        {formatRupiah(row.penjualanNeto)}
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
                <h2 className={styles.panelTitle}>Rincian per Produk</h2>
              </div>
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Produk</th>
                    <th className={styles.alignRight}>Qty Terjual</th>
                    <th className={styles.alignRight}>DPP Penjualan</th>
                  </tr>
                </thead>
                <tbody>
                  {data.perProduk.map((row) => (
                    <tr key={row.produkId}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{row.produkNama}</div>
                        <div className={styles.fieldHint}>{row.produkKode}</div>
                      </td>
                      <td className={`${styles.alignRight} ${styles.numeric}`}>
                        {formatAngka(row.qtyTerjual)}
                      </td>
                      <td className={`${styles.alignRight} ${styles.numeric}`}>
                        {formatRupiah(row.dppPenjualan)}
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
                <h2 className={styles.panelTitle}>Daftar Dokumen Periode</h2>
                <p className={styles.panelSubtitle}>
                  Dokumen batal tetap tercatat dengan nilai 0.
                </p>
              </div>
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Jenis</th>
                    <th>Nomor</th>
                    <th>Tanggal</th>
                    <th>Pelanggan</th>
                    <th>Status</th>
                    <th className={styles.alignRight}>DPP</th>
                  </tr>
                </thead>
                <tbody>
                  {data.dokumen.map((d) => (
                    <tr key={`${d.jenis}-${d.id}`}>
                      <td>{d.jenis}</td>
                      <td>
                        <Link
                          className={styles.docLink}
                          href={
                            d.jenis === "FAKTUR"
                              ? `/pendapatan/faktur/${encodeURIComponent(d.nomor)}`
                              : `/pendapatan/retur/${encodeURIComponent(d.nomor)}`
                          }
                        >
                          {d.nomor}
                        </Link>
                      </td>
                      <td>{d.tanggal}</td>
                      <td>{d.pelangganNama}</td>
                      <td>{d.status}</td>
                      <td className={`${styles.alignRight} ${styles.numeric}`}>
                        {formatRupiah(d.dpp)}
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
