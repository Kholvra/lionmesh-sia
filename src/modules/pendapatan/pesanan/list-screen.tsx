import Link from "next/link";

import { cekIzin } from "@/lib/auth/permissions";
import type { Profile } from "@/lib/auth/types";
import { PesananTable } from "./components/pesanan-table";
import { PATH_PESANAN_BARU } from "./constants";
import styles from "./pesanan.module.css";
import { listPesanan } from "./queries";

type PesananListScreenProps = {
  profile: Profile;
  cari?: string;
  status?: string;
};

export async function PesananListScreen({
  profile,
  cari,
  status,
}: PesananListScreenProps) {
  const canCreate = cekIzin(profile.peran, "buat_pesanan");
  const bolehBaca = Boolean(profile.peran);

  if (!bolehBaca) {
    return (
      <section aria-label="Pesanan penjualan" className={styles.page}>
        <section className={styles.panelCard} aria-labelledby="akses-ditolak">
          <h1 className={styles.title} id="akses-ditolak">
            Akses Ditolak
          </h1>
          <p className={styles.emptyState}>
            Peran Anda tidak memiliki akses ke daftar pesanan penjualan.
          </p>
        </section>
      </section>
    );
  }

  const items = await listPesanan(cari, status);

  return (
    <section aria-label="Daftar pesanan penjualan" className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.breadcrumb}>Siklus Pendapatan / Pesanan Penjualan</p>
          <h1 className={styles.title}>Pesanan Penjualan</h1>
          <p className={styles.description}>
            Catat, verifikasi, dan pantau pesanan pelanggan beserta pengecekan
            exposure terhadap batas kredit.
          </p>
        </div>

        <div className={styles.headerActions}>
          <Link className={styles.secondaryButton} href="/pendapatan/pelanggan">
            Data Pelanggan
          </Link>
          <Link className={styles.secondaryButton} href="/pendapatan/ketersediaan">
            Ketersediaan Stok
          </Link>
          {canCreate ? (
            <Link className={styles.primaryButton} href={PATH_PESANAN_BARU}>
              + Buat Pesanan
            </Link>
          ) : null}
        </div>
      </header>

      <PesananTable items={items} />
    </section>
  );
}
