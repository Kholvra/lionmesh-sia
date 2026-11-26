import type { Metadata } from "next";

import { requireSesi } from "@/lib/auth/server";

import { DaftarNotifikasi } from "./components/daftar-notifikasi";
import styles from "./notifikasi.module.css";
import { muatHalamanNotifikasi } from "./data";

export const instant = false;

export const metadata: Metadata = {
  title: "Notifikasi — Lionmesh SIA",
};

export default async function NotifikasiPage() {
  const { user } = await requireSesi();
  const data = await muatHalamanNotifikasi(user.id);

  return (
    <section aria-labelledby="judul-notifikasi" className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.breadcrumb}>Notifikasi</p>
          <h1 className={styles.title} id="judul-notifikasi">
            Notifikasi
          </h1>
          <p className={styles.description}>
            Kejadian yang menunggu tindakan Anda. Setiap pengiriman email punya
            status yang bisa diperiksa di daftar ini.
          </p>
        </div>
        <p className={styles.meta}>
          <strong className={styles.metaAngka}>{data.belumDibaca}</strong> belum
          dibaca · {data.daftar.length} notifikasi terbaru
        </p>
      </header>

      <section className={styles.panelCard} aria-label="Daftar notifikasi">
        <DaftarNotifikasi
          errorMessage={data.error ?? undefined}
          rows={data.daftar}
        />
      </section>
    </section>
  );
}
