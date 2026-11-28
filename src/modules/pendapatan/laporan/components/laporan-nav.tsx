import Link from "next/link";

import styles from "../laporan.module.css";

type LaporanNavProps = {
  active: "penjualan" | "piutang" | "kas";
  canViewPiutang: boolean;
  canViewKas: boolean;
};

export function LaporanNav({
  active,
  canViewPiutang,
  canViewKas,
}: LaporanNavProps) {
  return (
    <nav aria-label="Pilih laporan pendapatan" className={styles.navTabs}>
      <Link
        className={`${styles.navTab} ${active === "penjualan" ? styles.navTabActive : ""}`}
        href="/pendapatan/laporan/penjualan"
      >
        Laporan Penjualan
      </Link>
      {canViewPiutang ? (
        <Link
          className={`${styles.navTab} ${active === "piutang" ? styles.navTabActive : ""}`}
          href="/pendapatan/laporan/piutang"
        >
          Laporan Piutang & Aging
        </Link>
      ) : null}
      {canViewKas ? (
        <Link
          className={`${styles.navTab} ${active === "kas" ? styles.navTabActive : ""}`}
          href="/pendapatan/laporan/kas"
        >
          Laporan Penerimaan Kas
        </Link>
      ) : null}
    </nav>
  );
}
