"use client";

import styles from "@/modules/core/master/master.module.css";

type MasterErrorProps = {
  judul: string;
  teks: string;
  reset: () => void;
};

export function MasterError({ judul, reset, teks }: MasterErrorProps) {
  return (
    <main className={styles.errorPage}>
      <section className={styles.errorCard} role="alert">
        <h1 className={styles.errorTitle}>{judul}</h1>
        <p className={styles.errorText}>{teks}</p>
        <div className={styles.errorActions}>
          <button className={styles.primaryButton} onClick={reset} type="button">
            Coba lagi
          </button>
        </div>
      </section>
    </main>
  );
}
