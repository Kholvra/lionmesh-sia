"use client";

import styles from "@/modules/pendapatan/pengiriman/pengiriman.module.css";

type PengirimanErrorProps = {
  reset: () => void;
};

export default function PengirimanError({ reset }: PengirimanErrorProps) {
  return (
    <main className={styles.page}>
      <section className={styles.errorCard} role="alert">
        <h1 className={styles.errorTitle}>Data pengiriman gagal dimuat</h1>
        <p className={styles.errorText}>
          Terjadi kendala saat mengambil data pengiriman. Silakan coba lagi.
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
