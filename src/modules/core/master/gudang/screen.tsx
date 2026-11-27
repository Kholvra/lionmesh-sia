import Link from "next/link";

import { PageHeader } from "@/components/ui/page-header";
import { submitButtonClassName } from "@/components/ui/submit-button";
import { StatusBadge } from "@/components/ui";
import { cekIzin } from "@/lib/auth/permissions";
import type { Profile } from "@/lib/auth/types";

import { GudangForm } from "../components/gudang-form";
import { MasterStatusButton } from "../components/master-status-button";
import { MasterTable } from "../components/master-table";
import { RiwayatMaster } from "../components/riwayat-master";
import { PATH_MASTER_GUDANG } from "../constants";
import { STATUS_MASTER, statusMaster } from "../format";
import styles from "../master.module.css";
import { getGudangPageData } from "../queries";

type GudangScreenProps = {
  profile: Profile;
  gudangId?: string;
  mode?: string;
};

export async function GudangScreen({ gudangId, mode, profile }: GudangScreenProps) {
  const canManage = cekIzin(profile.peran, "kelola_gudang");
  const data = await getGudangPageData(gudangId);

  const terpilih = data.terpilih;
  const tampilkanFormUbah = canManage && mode === "edit" && terpilih !== null;

  const baris = data.daftar.map((gudang) => ({
    id: gudang.id,
    kode: gudang.kode,
    nama: gudang.nama,
    aktif: gudang.aktif,
  }));

  return (
    <section aria-label="Master gudang" className={styles.page}>
      <PageHeader
        breadcrumb={["Pengaturan", "Master data"]}
        description="Daftar gudang yang dipakai lintas siklus. Gudang nonaktif tidak bisa dipilih untuk dokumen baru, tetapi dokumen lama tetap terbaca."
        title="Gudang"
      />

      <div className={styles.layout}>
        <section className={styles.panel} aria-label="Detail gudang">
          <div className={styles.panelCard}>
            {terpilih && tampilkanFormUbah ? (
              <>
                <PageHeader
                  description={terpilih.kode}
                  title="Ubah gudang"
                  variant="section"
                />
                <GudangForm key={terpilih.id} gudang={terpilih} />
              </>
            ) : terpilih ? (
              <div>
                <div className={styles.detailHeader}>
                  <div>
                    <h2 className={styles.detailName}>{terpilih.nama}</h2>
                    <p className={styles.detailSubtitle}>{terpilih.kode}</p>
                  </div>
                  <StatusBadge
                    status={statusMaster(terpilih.aktif)}
                    statuses={STATUS_MASTER}
                  />
                </div>

                {canManage ? (
                  <div className={`${styles.buttonRow} ${styles.detailActions}`}>
                    <Link
                      className={submitButtonClassName({
                        className: styles.secondaryButton,
                        size: "lg",
                        variant: "secondary",
                      })}
                      href={`${PATH_MASTER_GUDANG}?id=${terpilih.id}&mode=edit`}
                    >
                      Ubah data
                    </Link>
                    <MasterStatusButton
                      aktif={terpilih.aktif}
                      entitas="gudang"
                      id={terpilih.id}
                      label="Gudang"
                      nama={terpilih.kode}
                    />
                  </div>
                ) : (
                  <p className={styles.panelMeta}>
                    Peran Anda tidak dapat mengubah master gudang.
                  </p>
                )}

                <hr className={styles.sectionDivider} />
                <RiwayatMaster
                  errorMessage={data.riwayatError ?? undefined}
                  riwayat={data.riwayat}
                />
              </div>
            ) : gudangId ? (
              <div>
                <PageHeader title="Gudang tidak ditemukan" variant="section" />
                <p className={styles.emptyState}>
                  Gudang yang dipilih tidak tersedia.
                </p>
                <Link className={submitButtonClassName({ className: styles.secondaryButton, size: "lg", variant: "secondary" })} href={PATH_MASTER_GUDANG}>
                  Kembali ke daftar
                </Link>
              </div>
            ) : canManage ? (
              <>
                <PageHeader
                  description="Kode dan nama wajib diisi."
                  title="Tambah gudang"
                  variant="section"
                />
                <GudangForm />
              </>
            ) : (
              <div>
                <PageHeader title="Detail gudang" variant="section" />
                <p className={styles.emptyState}>
                  Pilih gudang dari daftar untuk melihat detail. Peran Anda tidak
                  dapat mengubah master gudang.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className={styles.listPanel} aria-label="Daftar gudang">
          <div className={styles.panelCard}>
            <PageHeader
              actions={
                canManage ? (
                  <Link
                    className={submitButtonClassName({
                      className: `${styles.primaryButton} ${styles.panelAction}`,
                      size: "lg",
                    })}
                    href={PATH_MASTER_GUDANG}
                  >
                    Tambah gudang
                  </Link>
                ) : null
              }
              description={`${data.daftar.length} gudang · Aktor: ${profile.peran ?? "—"}`}
              title="Daftar gudang"
              variant="section"
            />

            <MasterTable
              caption="Daftar gudang"
              emptyMessage="Belum ada gudang. Tambahkan gudang pertama."
              errorMessage={data.daftarError ?? undefined}
              hrefBase={PATH_MASTER_GUDANG}
              kolom={[]}
              rows={baris}
              selectedId={gudangId}
            />
          </div>
        </section>

      </div>
    </section>
  );
}
