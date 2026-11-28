"use client";

import styles from "@/modules/pendapatan/pembayaran/pembayaran.module.css";

type PembayaranErrorProps = {
  reset: () => void;
};

export default function PembayaranError({ reset }: PembayaranErrorProps) {
  return (
    <main className={styles.page}>
      <section className={styles.errorCard} role="alert">
        <h1 className={styles.errorTitle}>Data pembayaran gagal dimuat</h1>
        <p className={styles.errorText}>
          Terjadi kendala saat mengambil data penerimaan pembayaran pelanggan.
          Silakan coba lagi.
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
