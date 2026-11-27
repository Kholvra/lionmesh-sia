import Link from "next/link";
import type { ReactNode } from "react";

import { ArrowIcon } from "@/components/ui/arrow-icon";
import type { Profile } from "@/lib/auth/types";

import laporanStyles from "../../laporan.module.css";
import styles from "../periode.module.css";

interface PeriodeShellProps {
  judul: string;
  deskripsi: string;
  profil: Profile;
  breadcrumb?: string;
  kembali?: { href: string; label: string };
  children: ReactNode;
}

export function PeriodeShell({
  judul,
  deskripsi,
  profil,
  breadcrumb = "Periode akuntansi",
  kembali,
  children,
}: PeriodeShellProps) {
  return (
    <section aria-labelledby="periode-title" className={laporanStyles.page}>
      <header className={laporanStyles.header}>
        <div>
          {kembali ? (
            <Link className={styles.backLink} href={kembali.href}>
              <ArrowIcon className={styles.backIcon} direction="left" />
              {kembali.label}
            </Link>
          ) : null}
          <p className={laporanStyles.breadcrumb}>{breadcrumb}</p>
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
