import styles from "@/modules/pengeluaran/permintaan/permintaan.module.css";

export default function PenerimaanLoading() {
  return (
    <main className={styles.loadingPage}>
      <section className={styles.loadingCard} role="status">
        <h1 className={styles.loadingTitle}>Memuat penerimaan barang</h1>
        <p className={styles.loadingText}>
          Daftar penerimaan dan PO siap diterima sedang disiapkan.
        </p>
      </section>
    </main>
  );
}
