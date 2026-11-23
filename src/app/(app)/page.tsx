import styles from "./page.module.css";

export default function DashboardPage() {
  return (
    <section className={styles.page} aria-labelledby="dashboard-title">
      <header className={styles.header}>
        <p className={styles.breadcrumb}>Dashboard</p>
        <h1 className={styles.title} id="dashboard-title">
          Dashboard umum
        </h1>
        <p className={styles.description}>
          Ringkasan lintas siklus dan antrean menunggu tindakan Anda.
        </p>
      </header>

      <div className={styles.empty}>
        <h2 className={styles.emptyTitle}>Belum ada ringkasan</h2>
        <p className={styles.emptyText}>
          Dashboard umum dibangun oleh item <code>C-014</code> dan belum
          tersedia. Menu siklus di samping menyala saat layar pertamanya selesai.
        </p>
      </div>
    </section>
  );
}
