import styles from "@/modules/pengeluaran/permintaan/permintaan.module.css";

export default function PembayaranPemasokLoading() {
  return (
    <main className={styles.loadingPage}>
      <section className={styles.loadingCard} role="status">
        <h1 className={styles.loadingTitle}>Memuat pembayaran pemasok</h1>
        <p className={styles.loadingText}>
          Daftar utang dan pembayaran sedang disiapkan.
        </p>
      </section>
    </main>
  );
}
