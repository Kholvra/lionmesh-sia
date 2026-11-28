import Link from "next/link";

import { cekIzin } from "@/lib/auth/permissions";
import { requireSesi } from "@/lib/auth/server";
import { AksesDitolak } from "./components/laporan-shell";
import { DAFTAR_LAPORAN } from "./daftar-laporan";
import styles from "./laporan.module.css";

export const instant = false;

export default async function LaporanIndexPage() {
  const { profile } = await requireSesi();

  if (!cekIzin(profile.peran, "lihat_laporan_keuangan")) {
    return <AksesDitolak />;
  }

  return (
    <section aria-labelledby="laporan-title" className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title} id="laporan-title">
            Laporan keuangan
          </h1>
          <p className={styles.description}>
            Tujuh laporan yang dibaca dari jurnal yang sudah diposting. Setiap
            angka dapat ditelusuri ke baris jurnal sumbernya.
          </p>
          <p className={styles.actor}>
            Aktor: {profile.peran ?? "—"} · Satu laporan dibuka untuk satu bulan
            kalender
          </p>
        </div>
      </header>

      <div className={styles.cards}>
        {DAFTAR_LAPORAN.map((laporan) => (
          <Link
            className={styles.card}
            href={`/laporan/${laporan.slug}`}
            key={laporan.slug}
          >
            <h2 className={styles.cardTitle}>{laporan.judul}</h2>
            <p className={styles.cardText}>{laporan.deskripsi}</p>
          </Link>
        ))}
      </div>

      <p className={styles.note}>
        Pilih laporan, lalu pilih satu bulan kalender pada filter periode.
        Membuka laporan tidak mengubah jurnal, saldo, atau status periode.
      </p>
    </section>
  );
}
