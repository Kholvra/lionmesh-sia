"use client";

import styles from "@/modules/pendapatan/pelanggan/pelanggan.module.css";

type PelangganErrorProps = {
  reset: () => void;
};

export default function PelangganError({ reset }: PelangganErrorProps) {
  return (
    <main className={styles.page}>
      <section className={styles.errorCard} role="alert">
        <h1 className={styles.errorTitle}>Data pelanggan gagal dimuat</h1>
        <p className={styles.errorText}>
          Terjadi kendala saat mengambil data master pelanggan. Silakan coba lagi.
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
