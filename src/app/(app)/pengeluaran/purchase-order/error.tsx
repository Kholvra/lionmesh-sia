"use client";

import styles from "@/modules/pengeluaran/permintaan/permintaan.module.css";

type Props = { reset: () => void };

export default function PurchaseOrderError({ reset }: Props) {
  return (
    <main className={styles.errorPage}>
      <section className={styles.errorCard} role="alert">
        <h1 className={styles.loadingTitle}>Purchase order gagal dimuat</h1>
        <p className={styles.loadingText}>
          Terjadi kesalahan saat memuat purchase order. Coba muat ulang.
        </p>
        <button className={styles.primaryButton} onClick={reset} type="button">
          Coba lagi
        </button>
      </section>
    </main>
  );
}
