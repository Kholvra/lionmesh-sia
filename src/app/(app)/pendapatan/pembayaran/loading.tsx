import styles from "@/modules/pendapatan/pembayaran/pembayaran.module.css";

export default function PembayaranLoading() {
  return (
    <main className={styles.page}>
      <section className={styles.loadingCard} role="status">
        <h1 className={styles.loadingTitle}>Memuat penerimaan pembayaran</h1>
        <p className={styles.loadingText}>
          Daftar penerimaan pembayaran pelanggan dan alokasi piutang sedang
          disiapkan.
        </p>
      </section>
    </main>
  );
}
