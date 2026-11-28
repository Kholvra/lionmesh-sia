"use client";

import styles from "@/modules/pengeluaran/permintaan/permintaan.module.css";

type Props = { reset: () => void };

export default function PenerimaanError({ reset }: Props) {
  return (
    <main className={styles.errorPage}>
      <section className={styles.errorCard} role="alert">
        <h1 className={styles.loadingTitle}>Penerimaan gagal dimuat</h1>
        <p className={styles.loadingText}>
          Terjadi kesalahan saat memuat penerimaan barang. Coba muat ulang.
        </p>
        <button className={styles.primaryButton} onClick={reset} type="button">
          Coba lagi
        </button>
      </section>
    </main>
  );
}
