"use client";

import styles from "@/modules/pendapatan/faktur/faktur.module.css";

type FakturErrorProps = {
  reset: () => void;
};

export default function FakturError({ reset }: FakturErrorProps) {
  return (
    <main className={styles.page}>
      <section className={styles.errorCard} role="alert">
        <h1 className={styles.errorTitle}>Data faktur gagal dimuat</h1>
        <p className={styles.errorText}>
          Terjadi kendala saat mengambil data faktur penjualan. Silakan coba lagi.
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
