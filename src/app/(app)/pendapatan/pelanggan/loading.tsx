import styles from "@/modules/pendapatan/pelanggan/pelanggan.module.css";

export default function PelangganLoading() {
  return (
    <main className={styles.page}>
      <section className={styles.loadingCard} role="status">
        <h1 className={styles.loadingTitle}>Memuat data pelanggan</h1>
        <p className={styles.loadingText}>
          Daftar pelanggan, termin pembayaran, dan pagu kredit sedang disiapkan.
        </p>
      </section>
    </main>
  );
}
