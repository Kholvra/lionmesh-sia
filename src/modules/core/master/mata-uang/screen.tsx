import Link from "next/link";

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
      <header className={styles.header}>
        <div>
          <p className={styles.breadcrumb}>Pengaturan / Master data</p>
          <h1 className={styles.title}>Mata uang dan kurs</h1>
          <p className={styles.description}>
            Mata uang dan kurs disimpan sebagai master. Dokumen dan jurnal baru
            tetap dalam IDR (D-38).
          </p>
        </div>
      </header>

      <div className={styles.layout}>
        <section className={styles.panel} aria-label="Detail mata uang">
          <div className={styles.panelCard}>
            {terpilih && tampilkanFormUbah ? (
              <>
                <div className={styles.panelHeader}>
                  <div>
                    <h2 className={styles.panelTitle}>Ubah mata uang</h2>
                    <p className={styles.panelMeta}>{terpilih.kode}</p>
                  </div>
                </div>
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
                      className={styles.secondaryButton}
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
                <h2 className={styles.panelTitle}>Mata uang tidak ditemukan</h2>
                <p className={styles.emptyState}>
                  Mata uang yang dipilih tidak tersedia.
                </p>
                <Link
                  className={styles.secondaryButton}
                  href={PATH_MASTER_MATA_UANG}
                >
                  Kembali ke daftar
                </Link>
              </div>
            ) : canManage ? (
              <>
                <div className={styles.panelHeader}>
                  <div>
                    <h2 className={styles.panelTitle}>Tambah mata uang</h2>
                    <p className={styles.panelMeta}>
                      Kode tiga huruf dan nama wajib diisi.
                    </p>
                  </div>
                </div>
                <MataUangForm />
              </>
            ) : (
              <div>
                <h2 className={styles.panelTitle}>Detail mata uang</h2>
                <p className={styles.emptyState}>
                  Pilih mata uang dari daftar untuk melihat detail. Peran Anda
                  tidak dapat mengubah master mata uang.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className={styles.listPanel} aria-labelledby="daftar-mata-uang">
          <div className={styles.panelCard}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle} id="daftar-mata-uang">
                  Daftar mata uang
                </h2>
                <p className={styles.panelMeta}>
                  {data.daftar.length} mata uang · Aktor: {profile.peran ?? "—"}
                </p>
              </div>
              {canManage ? (
                <Link
                  className={`${styles.primaryButton} ${styles.panelAction}`}
                  href={PATH_MASTER_MATA_UANG}
                >
                  Tambah mata uang
                </Link>
              ) : null}
            </div>

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

      <section className={styles.section} aria-labelledby="daftar-kurs">
        <div className={styles.panelCard}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.panelTitle} id="daftar-kurs">
                Kurs
              </h2>
              <p className={styles.panelMeta}>
                Satu kurs per mata uang per tanggal. Hanya mata uang aktif yang
                bisa dipilih.
              </p>
            </div>
          </div>

          {canManage ? (
            <KursForm
              mataUangAktif={data.mataUangAktif}
              mataUangTerpilih={terpilih?.id}
            />
          ) : null}

          {data.kursError ? (
            <p className={styles.messageError} role="alert">
              Daftar kurs gagal dimuat: {data.kursError}
            </p>
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
