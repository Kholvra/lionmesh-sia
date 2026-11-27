import Link from "next/link";

import type { Profile } from "@/lib/auth/types";
import { cekIzin } from "@/lib/auth/permissions";
import { PelangganDetail } from "./components/pelanggan-detail";
import { PelangganForm } from "./components/pelanggan-form";
import { PelangganTable } from "./components/pelanggan-table";
import styles from "./pelanggan.module.css";
import { getPelangganPageData } from "./queries";

type PelangganScreenProps = {
  profile: Profile;
  pelangganId?: string;
  mode?: string;
  cari?: string;
};

export async function PelangganScreen({
  profile,
  pelangganId,
  mode,
  cari,
}: PelangganScreenProps) {
  const canManage = cekIzin(profile.peran, "buat_ubah_pelanggan");
  const canManageCredit = cekIzin(profile.peran, "ubah_batas_kredit");

  // Peran yang boleh membaca master pelanggan: Penjualan, Accounting, Manajemen, Direksi, dsb.
  const bolehBaca = Boolean(profile.peran);

  if (!bolehBaca) {
    return (
      <section aria-label="Master pelanggan" className={styles.page}>
        <section className={styles.panelCard} aria-labelledby="akses-ditolak">
          <h1 className={styles.title} id="akses-ditolak">
            Akses Ditolak
          </h1>
          <p className={styles.emptyState}>
            Peran Anda tidak memiliki akses ke master pelanggan. Hubungi
            administrator bila akses ini dibutuhkan.
          </p>
        </section>
      </section>
    );
  }

  const data = await getPelangganPageData(profile, pelangganId, cari);
  const terpilih = data.terpilih;
  const isModeNew = mode === "new" && canManage;
  const isModeEdit = mode === "edit" && canManage && Boolean(terpilih);

  return (
    <section aria-label="Master Pelanggan" className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.breadcrumb}>Siklus Pendapatan / Pelanggan</p>
          <h1 className={styles.title}>Pelanggan</h1>
          <p className={styles.description}>
            Kelola master pelanggan, ketentuan termin pembayaran, dan pagu
            batas kredit. Perubahan master hanya berlaku untuk transaksi baru.
          </p>
        </div>

        <div className={styles.headerActions}>
          <Link className={styles.secondaryButton} href="/pendapatan/pesanan">
            Pesanan Penjualan →
          </Link>
        </div>
      </header>

      <div className={styles.layout}>
        <section className={styles.listPanel} aria-labelledby="daftar-pelanggan-title">
          <PelangganTable
            canManage={canManage}
            items={data.items}
            terpilihId={terpilih?.id}
          />
        </section>

        <section className={styles.panel} aria-labelledby="detail-pelanggan-title">
          {isModeNew ? (
            <PelangganForm
              canManageCredit={canManageCredit}
              mode="new"
            />
          ) : isModeEdit && terpilih ? (
            <PelangganForm
              canManageCredit={canManageCredit}
              mode="edit"
              pelanggan={terpilih}
            />
          ) : terpilih ? (
            <PelangganDetail
              canManage={canManage}
              canManageCredit={canManageCredit}
              canReadKontak={data.canReadKontak}
              pelanggan={terpilih}
            />
          ) : (
            <div className={styles.panelCard}>
              <h2 className={styles.panelTitle} id="detail-pelanggan-title">
                Detail Pelanggan
              </h2>
              <p className={styles.emptyState}>
                Pilih salah satu pelanggan dari daftar di sebelah kiri untuk melihat
                rincian ketentuan penjualan, atau klik &quot;+ Pelanggan&quot; untuk
                mendaftarkan pelanggan baru.
              </p>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
