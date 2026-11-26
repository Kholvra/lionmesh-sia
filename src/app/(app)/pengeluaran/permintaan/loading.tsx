import styles from "@/modules/pengeluaran/permintaan/permintaan.module.css";

export default function PermintaanLoading() {
  return (
    <main className={styles.loadingPage}>
      <section className={styles.loadingCard} role="status">
        <h1 className={styles.loadingTitle}>Memuat permintaan pembelian</h1>
        <p className={styles.loadingText}>Antrean dan detail permintaan sedang disiapkan.</p>
      </section>
    </main>
  );
}
