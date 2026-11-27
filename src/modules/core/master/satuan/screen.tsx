import Link from "next/link";

import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { submitButtonClassName } from "@/components/ui/submit-button";
import { StatusBadge } from "@/components/ui";
import { cekIzin } from "@/lib/auth/permissions";
import type { Profile } from "@/lib/auth/types";
import { formatDesimal } from "@/lib/format/number";

import { KonversiSatuanForm } from "../components/konversi-satuan-form";
import { MasterStatusButton } from "../components/master-status-button";
import { MasterTable } from "../components/master-table";
import { RiwayatMaster } from "../components/riwayat-master";
import { SatuanForm } from "../components/satuan-form";
import { PATH_MASTER_SATUAN } from "../constants";
import { STATUS_MASTER, statusMaster } from "../format";
import styles from "../master.module.css";
import { getSatuanPageData } from "../queries";

type SatuanScreenProps = {
  profile: Profile;
  satuanId?: string;
  mode?: string;
};

export async function SatuanScreen({ mode, profile, satuanId }: SatuanScreenProps) {
  const canManage = cekIzin(profile.peran, "kelola_satuan");
  const data = await getSatuanPageData(satuanId);

  const terpilih = data.terpilih;
  const tampilkanFormUbah = canManage && mode === "edit" && terpilih !== null;

  const baris = data.daftar.map((satuan) => ({
    id: satuan.id,
    kode: satuan.kode,
    nama: satuan.nama,
    aktif: satuan.aktif,
  }));

  return (
    <section aria-label="Master satuan" className={styles.page}>
      <PageHeader
        description="Satuan dasar dan konversi antar satuan. Konversi hanya dicatat antara dua satuan aktif."
        title="Satuan"
      />

      <div className={styles.layout}>
        <section className={styles.panel} aria-label="Detail satuan">
          <div className={styles.panelCard}>
            {terpilih && tampilkanFormUbah ? (
              <>
                <PageHeader
                  description={terpilih.kode}
                  title="Ubah satuan"
                  variant="section"
                />
                <SatuanForm key={terpilih.id} satuan={terpilih} />
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
                      href={`${PATH_MASTER_SATUAN}?id=${terpilih.id}&mode=edit`}
                    >
                      Ubah data
                    </Link>
                    <MasterStatusButton
                      aktif={terpilih.aktif}
                      entitas="satuan"
                      id={terpilih.id}
                      label="Satuan"
                      nama={terpilih.kode}
                    />
                  </div>
                ) : (
                  <p className={styles.panelMeta}>
                    Peran Anda tidak dapat mengubah master satuan.
                  </p>
                )}

                <hr className={styles.sectionDivider} />
                <RiwayatMaster
                  errorMessage={data.riwayatError ?? undefined}
                  riwayat={data.riwayat}
                />
              </div>
            ) : satuanId ? (
              <div>
                <PageHeader title="Satuan tidak ditemukan" variant="section" />
                <p className={styles.emptyState}>
                  Satuan yang dipilih tidak tersedia.
                </p>
              </div>
            ) : canManage ? (
              <>
                <PageHeader
                  description="Kode dan nama wajib diisi."
                  title="Tambah satuan"
                  variant="section"
                />
                <SatuanForm />
              </>
            ) : (
              <div>
                <PageHeader title="Detail satuan" variant="section" />
                <p className={styles.emptyState}>
                  Pilih satuan dari daftar untuk melihat detail. Peran Anda tidak
                  dapat mengubah master satuan.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className={styles.listPanel} aria-label="Daftar satuan">
          <div className={styles.panelCard}>
            <PageHeader
              actions={
                canManage ? (
                  <Link
                    className={submitButtonClassName({
                      className: `${styles.primaryButton} ${styles.panelAction}`,
                      size: "lg",
                    })}
                    href={PATH_MASTER_SATUAN}
                  >
                    Tambah satuan
                  </Link>
                ) : null
              }
              description={`${data.daftar.length} satuan · Aktor: ${profile.peran ?? "—"}`}
              title="Daftar satuan"
              variant="section"
            />

            <MasterTable
              caption="Daftar satuan"
              emptyMessage="Belum ada satuan. Tambahkan satuan pertama."
              errorMessage={data.daftarError ?? undefined}
              hrefBase={PATH_MASTER_SATUAN}
              kolom={[]}
              rows={baris}
              selectedId={satuanId}
            />
          </div>
        </section>
      </div>

      <section className={styles.section} aria-label="Konversi satuan">
        <div className={styles.panelCard}>
          <PageHeader
            description="Faktor menyatakan berapa satuan tujuan dalam satu satuan asal."
            title="Konversi satuan"
            variant="section"
          />

          {canManage ? <KonversiSatuanForm satuanAktif={data.satuanAktif} /> : null}

          {data.konversiError ? (
            <Notice className={styles.messageError} tone="danger">
              Daftar konversi gagal dimuat: {data.konversiError}
            </Notice>
          ) : data.konversi.length === 0 ? (
            <p className={styles.emptyState}>Belum ada konversi satuan.</p>
          ) : (
            <table className={styles.tabelMini}>
              <caption className={styles.panelMeta}>Daftar konversi satuan</caption>
              <thead>
                <tr>
                  <th scope="col">Dari</th>
                  <th scope="col">Ke</th>
                  <th className={styles.tabelMiniAngka} scope="col">
                    Faktor
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.konversi.map((konversi) => (
                  <tr key={konversi.id}>
                    <td>{konversi.satuan_dari_kode}</td>
                    <td>{konversi.satuan_ke_kode}</td>
                    <td className={styles.tabelMiniAngka}>
                      {formatDesimal(konversi.faktor, 6)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </section>
  );
}
