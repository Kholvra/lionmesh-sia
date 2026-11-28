import styles from "@/modules/pendapatan/pesanan/pesanan.module.css";

export default function PesananLoading() {
  return (
    <main className={styles.page}>
      <section className={styles.loadingCard} role="status">
        <h1 className={styles.loadingTitle}>Memuat pesanan penjualan</h1>
        <p className={styles.loadingText}>
          Daftar pesanan, rincian produk, dan status kredit sedang disiapkan.
        </p>
      </section>
    </main>
  );
}
