import { cekIzin } from "@/lib/auth/permissions";
import type { Profile } from "@/lib/auth/types";
import { PesananForm } from "./components/pesanan-form";
import styles from "./pesanan.module.css";
import { getFormReferenceData } from "./queries";
import type { PesananDetail } from "./types";

type PesananBaruScreenProps = {
  profile: Profile;
  initialPesanan?: PesananDetail | null;
};

export async function PesananBaruScreen({
  profile,
  initialPesanan,
}: PesananBaruScreenProps) {
  const canCreate = cekIzin(profile.peran, "buat_pesanan");

  if (!canCreate) {
    return (
      <section aria-label="Buat pesanan" className={styles.page}>
        <section className={styles.panelCard} aria-labelledby="akses-ditolak">
          <h1 className={styles.title} id="akses-ditolak">
            Akses Ditolak
          </h1>
          <p className={styles.emptyState}>
            Hanya peran Penjualan yang berwenang membuat atau mengubah draf pesanan.
          </p>
        </section>
      </section>
    );
  }

  const refData = await getFormReferenceData();
  const isEdit = Boolean(initialPesanan);

  return (
    <section aria-label="Formulir pesanan penjualan" className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.breadcrumb}>
            Siklus Pendapatan / Pesanan Penjualan /{" "}
            {isEdit ? `Ubah ${initialPesanan?.nomor}` : "Baru"}
          </p>
          <h1 className={styles.title}>
            {isEdit
              ? `Ubah Pesanan ${initialPesanan?.nomor}`
              : "Buat Pesanan Penjualan"}
          </h1>
          <p className={styles.description}>
            Pesanan baru disimpan sebagai Draf sebelum diverifikasi dan dicek
            exposure batas kreditnya oleh Penjualan lain.
          </p>
        </div>
      </header>

      <PesananForm
        initialPesanan={initialPesanan}
        pelangganList={refData.pelangganList}
        produkList={refData.produkList}
        tarifPpn={refData.tarifPpn}
      />
    </section>
  );
}
