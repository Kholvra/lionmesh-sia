"use client";

import styles from "./notifikasi.module.css";

type NotifikasiErrorProps = {
  reset: () => void;
};

export default function NotifikasiError({ reset }: NotifikasiErrorProps) {
  return (
    <main className={styles.errorPage}>
      <section className={styles.errorCard} role="alert">
        <h1 className={styles.errorTitle}>Notifikasi gagal dimuat</h1>
        <p className={styles.errorText}>
          Terjadi kesalahan saat memuat daftar notifikasi. Coba muat ulang
          halaman ini.
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
