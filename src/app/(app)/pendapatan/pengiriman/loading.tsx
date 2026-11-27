import styles from "@/modules/pendapatan/pengiriman/pengiriman.module.css";

export default function PengirimanLoading() {
  return (
    <main className={styles.page}>
      <section className={styles.loadingCard} role="status">
        <h1 className={styles.loadingTitle}>Memuat pengiriman & surat jalan</h1>
        <p className={styles.loadingText}>
          Daftar pengiriman dan rincian surat jalan sedang disiapkan.
        </p>
      </section>
    </main>
  );
}
