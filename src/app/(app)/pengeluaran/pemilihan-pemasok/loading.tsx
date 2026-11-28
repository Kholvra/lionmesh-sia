import styles from "@/modules/pengeluaran/permintaan/permintaan.module.css";

export default function PemilihanPemasokLoading() {
  return (
    <main className={styles.loadingPage}>
      <section className={styles.loadingCard} role="status">
        <h1 className={styles.loadingTitle}>Memuat pemilihan pemasok</h1>
        <p className={styles.loadingText}>
          Perbandingan harga dan daftar pemasok sedang disiapkan.
        </p>
      </section>
    </main>
  );
}
