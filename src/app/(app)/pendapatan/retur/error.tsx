"use client";

import styles from "@/modules/pendapatan/retur/retur.module.css";

type ReturErrorProps = {
  reset: () => void;
};

export default function ReturError({ reset }: ReturErrorProps) {
  return (
    <main className={styles.page}>
      <section className={styles.errorCard} role="alert">
        <h1 className={styles.errorTitle}>Data retur gagal dimuat</h1>
        <p className={styles.errorText}>
          Terjadi kendala saat mengambil data retur penjualan. Silakan coba lagi.
        </p>
        <div className={styles.errorActions}>
          <button
            className={styles.primaryButton}
            onClick={reset}
            type="button"
          >
            Coba lagi
          </button>
        </div>
      </section>
    </main>
  );
}
