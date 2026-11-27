import { cekIzin } from "@/lib/auth/permissions";
import type { Profile } from "@/lib/auth/types";
import { PengirimanForm } from "./components/pengiriman-form";
import styles from "./pengiriman.module.css";
import { listPesananSiapKirim } from "./queries";

type PengirimanBaruScreenProps = {
  profile: Profile;
};

export async function PengirimanBaruScreen({
  profile,
}: PengirimanBaruScreenProps) {
  const canCreate = cekIzin(profile.peran, "buat_pengiriman");

  if (!canCreate) {
    return (
      <section aria-label="Buat pengiriman" className={styles.page}>
        <section className={styles.panelCard} aria-labelledby="akses-ditolak">
          <h1 className={styles.title} id="akses-ditolak">
            Akses Ditolak
          </h1>
          <p className={styles.emptyState}>
            Hanya peran Gudang atau Pengiriman yang berwenang membuat surat jalan.
          </p>
        </section>
      </section>
    );
  }

  const pesananList = await listPesananSiapKirim();

  return (
    <section aria-label="Buat pengiriman baru" className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.breadcrumb}>
            Siklus Pendapatan / Pengiriman & Surat Jalan / Baru
          </p>
          <h1 className={styles.title}>Buat Pengiriman & Surat Jalan</h1>
          <p className={styles.description}>
            Pilih pesanan berstatus Siap Kirim atau Terkirim Sebagian untuk
            menyiapkan draf surat jalan.
          </p>
        </div>
      </header>

      <PengirimanForm pesananList={pesananList} />
    </section>
  );
}
