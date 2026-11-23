import { Suspense } from "react";

import { getDataDashboard, type SiklusDashboard } from "@/core/dashboard";
import { requireSesi } from "@/lib/auth/server";

import { AntreanTable } from "./dashboard/antrean-table";
import styles from "./dashboard/dashboard.module.css";
import { PeriodeSekarang } from "./dashboard/periode-sekarang";
import { RefreshButton } from "./dashboard/refresh-button";

export const instant = false;

const KETERANGAN_SIKLUS: Record<SiklusDashboard, string> = {
  Pendapatan: "Pesanan, pengiriman, faktur, dan piutang.",
  Pengeluaran: "Permintaan, purchase order, penerimaan, dan utang.",
  Produksi: "Perintah produksi, bahan, hasil, dan kualitas.",
  Penggajian: "Presensi, payroll, dan pembayaran gaji.",
};

const LANGKAH_KETERKAITAN = [
  {
    nomor: "1",
    judul: "Pendapatan",
    isi: "Pesanan pelanggan menjadi pengiriman dan faktur; piutang menunggu pembayaran.",
  },
  {
    nomor: "2",
    judul: "Produksi",
    isi: "Perintah produksi memakai bahan; hasil produksi menambah stok barang jadi.",
  },
  {
    nomor: "3",
    judul: "Pengeluaran",
    isi: "Pembelian bahan dan jasa menutup kebutuhan produksi serta biaya operasional.",
  },
] as const;

export default async function DashboardPage() {
  const { profile } = await requireSesi();
  const data = await getDataDashboard({
    id: profile.id,
    peran: profile.peran,
  });

  return (
    <section aria-label="Dashboard umum" className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.breadcrumb}>Dashboard</p>
          <h1 className={styles.title}>Dashboard umum</h1>
          <p className={styles.description}>
            Ringkasan lintas siklus dan dokumen yang menunggu tindakan Anda.
          </p>
        </div>
        <p className={styles.period}>
          Periode{" "}
          <Suspense fallback={<span>…</span>}>
            <PeriodeSekarang />
          </Suspense>
        </p>
      </header>

      {data.error ? (
        <div className={styles.alert} role="alert">
          <div>
            <p className={styles.alertTitle}>Sebagian ringkasan tidak tersedia</p>
            <p className={styles.alertText}>{data.error}</p>
          </div>
          <RefreshButton label="Coba lagi" />
        </div>
      ) : null}

      <section aria-labelledby="ringkasan-siklus" className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle} id="ringkasan-siklus">
            Ringkasan siklus
          </h2>
          <p className={styles.sectionText}>
            Hanya dokumen yang boleh Anda lihat dan tindaklanjuti yang dihitung.
          </p>
        </header>

        <div className={styles.cards}>
          {data.ringkasan.kartu.map((kartu) => (
            <article
              className={styles.card}
              data-status={kartu.status}
              key={kartu.siklus}
            >
              <h3 className={styles.cardLabel}>Siklus {kartu.siklus}</h3>
              {kartu.status === "tersedia" ? (
                <>
                  <p className={styles.cardValue}>{kartu.jumlah}</p>
                  <p className={styles.cardContext}>
                    dokumen menunggu tindakan
                  </p>
                </>
              ) : (
                <>
                  <p className={styles.cardState}>
                    {kartu.status === "gagal"
                      ? "Gagal dimuat"
                      : "Belum tersedia"}
                  </p>
                  <p className={styles.cardContext}>
                    {kartu.status === "gagal"
                      ? "Sumber siklus ini tidak dapat dibaca."
                      : "Sumber siklus ini belum diimplementasikan."}
                  </p>
                </>
              )}
              <p className={styles.cardFootnote}>
                {KETERANGAN_SIKLUS[kartu.siklus]}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="antrean-tindakan" className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle} id="antrean-tindakan">
            Menunggu tindakan saya
          </h2>
          <p className={styles.sectionText}>
            Diurutkan dari dokumen yang paling lama menunggu.
          </p>
        </header>

        {data.ringkasan.tanpaSiklus > 0 ? (
          <p className={styles.notice} role="status">
            {data.ringkasan.tanpaSiklus} dokumen menunggu belum dapat dipetakan
            ke siklus. Hubungi administrator sistem.
          </p>
        ) : null}

        <AntreanTable
          errorMessage={data.error ?? undefined}
          rows={data.ringkasan.antrean}
        />
      </section>

      <section aria-labelledby="keterkaitan-siklus" className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle} id="keterkaitan-siklus">
            Keterkaitan antar siklus
          </h2>
          <p className={styles.sectionText}>
            Alur kerja yang menyambungkan keempat siklus.
          </p>
        </header>

        <ol className={styles.flow}>
          {LANGKAH_KETERKAITAN.map((langkah) => (
            <li className={styles.flowStep} key={langkah.nomor}>
              <span aria-hidden="true" className={styles.flowNumber}>
                {langkah.nomor}
              </span>
              <div>
                <h3 className={styles.flowTitle}>{langkah.judul}</h3>
                <p className={styles.flowText}>{langkah.isi}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className={styles.note}>
          Angka keterkaitan belum ditampilkan karena sumber transaksi siklus
          belum tersedia.
        </p>
      </section>
    </section>
  );
}
