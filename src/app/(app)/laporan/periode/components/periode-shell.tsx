import type { ReactNode } from "react";

import type { Profile } from "@/lib/auth/types";

import laporanStyles from "../../laporan.module.css";

interface PeriodeShellProps {
  judul: string;
  deskripsi: string;
  profil: Profile;
  children: ReactNode;
}

export function PeriodeShell({
  judul,
  deskripsi,
  profil,
  children,
}: PeriodeShellProps) {
  return (
    <section aria-labelledby="periode-title" className={laporanStyles.page}>
      <header className={laporanStyles.header}>
        <div>
          <h1 className={laporanStyles.title} id="periode-title">
            {judul}
          </h1>
          <p className={laporanStyles.description}>{deskripsi}</p>
          <p className={laporanStyles.actor}>
            Aktor: {profil.peran ?? "—"} · Hanya Accounting yang dapat menutup
            periode
          </p>
        </div>
      </header>

      {children}
    </section>
  );
}

export function AksesDitolak() {
  return (
    <section aria-labelledby="akses-ditolak" className={laporanStyles.page}>
      <div className={laporanStyles.denial}>
        <h1 className={laporanStyles.denialTitle} id="akses-ditolak">
          Akses ditolak
        </h1>
        <p className={laporanStyles.denialText}>
          Periode akuntansi hanya dapat ditutup oleh Accounting. Hubungi
          administrator bila akses dibutuhkan.
        </p>
      </div>
    </section>
  );
}
