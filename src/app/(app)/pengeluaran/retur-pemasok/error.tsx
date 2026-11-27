"use client";

import styles from "@/modules/pengeluaran/permintaan/permintaan.module.css";

type Props = { reset: () => void };

export default function ReturPemasokError({ reset }: Props) {
  return (
    <main className={styles.errorPage}>
      <section className={styles.errorCard} role="alert">
        <h1 className={styles.loadingTitle}>Retur pemasok gagal dimuat</h1>
        <p className={styles.loadingText}>
          Terjadi kesalahan saat memuat retur pemasok. Coba muat ulang.
        </p>
        <button className={styles.primaryButton} onClick={reset} type="button">
          Coba lagi
        </button>
      </section>
    </main>
  );
}
