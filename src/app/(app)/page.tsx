import { Suspense } from "react";

import { MetricCard } from "@/components/ui/metric-card";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
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
      <PageHeader
        actions={
          <p className={styles.period}>
            Periode{" "}
            <Suspense fallback={<span>…</span>}>
              <PeriodeSekarang />
            </Suspense>
          </p>
        }
        breadcrumb={["Dashboard"]}
        description="Ringkasan lintas siklus dan dokumen yang menunggu tindakan Anda."
        title="Dashboard umum"
      />

      {data.error ? (
        <Notice
          className={styles.alert}
          title="Sebagian ringkasan tidak tersedia"
          tone="danger"
        >
          <p className={styles.alertText}>{data.error}</p>
          <RefreshButton label="Coba lagi" />
        </Notice>
      ) : null}

      <section aria-label="Ringkasan siklus" className={styles.section}>
        <PageHeader
          description="Hanya dokumen yang boleh Anda lihat dan tindaklanjuti yang dihitung."
          title="Ringkasan siklus"
          variant="section"
        />

        <div className={styles.cards}>
          {data.ringkasan.kartu.map((kartu) => (
            <MetricCard
              footnote={KETERANGAN_SIKLUS[kartu.siklus]}
              hint="dokumen menunggu tindakan"
              key={kartu.siklus}
              label={`Siklus ${kartu.siklus}`}
              status={kartu.status}
              value={kartu.jumlah}
              variant="dashboard"
            />
          ))}
        </div>
      </section>

      <section aria-label="Menunggu tindakan saya" className={styles.section}>
        <PageHeader
          description="Diurutkan dari dokumen yang paling lama menunggu."
          title="Menunggu tindakan saya"
          variant="section"
        />

        {data.ringkasan.tanpaSiklus > 0 ? (
          <Notice className={styles.notice} tone="warning">
            {data.ringkasan.tanpaSiklus} dokumen menunggu belum dapat dipetakan
            ke siklus. Hubungi administrator sistem.
          </Notice>
        ) : null}

        <AntreanTable
          errorMessage={data.error ?? undefined}
          rows={data.ringkasan.antrean}
        />
      </section>

      <section aria-label="Keterkaitan antar siklus" className={styles.section}>
        <PageHeader
          description="Alur kerja yang menyambungkan keempat siklus."
          title="Keterkaitan antar siklus"
          variant="section"
        />

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
