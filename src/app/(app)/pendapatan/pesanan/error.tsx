"use client";

import styles from "@/modules/pendapatan/pesanan/pesanan.module.css";

type PesananErrorProps = {
  reset: () => void;
};

export default function PesananError({ reset }: PesananErrorProps) {
  return (
    <main className={styles.page}>
      <section className={styles.errorCard} role="alert">
        <h1 className={styles.errorTitle}>Pesanan penjualan gagal dimuat</h1>
        <p className={styles.errorText}>
          Terjadi kendala saat mengambil data pesanan penjualan. Silakan coba lagi.
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
