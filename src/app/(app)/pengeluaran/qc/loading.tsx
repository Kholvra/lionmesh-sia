import styles from "@/modules/pengeluaran/permintaan/permintaan.module.css";

export default function QcLoading() {
  return (
    <main className={styles.loadingPage}>
      <section className={styles.loadingCard} role="status">
        <h1 className={styles.loadingTitle}>Memuat QC bahan</h1>
        <p className={styles.loadingText}>
          Penerimaan dan baris yang menunggu pemeriksaan sedang disiapkan.
        </p>
      </section>
    </main>
  );
}
