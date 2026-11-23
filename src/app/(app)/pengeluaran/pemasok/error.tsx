"use client";

import styles from "@/modules/pengeluaran/pemasok/pemasok.module.css";

type PemasokErrorProps = {
  reset: () => void;
};

export default function PemasokError({ reset }: PemasokErrorProps) {
  return (
    <main className={styles.errorPage}>
      <section className={styles.errorCard} role="alert">
        <h1 className={styles.errorTitle}>Data pemasok gagal dimuat</h1>
        <p className={styles.errorText}>
          Terjadi kesalahan saat memuat master pemasok. Coba muat ulang halaman
          ini.
        </p>
        <div className={styles.errorActions}>
          <button className={styles.primaryButton} onClick={reset} type="button">
            Coba lagi
          </button>
        </div>
      </section>
    </main>
  );
}
