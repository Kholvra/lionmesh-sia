import { Suspense } from "react";

import { AuthError } from "@/components/auth-error";
import { AuthForm } from "@/components/auth-form";
import styles from "@/components/auth.module.css";

const CYCLES = [
  { title: "Pendapatan", description: "Pesanan hingga penerimaan kas" },
  { title: "Pengeluaran", description: "Pembelian hingga pembayaran" },
  { title: "Produksi", description: "Perencanaan hingga hasil produksi" },
  { title: "Penggajian", description: "Kehadiran hingga pembayaran gaji" },
];

export default function LoginPage() {
  return (
    <div className={styles.page}>
      <aside className={styles.brandPanel}>
        <div>
          <p className={styles.brand}>Lionmesh</p>
          <p className={styles.brandDescription}>PT Lionmesh Prima Tbk</p>
        </div>
        <div className={styles.introduction}>
          <h2>Empat siklus.<br />Satu kendali bisnis.</h2>
          <p>Pantau pendapatan, pengeluaran, produksi, dan penggajian dalam satu sistem.</p>
          <div className={styles.cycleList}>
            {CYCLES.map((cycle) => (
              <div className={styles.cycle} key={cycle.title}>
                <span className={styles.cycleTitle}>{cycle.title}</span>
                <span>{cycle.description}</span>
              </div>
            ))}
          </div>
        </div>
        <p className={styles.brandDescription}>Sistem informasi internal</p>
      </aside>
      <main className={styles.main}>
        <div className={styles.content}>
          <h1>Selamat datang kembali</h1>
          <p className={styles.description}>Masuk untuk melanjutkan pekerjaan Anda di Lionmesh SIA.</p>
          <Suspense fallback={null}><AuthError /></Suspense>
          <AuthForm />
        </div>
        <footer className={styles.footer}>© PT Lionmesh Prima Tbk</footer>
      </main>
    </div>
  );
}
