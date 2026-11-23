import styles from "@/modules/pengeluaran/pemasok/pemasok.module.css";

export default function PemasokLoading() {
  return (
    <main className={styles.loadingPage}>
      <section className={styles.loadingCard} role="status">
        <h1 className={styles.loadingTitle}>Memuat data pemasok</h1>
        <p className={styles.loadingText}>
          Daftar pemasok, termin, dan toleransi sedang disiapkan.
        </p>
      </section>
    </main>
  );
}
