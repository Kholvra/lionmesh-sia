import Link from "next/link";

import { cekIzin } from "@/lib/auth/permissions";
import type { Profile } from "@/lib/auth/types";
import { FakturTable } from "./components/faktur-table";
import { PATH_FAKTUR_BARU, PATH_PIUTANG } from "./constants";
import styles from "./faktur.module.css";
import { listFaktur } from "./queries";

type FakturListScreenProps = {
  profile: Profile;
  cari?: string;
  status?: string;
};

export async function FakturListScreen({
  profile,
  cari,
  status,
}: FakturListScreenProps) {
  const canIssue = cekIzin(profile.peran, "terbitkan_faktur");
  const canViewPiutang = cekIzin(profile.peran, "lihat_piutang");

  if (!canIssue && !canViewPiutang) {
    return (
      <section aria-label="Faktur penjualan" className={styles.page}>
        <section className={styles.panelCard} aria-labelledby="akses-ditolak">
          <h1 className={styles.title} id="akses-ditolak">
            Akses Ditolak
          </h1>
          <p className={styles.emptyState}>
            Hanya peran Accounting atau Manajemen yang dapat melihat daftar faktur
            dan piutang penjualan.
          </p>
        </section>
      </section>
    );
  }

  const items = await listFaktur(cari, status);

  return (
    <section aria-label="Daftar faktur penjualan" className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.breadcrumb}>
            Siklus Pendapatan / Faktur Penjualan & Piutang
          </p>
          <h1 className={styles.title}>Faktur Penjualan</h1>
          <p className={styles.description}>
            Terbitkan faktur penjualan dari pengiriman yang telah diberangkatkan,
            catat nomor faktur pajak, dan posting piutang usaha ke buku besar.
          </p>
        </div>

        <div className={styles.headerActions}>
          {canViewPiutang ? (
            <Link className={styles.secondaryButton} href={PATH_PIUTANG}>
              Daftar Piutang & Aging
            </Link>
          ) : null}
          {canIssue ? (
            <Link className={styles.primaryButton} href={PATH_FAKTUR_BARU}>
              + Buat Faktur
            </Link>
          ) : null}
        </div>
      </header>

      <FakturTable items={items} />
    </section>
  );
}
