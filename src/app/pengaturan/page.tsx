import { SignOutButton } from "@/components/sign-out-button";
import { requireSesi } from "@/lib/auth/server";

import styles from "./page.module.css";

export const instant = false;

export default async function PengaturanPage() {
  const { user, profile } = await requireSesi();

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.breadcrumb}>Pengaturan</p>
          <h1 className={styles.title}>Akun saya</h1>
          <p className={styles.description}>
            Informasi akun dan peran yang digunakan untuk mengakses SIA.
          </p>
        </div>
        <SignOutButton variant="light" />
      </header>

      <section className={styles.card} aria-labelledby="account-title">
        <h2 className={styles.sectionTitle} id="account-title">
          Informasi akun
        </h2>
        <dl className={styles.details}>
          <div className={styles.detail}>
            <dt>Email akun</dt>
            <dd>{user.email ?? "Email tidak tersedia"}</dd>
          </div>
          <div className={styles.detail}>
            <dt>Peran</dt>
            <dd>{profile.peran ?? "Belum memiliki peran"}</dd>
          </div>
          <div className={styles.detail}>
            <dt>Status akun</dt>
            <dd>Aktif</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
