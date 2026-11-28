import styles from "@/modules/pendapatan/retur/retur.module.css";

export default function ReturLoading() {
  return (
    <main className={styles.page}>
      <section className={styles.loadingCard} role="status">
        <h1 className={styles.loadingTitle}>Memuat retur penjualan</h1>
        <p className={styles.loadingText}>
          Daftar retur penjualan dan kredit memo sedang disiapkan.
        </p>
      </section>
    </main>
  );
}
