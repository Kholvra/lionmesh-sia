"use client";

import styles from "@/modules/pengeluaran/permintaan/permintaan.module.css";

type Props = { reset: () => void };

export default function RekonsiliasiBankError({ reset }: Props) {
  return (
    <main className={styles.errorPage}>
      <section className={styles.errorCard} role="alert">
        <h1 className={styles.loadingTitle}>Rekonsiliasi gagal dimuat</h1>
        <p className={styles.loadingText}>
          Terjadi kesalahan saat memuat rekonsiliasi bank. Coba muat ulang.
        </p>
        <button className={styles.primaryButton} onClick={reset} type="button">
          Coba lagi
        </button>
      </section>
    </main>
  );
}
