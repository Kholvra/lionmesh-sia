import styles from "@/modules/core/master/master.module.css";

type MasterLoadingProps = {
  judul: string;
  teks: string;
};

export function MasterLoading({ judul, teks }: MasterLoadingProps) {
  return (
    <main className={styles.loadingPage}>
      <section className={styles.loadingCard} role="status">
        <h1 className={styles.loadingTitle}>{judul}</h1>
        <p className={styles.loadingText}>{teks}</p>
      </section>
    </main>
  );
}
