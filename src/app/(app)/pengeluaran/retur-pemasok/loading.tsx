import styles from "@/modules/pengeluaran/permintaan/permintaan.module.css";

export default function ReturPemasokLoading() {
  return (
    <main className={styles.loadingPage}>
      <section className={styles.loadingCard} role="status">
        <h1 className={styles.loadingTitle}>Memuat retur pemasok</h1>
        <p className={styles.loadingText}>
          Daftar retur dan penerimaan dengan qty gagal sedang disiapkan.
        </p>
      </section>
    </main>
  );
}
