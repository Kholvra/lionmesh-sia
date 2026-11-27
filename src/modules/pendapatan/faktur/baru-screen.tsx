import { cekIzin } from "@/lib/auth/permissions";
import type { Profile } from "@/lib/auth/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { FakturForm } from "./components/faktur-form";
import styles from "./faktur.module.css";
import { getTarifPpnUntukTanggal, listPengirimanSiapFaktur } from "./queries";

type FakturBaruScreenProps = {
  profile: Profile;
};

export async function FakturBaruScreen({ profile }: FakturBaruScreenProps) {
  const canIssue = cekIzin(profile.peran, "terbitkan_faktur");

  if (!canIssue) {
    return (
      <section aria-label="Buat faktur" className={styles.page}>
        <section className={styles.panelCard} aria-labelledby="akses-ditolak">
          <h1 className={styles.title} id="akses-ditolak">
            Akses Ditolak
          </h1>
          <p className={styles.emptyState}>
            Anda tidak berwenang menerbitkan faktur. Hanya peran Accounting yang
            memiliki akses ini.
          </p>
        </section>
      </section>
    );
  }

  const supabase = createAdminClient();
  const today = new Date().toISOString().split("T")[0];
  const [pengirimanList, tarifPpn] = await Promise.all([
    listPengirimanSiapFaktur(),
    getTarifPpnUntukTanggal(supabase, today),
  ]);

  return (
    <section aria-label="Buat faktur baru" className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.breadcrumb}>
            Siklus Pendapatan / Faktur Penjualan / Baru
          </p>
          <h1 className={styles.title}>Buat Faktur Penjualan</h1>
          <p className={styles.description}>
            Pilih surat jalan yang telah dikirim untuk menghitung DPP, PPN, dan
            menyiapkan draf faktur penjualan.
          </p>
        </div>
      </header>

      <FakturForm
        pengirimanList={pengirimanList}
        tarifPpnDefault={tarifPpn ?? 0.11}
      />
    </section>
  );
}
