import styles from "@/modules/pendapatan/faktur/faktur.module.css";

export default function FakturLoading() {
  return (
    <main className={styles.page}>
      <section className={styles.loadingCard} role="status">
        <h1 className={styles.loadingTitle}>Memuat faktur penjualan</h1>
        <p className={styles.loadingText}>
          Daftar faktur penjualan dan posisi piutang sedang disiapkan.
        </p>
      </section>
    </main>
  );
}
