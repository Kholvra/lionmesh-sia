import styles from "@/modules/pengeluaran/permintaan/permintaan.module.css";

export default function RekonsiliasiBankLoading() {
  return (
    <main className={styles.loadingPage}>
      <section className={styles.loadingCard} role="status">
        <h1 className={styles.loadingTitle}>Memuat rekonsiliasi bank</h1>
        <p className={styles.loadingText}>
          Mutasi bank dan baris jurnal kas sedang disiapkan.
        </p>
      </section>
    </main>
  );
}
