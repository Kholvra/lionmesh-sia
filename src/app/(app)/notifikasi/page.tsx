import type { Metadata } from "next";

import { PageHeader } from "@/components/ui/page-header";
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
    <section aria-label="Notifikasi" className={styles.page}>
      <PageHeader
        actions={
          <p className={styles.meta}>
            <strong className={styles.metaAngka}>{data.belumDibaca}</strong> belum
            dibaca · {data.daftar.length} notifikasi terbaru
          </p>
        }
        breadcrumb={["Notifikasi"]}
        description="Kejadian yang menunggu tindakan Anda. Setiap pengiriman email punya status yang bisa diperiksa di daftar ini."
        title="Notifikasi"
      />

      <section className={styles.panelCard} aria-label="Daftar notifikasi">
        <DaftarNotifikasi
          errorMessage={data.error ?? undefined}
          rows={data.daftar}
        />
      </section>
    </section>
  );
}
