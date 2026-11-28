import { cekIzin } from "@/lib/auth/permissions";
import type { Profile } from "@/lib/auth/types";
import { PembayaranForm } from "./components/pembayaran-form";
import styles from "./pembayaran.module.css";
import { listPelangganDenganTagihan } from "./queries";

type PembayaranBaruScreenProps = {
  profile: Profile;
};

export async function PembayaranBaruScreen({
  profile,
}: PembayaranBaruScreenProps) {
  const canCatat = cekIzin(profile.peran, "catat_pembayaran_piutang");

  if (!canCatat) {
    return (
      <section aria-label="Catat pembayaran" className={styles.page}>
        <section className={styles.panelCard} aria-labelledby="akses-ditolak">
          <h1 className={styles.title} id="akses-ditolak">
            Akses Ditolak
          </h1>
          <p className={styles.emptyState}>
            Hanya peran Finance yang berwenang mencatat penerimaan pembayaran.
          </p>
        </section>
      </section>
    );
  }

  const pelangganList = await listPelangganDenganTagihan();

  return (
    <section aria-label="Catat pembayaran baru" className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.breadcrumb}>
            Siklus Pendapatan / Penerimaan Pembayaran / Baru
          </p>
          <h1 className={styles.title}>Catat Penerimaan Pembayaran</h1>
          <p className={styles.description}>
            Pilih pelanggan dan masukkan nominal penerimaan. Verifikasi dan
            alokasi ke faktur tertua dijalankan oleh Accounting.
          </p>
        </div>
      </header>

      <PembayaranForm pelangganList={pelangganList} />
    </section>
  );
}
