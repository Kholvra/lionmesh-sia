import Link from "next/link";

import { cekIzin } from "@/lib/auth/permissions";
import type { Profile } from "@/lib/auth/types";
import { PembayaranTable } from "./components/pembayaran-table";
import { PATH_PEMBAYARAN_BARU } from "./constants";
import styles from "./pembayaran.module.css";
import { listPembayaran } from "./queries";

type PembayaranListScreenProps = {
  profile: Profile;
  cari?: string;
  status?: string;
};

export async function PembayaranListScreen({
  profile,
  cari,
  status,
}: PembayaranListScreenProps) {
  const canCatat = cekIzin(profile.peran, "catat_pembayaran_piutang");
  const canVerifikasi = cekIzin(profile.peran, "verifikasi_pembayaran_piutang");
  const canViewPiutang = cekIzin(profile.peran, "lihat_piutang");

  if (!canCatat && !canVerifikasi && !canViewPiutang) {
    return (
      <section aria-label="Penerimaan pembayaran" className={styles.page}>
        <section className={styles.panelCard} aria-labelledby="akses-ditolak">
          <h1 className={styles.title} id="akses-ditolak">
            Akses Ditolak
          </h1>
          <p className={styles.emptyState}>
            Hanya peran Finance, Accounting, atau Manajemen yang dapat mengakses
            penerimaan pembayaran.
          </p>
        </section>
      </section>
    );
  }

  const items = await listPembayaran(cari, status);

  return (
    <section aria-label="Daftar penerimaan pembayaran" className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.breadcrumb}>
            Siklus Pendapatan / Penerimaan Pembayaran
          </p>
          <h1 className={styles.title}>Penerimaan Pembayaran Pelanggan</h1>
          <p className={styles.description}>
            Catat pembayaran masuk (Transfer / Giro) oleh Finance dan lakukan
            verifikasi alokasi FIFO ke faktur tertua oleh Accounting.
          </p>
        </div>

        <div className={styles.headerActions}>
          <Link className={styles.secondaryButton} href="/pendapatan/faktur">
            Faktur Penjualan
          </Link>
          {canCatat ? (
            <Link className={styles.primaryButton} href={PATH_PEMBAYARAN_BARU}>
              + Catat Pembayaran
            </Link>
          ) : null}
        </div>
      </header>

      <PembayaranTable items={items} />
    </section>
  );
}
