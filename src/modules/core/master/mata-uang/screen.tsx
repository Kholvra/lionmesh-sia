import Link from "next/link";

import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { submitButtonClassName } from "@/components/ui/submit-button";
import { StatusBadge } from "@/components/ui";
import { cekIzin } from "@/lib/auth/permissions";
import type { Profile } from "@/lib/auth/types";
import { formatTanggal } from "@/lib/format/date";
import { formatDesimal } from "@/lib/format/number";

import { KursForm } from "../components/kurs-form";
import { MasterStatusButton } from "../components/master-status-button";
import { MasterTable } from "../components/master-table";
import { MataUangForm } from "../components/mata-uang-form";
import { RiwayatMaster } from "../components/riwayat-master";
import { PATH_MASTER_MATA_UANG } from "../constants";
import { STATUS_MASTER, statusMaster } from "../format";
import styles from "../master.module.css";
import { getMataUangPageData } from "../queries";

type MataUangScreenProps = {
  profile: Profile;
  mataUangId?: string;
  mode?: string;
};

export async function MataUangScreen({
  mataUangId,
  mode,
  profile,
}: MataUangScreenProps) {
  const canManage = cekIzin(profile.peran, "kelola_mata_uang");
  const data = await getMataUangPageData(mataUangId);

  const terpilih = data.terpilih;
  const tampilkanFormUbah = canManage && mode === "edit" && terpilih !== null;

  const baris = data.daftar.map((mataUang) => ({
    id: mataUang.id,
    kode: mataUang.kode,
    nama: mataUang.nama,
    aktif: mataUang.aktif,
    simbol: mataUang.simbol ?? "—",
  }));

  return (
    <section aria-label="Master mata uang" className={styles.page}>
      <PageHeader
        breadcrumb={["Pengaturan", "Master data"]}
        description="Mata uang dan kurs disimpan sebagai master. Dokumen dan jurnal baru tetap dalam IDR (D-38)."
        title="Mata uang dan kurs"
      />

      <div className={styles.layout}>
        <section className={styles.panel} aria-label="Detail mata uang">
          <div className={styles.panelCard}>
            {terpilih && tampilkanFormUbah ? (
              <>
                <PageHeader
                  description={terpilih.kode}
                  title="Ubah mata uang"
                  variant="section"
                />
                <MataUangForm key={terpilih.id} mataUang={terpilih} />
              </>
            ) : terpilih ? (
              <div>
                <div className={styles.detailHeader}>
                  <div>
                    <h2 className={styles.detailName}>{terpilih.nama}</h2>
                    <p className={styles.detailSubtitle}>
                      {terpilih.kode}
                      {terpilih.simbol ? ` · ${terpilih.simbol}` : ""}
                    </p>
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
                      href={`${PATH_MASTER_MATA_UANG}?id=${terpilih.id}&mode=edit`}
                    >
                      Ubah data
                    </Link>
                    <MasterStatusButton
                      aktif={terpilih.aktif}
                      entitas="mata_uang"
                      id={terpilih.id}
                      label="Mata uang"
                      nama={terpilih.kode}
                    />
                  </div>
                ) : (
                  <p className={styles.panelMeta}>
                    Peran Anda tidak dapat mengubah master mata uang.
                  </p>
                )}

                <hr className={styles.sectionDivider} />
                <RiwayatMaster
                  errorMessage={data.riwayatError ?? undefined}
                  riwayat={data.riwayat}
                />
              </div>
            ) : mataUangId ? (
              <div>
                <PageHeader title="Mata uang tidak ditemukan" variant="section" />
                <p className={styles.emptyState}>
                  Mata uang yang dipilih tidak tersedia.
                </p>
                <Link className={submitButtonClassName({ className: styles.secondaryButton, size: "lg", variant: "secondary" })} href={PATH_MASTER_MATA_UANG}>
                  Kembali ke daftar
                </Link>
              </div>
            ) : canManage ? (
              <>
                <PageHeader
                  description="Kode tiga huruf dan nama wajib diisi."
                  title="Tambah mata uang"
                  variant="section"
                />
                <MataUangForm />
              </>
            ) : (
              <div>
                <PageHeader title="Detail mata uang" variant="section" />
                <p className={styles.emptyState}>
                  Pilih mata uang dari daftar untuk melihat detail. Peran Anda
                  tidak dapat mengubah master mata uang.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className={styles.listPanel} aria-label="Daftar mata uang">
          <div className={styles.panelCard}>
            <PageHeader
              actions={
                canManage ? (
                  <Link
                    className={submitButtonClassName({
                      className: `${styles.primaryButton} ${styles.panelAction}`,
                      size: "lg",
                    })}
                    href={PATH_MASTER_MATA_UANG}
                  >
                    Tambah mata uang
                  </Link>
                ) : null
              }
              description={`${data.daftar.length} mata uang · Aktor: ${profile.peran ?? "—"}`}
              title="Daftar mata uang"
              variant="section"
            />

            <MasterTable
              caption="Daftar mata uang"
              emptyMessage="Belum ada mata uang. Tambahkan mata uang pertama."
              errorMessage={data.daftarError ?? undefined}
              hrefBase={PATH_MASTER_MATA_UANG}
              kolom={[{ id: "simbol", header: "Simbol" }]}
              rows={baris}
              selectedId={mataUangId}
            />
          </div>
        </section>
      </div>

      <section className={styles.section} aria-label="Kurs">
        <div className={styles.panelCard}>
          <PageHeader
            description="Satu kurs per mata uang per tanggal. Hanya mata uang aktif yang bisa dipilih."
            title="Kurs"
            variant="section"
          />

          {canManage ? (
            <KursForm
              mataUangAktif={data.mataUangAktif}
              mataUangTerpilih={terpilih?.id}
            />
          ) : null}

          {data.kursError ? (
            <Notice className={styles.messageError} tone="danger">
              Daftar kurs gagal dimuat: {data.kursError}
            </Notice>
          ) : data.kurs.length === 0 ? (
            <p className={styles.emptyState}>Belum ada kurs.</p>
          ) : (
            <table className={styles.tabelMini}>
              <caption className={styles.panelMeta}>Daftar kurs</caption>
              <thead>
                <tr>
                  <th scope="col">Tanggal</th>
                  <th scope="col">Mata uang</th>
                  <th className={styles.tabelMiniAngka} scope="col">
                    Nilai (IDR)
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.kurs.map((kurs) => (
                  <tr key={kurs.id}>
                    <td>{formatTanggal(kurs.tanggal)}</td>
                    <td>{kurs.mata_uang_kode}</td>
                    <td className={styles.tabelMiniAngka}>
                      {formatDesimal(kurs.nilai, 6)}
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
