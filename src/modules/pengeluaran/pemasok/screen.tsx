import Link from "next/link";

import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import type { Profile } from "@/lib/auth/types";
import { cekIzin } from "@/lib/auth/permissions";
import { PemasokDetail } from "./components/pemasok-detail";
import { PemasokForm } from "./components/pemasok-form";
import { PemasokTable } from "./components/pemasok-table";
import { PATH_PEMASOK } from "./constants";
import styles from "./pemasok.module.css";
import { getPemasokPageData } from "./queries";

type PemasokScreenProps = {
  profile: Profile;
  pemasokId?: string;
  mode?: string;
};

export async function PemasokScreen({
  mode,
  pemasokId,
  profile,
}: PemasokScreenProps) {
  const canManage = cekIzin(profile.peran, "buat_ubah_pemasok");
  const canReadPic =
    profile.peran === "Purchasing" || profile.peran === "Accounting";
  // PG-001: Purchasing mengelola, Accounting membaca kontak. Peran lain tidak punya aksi pada master ini (D-33).
  const bolehBaca = profile.peran === "Purchasing" || profile.peran === "Accounting";

  if (!bolehBaca) {
    return (
      <section aria-label="Master pemasok" className={styles.page}>
        <section className={styles.panelCard} aria-labelledby="akses-ditolak">
          <h1 className={styles.title} id="akses-ditolak">
            Akses ditolak
          </h1>
          <p className={styles.emptyState}>
            Peran Anda tidak memiliki akses ke master pemasok. Hubungi
            administrator bila akses ini dibutuhkan.
          </p>
        </section>
      </section>
    );
  }

  const data = await getPemasokPageData(pemasokId);

  const terpilih = data.terpilih;
  const tampilkanFormUbah = canManage && mode === "edit" && terpilih !== null;

  return (
    <section aria-label="Master pemasok" className={styles.page}>
      <PageHeader
        description="Kelola master pemasok, termin pembayaran, dan toleransi pencocokan tiga dokumen. Perubahan master hanya berlaku untuk dokumen baru."
        title="Pemasok"
      />

      <div className={styles.layout}>
        <section className={styles.listPanel} aria-labelledby="daftar-pemasok">
          <div className={styles.panelCard}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle} id="daftar-pemasok">
                  Daftar pemasok
                </h2>
                <p className={styles.panelMeta}>
                  {data.daftar.length} pemasok · Aktor: {profile.peran ?? "—"}
                </p>
              </div>
              {canManage ? (
                <Link
                  className={`${styles.primaryButton} ${styles.panelAction}`}
                  href={PATH_PEMASOK}
                >
                  Tambah pemasok
                </Link>
              ) : null}
            </div>

            <PemasokTable
              errorMessage={data.daftarError ?? undefined}
              rows={data.daftar}
              selectedId={pemasokId}
            />
          </div>
        </section>

        <section className={styles.panel} aria-label="Detail pemasok">
          <div className={styles.panelCard}>
            {terpilih && tampilkanFormUbah ? (
              <>
                <div className={styles.panelHeader}>
                  <div>
                    <h2 className={styles.panelTitle} id="panel-pemasok">
                      Ubah pemasok
                    </h2>
                    <p className={styles.panelMeta}>{terpilih.nama}</p>
                  </div>
                </div>
                <PemasokForm key={terpilih.id} pemasok={terpilih} />
              </>
            ) : terpilih ? (
              <PemasokDetail
                canManage={canManage}
                canReadPic={canReadPic}
                pemasok={terpilih}
                riwayat={data.riwayat}
                riwayatError={data.riwayatError}
              />
            ) : data.terpilihError ? (
              <div>
                <h2 className={styles.panelTitle} id="panel-pemasok">
                  Detail pemasok
                </h2>
                <Notice tone="danger">
                  Detail pemasok gagal dimuat: {data.terpilihError}
                </Notice>
              </div>
            ) : pemasokId ? (
              <div>
                <h2 className={styles.panelTitle} id="panel-pemasok">
                  Pemasok tidak ditemukan
                </h2>
                <p className={styles.emptyState}>
                  Pemasok yang dipilih tidak tersedia atau sudah tidak dapat
                  diakses oleh peran Anda.
                </p>
              </div>
            ) : canManage ? (
              <>
                <div className={styles.panelHeader}>
                  <div>
                    <h2 className={styles.panelTitle} id="panel-pemasok">
                      Tambah pemasok
                    </h2>
                    <p className={styles.panelMeta}>
                      Termin wajib diisi; toleransi default 0.
                    </p>
                  </div>
                </div>
                <PemasokForm />
              </>
            ) : (
              <div>
                <h2 className={styles.panelTitle} id="panel-pemasok">
                  Detail pemasok
                </h2>
                <p className={styles.emptyState}>
                  Pilih pemasok dari daftar untuk melihat detail. Peran Anda
                  tidak dapat mengubah master pemasok.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
