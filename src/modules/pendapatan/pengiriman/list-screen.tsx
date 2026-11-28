import Link from "next/link";

import { cekIzin } from "@/lib/auth/permissions";
import type { Profile } from "@/lib/auth/types";
import { PengirimanTable } from "./components/pengiriman-table";
import { PATH_PENGIRIMAN_BARU } from "./constants";
import styles from "./pengiriman.module.css";
import { listPengiriman } from "./queries";

type PengirimanListScreenProps = {
  profile: Profile;
  cari?: string;
  status?: string;
};

export async function PengirimanListScreen({
  profile,
  cari,
  status,
}: PengirimanListScreenProps) {
  const canCreate = cekIzin(profile.peran, "buat_pengiriman");

  if (!profile.peran) {
    return (
      <section aria-label="Pengiriman" className={styles.page}>
        <section className={styles.panelCard} aria-labelledby="akses-ditolak">
          <h1 className={styles.title} id="akses-ditolak">
            Akses Ditolak
          </h1>
          <p className={styles.emptyState}>
            Peran Anda tidak memiliki akses ke daftar pengiriman.
          </p>
        </section>
      </section>
    );
  }

  const items = await listPengiriman(cari, status);

  return (
    <section aria-label="Daftar pengiriman dan surat jalan" className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.breadcrumb}>
            Siklus Pendapatan / Pengiriman & Surat Jalan
          </p>
          <h1 className={styles.title}>Pengiriman & Surat Jalan</h1>
          <p className={styles.description}>
            Terbitkan surat jalan dari pesanan yang telah dialokasikan, konfirmasi
            pengeluaran stok fisik, dan catat bukti terima pelanggan.
          </p>
        </div>

        <div className={styles.headerActions}>
          <Link className={styles.secondaryButton} href="/pendapatan/pesanan">
            Pesanan Penjualan
          </Link>
          {canCreate ? (
            <Link className={styles.primaryButton} href={PATH_PENGIRIMAN_BARU}>
              + Buat Pengiriman
            </Link>
          ) : null}
        </div>
      </header>

      <PengirimanTable items={items} />
    </section>
  );
}
