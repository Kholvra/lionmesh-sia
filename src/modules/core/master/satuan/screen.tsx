import Link from "next/link";

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
      <header className={styles.header}>
        <div>
          <p className={styles.breadcrumb}>Pengaturan / Master data</p>
          <h1 className={styles.title}>Satuan</h1>
          <p className={styles.description}>
            Satuan dasar dan konversi antar satuan. Konversi hanya dicatat antara
            dua satuan aktif.
          </p>
        </div>
      </header>

      <div className={styles.layout}>
        <section className={styles.panel} aria-label="Detail satuan">
          <div className={styles.panelCard}>
            {terpilih && tampilkanFormUbah ? (
              <>
                <div className={styles.panelHeader}>
                  <div>
                    <h2 className={styles.panelTitle}>Ubah satuan</h2>
                    <p className={styles.panelMeta}>{terpilih.kode}</p>
                  </div>
                </div>
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
                      className={styles.secondaryButton}
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
                <h2 className={styles.panelTitle}>Satuan tidak ditemukan</h2>
                <p className={styles.emptyState}>
                  Satuan yang dipilih tidak tersedia.
                </p>
                <Link className={styles.secondaryButton} href={PATH_MASTER_SATUAN}>
                  Kembali ke daftar
                </Link>
              </div>
            ) : canManage ? (
              <>
                <div className={styles.panelHeader}>
                  <div>
                    <h2 className={styles.panelTitle}>Tambah satuan</h2>
                    <p className={styles.panelMeta}>Kode dan nama wajib diisi.</p>
                  </div>
                </div>
                <SatuanForm />
              </>
            ) : (
              <div>
                <h2 className={styles.panelTitle}>Detail satuan</h2>
                <p className={styles.emptyState}>
                  Pilih satuan dari daftar untuk melihat detail. Peran Anda tidak
                  dapat mengubah master satuan.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className={styles.listPanel} aria-labelledby="daftar-satuan">
          <div className={styles.panelCard}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle} id="daftar-satuan">
                  Daftar satuan
                </h2>
                <p className={styles.panelMeta}>
                  {data.daftar.length} satuan · Aktor: {profile.peran ?? "—"}
                </p>
              </div>
              {canManage ? (
                <Link
                  className={`${styles.primaryButton} ${styles.panelAction}`}
                  href={PATH_MASTER_SATUAN}
                >
                  Tambah satuan
                </Link>
              ) : null}
            </div>

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

      <section className={styles.section} aria-labelledby="konversi-satuan">
        <div className={styles.panelCard}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.panelTitle} id="konversi-satuan">
                Konversi satuan
              </h2>
              <p className={styles.panelMeta}>
                Faktor menyatakan berapa satuan tujuan dalam satu satuan asal.
              </p>
            </div>
          </div>

          {canManage ? <KonversiSatuanForm satuanAktif={data.satuanAktif} /> : null}

          {data.konversiError ? (
            <p className={styles.messageError} role="alert">
              Daftar konversi gagal dimuat: {data.konversiError}
            </p>
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
