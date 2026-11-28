import styles from "@/modules/pengeluaran/permintaan/permintaan.module.css";

export default function InvoicePemasokLoading() {
  return (
    <main className={styles.loadingPage}>
      <section className={styles.loadingCard} role="status">
        <h1 className={styles.loadingTitle}>Memuat invoice pemasok</h1>
        <p className={styles.loadingText}>
          Daftar invoice dan penerimaan siap ditagih sedang disiapkan.
        </p>
      </section>
    </main>
  );
}
