import Link from "next/link";

import { cekIzin } from "@/lib/auth/permissions";
import type { Profile } from "@/lib/auth/types";
import { ReturForm } from "./components/retur-form";
import { PATH_RETUR } from "./constants";
import { listFakturUntukRetur } from "./queries";
import styles from "./retur.module.css";

type ReturBaruScreenProps = {
  profile: Profile;
};

export async function ReturBaruScreen({ profile }: ReturBaruScreenProps) {
  const canCreate =
    cekIzin(profile.peran, "buat_pesanan") ||
    cekIzin(profile.peran, "buat_pengiriman");

  if (!canCreate) {
    return (
      <section aria-label="Ajukan retur penjualan" className={styles.page}>
        <section className={styles.panelCard} aria-labelledby="akses-ditolak">
          <h1 className={styles.title} id="akses-ditolak">
            Akses Ditolak
          </h1>
          <p className={styles.emptyState}>
            Hanya peran Penjualan atau Gudang yang dapat mengajukan retur
            penjualan.
          </p>
        </section>
      </section>
    );
  }

  const fakturList = await listFakturUntukRetur();

  return (
    <section aria-label="Ajukan retur penjualan" className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.breadcrumb}>
            Siklus Pendapatan / Retur Penjualan / Pengajuan Baru
          </p>
          <h1 className={styles.title}>Ajukan Retur Penjualan</h1>
          <p className={styles.description}>
            Pilih faktur penjualan yang sudah diterbitkan dan masukkan jumlah
            barang yang dikembalikan pelanggan.
          </p>
        </div>

        <div className={styles.headerActions}>
          <Link className={styles.secondaryButton} href={PATH_RETUR}>
            Kembali ke Daftar
          </Link>
        </div>
      </header>

      <ReturForm fakturList={fakturList} />
    </section>
  );
}
