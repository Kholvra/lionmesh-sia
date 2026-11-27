import type { ReactNode } from "react";

import type { Profile } from "@/lib/auth/types";
import { cariLaporan, type LaporanSlug } from "../daftar-laporan";
import styles from "../laporan.module.css";

interface LaporanShellProps {
  slug: LaporanSlug;
  profil: Profile;
  periode?: string;
  children: ReactNode;
}

export function LaporanShell({
  slug,
  profil,
  children,
}: LaporanShellProps) {
  const aktif = cariLaporan(slug);

  return (
    <section aria-labelledby="laporan-title" className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title} id="laporan-title">
            {aktif.judul}
          </h1>
          <p className={styles.description}>{aktif.deskripsi}</p>
          <p className={styles.actor}>
            Aktor: {profil.peran ?? "—"} · Sumber angka: jurnal yang sudah
            diposting
          </p>
        </div>
      </header>


      {children}
    </section>
  );
}

export function AksesDitolak() {
  return (
    <section aria-labelledby="akses-ditolak" className={styles.page}>
      <div className={styles.denial}>
        <h1 className={styles.denialTitle} id="akses-ditolak">
          Akses ditolak
        </h1>
        <p className={styles.denialText}>
          Peran Anda tidak berwenang melihat laporan keuangan. Laporan ini hanya
          untuk Accounting, Manajemen, dan Direksi. Hubungi administrator bila
          akses dibutuhkan.
        </p>
      </div>
    </section>
  );
}

