import styles from "./notifikasi.module.css";

export default function NotifikasiLoading() {
  return (
    <main className={styles.loadingPage}>
      <section className={styles.loadingCard} role="status">
        <h1 className={styles.loadingTitle}>Memuat notifikasi</h1>
        <p className={styles.loadingText}>
          Daftar notifikasi dan status pengiriman email sedang disiapkan.
        </p>
      </section>
    </main>
  );
}
