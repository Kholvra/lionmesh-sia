import styles from "@/modules/pengeluaran/permintaan/permintaan.module.css";

export default function PurchaseOrderLoading() {
  return (
    <main className={styles.loadingPage}>
      <section className={styles.loadingCard} role="status">
        <h1 className={styles.loadingTitle}>Memuat purchase order</h1>
        <p className={styles.loadingText}>
          Daftar PO dan permintaan siap diterbitkan sedang disiapkan.
        </p>
      </section>
    </main>
  );
}
