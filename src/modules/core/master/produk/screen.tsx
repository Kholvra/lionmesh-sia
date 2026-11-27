import Link from "next/link";

import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { submitButtonClassName } from "@/components/ui/submit-button";
import { StatusBadge } from "@/components/ui";
import { cekIzin } from "@/lib/auth/permissions";
import type { Profile } from "@/lib/auth/types";

import { KategoriProdukForm } from "../components/kategori-produk-form";
import { MasterStatusButton } from "../components/master-status-button";
import { MasterTable } from "../components/master-table";
import { ProdukForm } from "../components/produk-form";
import { RiwayatMaster } from "../components/riwayat-master";
import { PATH_MASTER_PRODUK } from "../constants";
import { labelTipe, STATUS_MASTER, statusMaster } from "../format";
import styles from "../master.module.css";
import { getProdukPageData } from "../queries";

type ProdukScreenProps = {
  profile: Profile;
  produkId?: string;
  mode?: string;
};

export async function ProdukScreen({ mode, produkId, profile }: ProdukScreenProps) {
  const canManage = cekIzin(profile.peran, "kelola_data_produk");
  const canManageKategori = cekIzin(profile.peran, "kelola_kategori_produk");
  const data = await getProdukPageData(produkId);

  const terpilih = data.terpilih;
  const tampilkanFormUbah = canManage && mode === "edit" && terpilih !== null;

  const baris = data.daftar.map((produk) => ({
    id: produk.id,
    kode: produk.kode,
    nama: produk.nama,
    aktif: produk.aktif,
    tipe: labelTipe(produk.tipe),
    satuan: produk.satuan_dasar_kode,
    kategori: produk.kategori_kode ?? "—",
  }));

  return (
    <section aria-label="Master produk" className={styles.page}>
      <PageHeader
        breadcrumb={["Pengaturan", "Master data"]}
        description="Satu daftar produk untuk semua siklus. Produk yang tidak dipakai lagi dinonaktifkan, bukan dihapus; dokumen lama tetap terbaca."
        title="Produk"
      />

      <div className={styles.layout}>
        <section className={`${styles.panel} ${styles.panelSempit}`} aria-label="Detail produk">
          <div className={styles.panelCard}>
            {terpilih && tampilkanFormUbah ? (
              <>
                <PageHeader
                  description={terpilih.kode}
                  title="Ubah produk"
                  variant="section"
                />
                <ProdukForm
                  kategori={data.kategori}
                  key={terpilih.id}
                  produk={terpilih}
                  satuanAktif={data.satuanAktif}
                />
              </>
            ) : terpilih ? (
              <div>
                <div className={styles.detailHeader}>
                  <div>
                    <h2 className={styles.detailName}>{terpilih.nama}</h2>
                    <p className={styles.detailSubtitle}>
                      {terpilih.kode} · {labelTipe(terpilih.tipe)}
                    </p>
                  </div>
                  <StatusBadge
                    status={statusMaster(terpilih.aktif)}
                    statuses={STATUS_MASTER}
                  />
                </div>

                <dl className={styles.details}>
                  <div className={styles.detailItem}>
                    <dt className={styles.detailLabel}>Satuan dasar</dt>
                    <dd className={styles.detailValue}>
                      {terpilih.satuan_dasar_kode} — {terpilih.satuan_dasar_nama}
                    </dd>
                  </div>
                  <div className={styles.detailItem}>
                    <dt className={styles.detailLabel}>Kategori</dt>
                    <dd className={styles.detailValue}>
                      {terpilih.kategori_kode
                        ? `${terpilih.kategori_kode} — ${terpilih.kategori_nama}`
                        : "Tanpa kategori"}
                    </dd>
                  </div>
                </dl>

                {canManage ? (
                  <div className={`${styles.buttonRow} ${styles.detailActions}`}>
                    <Link className={submitButtonClassName({ className: styles.secondaryButton, size: "lg", variant: "secondary" })} href={`${PATH_MASTER_PRODUK}?id=${terpilih.id}&mode=edit`}>
                      Ubah data
                    </Link>
                    <MasterStatusButton
                      aktif={terpilih.aktif}
                      entitas="produk"
                      id={terpilih.id}
                      label="Produk"
                      nama={terpilih.kode}
                    />
                  </div>
                ) : (
                  <p className={styles.panelMeta}>
                    Peran Anda tidak dapat mengubah master produk.
                  </p>
                )}

                <hr className={styles.sectionDivider} />
                <RiwayatMaster
                  errorMessage={data.riwayatError ?? undefined}
                  riwayat={data.riwayat}
                />
              </div>
            ) : produkId ? (
              <div>
                <PageHeader title="Produk tidak ditemukan" variant="section" />
                <p className={styles.emptyState}>
                  Produk yang dipilih tidak tersedia atau sudah tidak dapat
                  diakses oleh peran Anda.
                </p>
                <Link className={submitButtonClassName({ className: styles.secondaryButton, size: "lg", variant: "secondary" })} href={PATH_MASTER_PRODUK}>
                  Kembali ke daftar
                </Link>
              </div>
            ) : canManage ? (
              <>
                <PageHeader
                  description="Kode, nama, tipe, dan satuan dasar wajib diisi."
                  title="Tambah produk"
                  variant="section"
                />
                <ProdukForm
                  kategori={data.kategori}
                  satuanAktif={data.satuanAktif}
                />
              </>
            ) : (
              <div>
                <PageHeader title="Detail produk" variant="section" />
                <p className={styles.emptyState}>
                  Pilih produk dari daftar untuk melihat detail. Peran Anda tidak
                  dapat mengubah master produk.
                </p>
              </div>
            )}
          </div>
        </section>

        <section
          className={`${styles.listPanel} ${styles.panelLuas}`}
          aria-label="Daftar produk"
        >
          <div className={styles.panelCard}>
            <PageHeader
              actions={
                canManage ? (
                  <Link
                    className={submitButtonClassName({
                      className: `${styles.primaryButton} ${styles.panelAction}`,
                      size: "lg",
                    })}
                    href={PATH_MASTER_PRODUK}
                  >
                    Tambah produk
                  </Link>
                ) : null
              }
              description={`${data.daftar.length} produk · Aktor: ${profile.peran ?? "—"}`}
              title="Daftar produk"
              variant="section"
            />

            <MasterTable
              caption="Daftar produk"
              emptyMessage="Belum ada produk. Tambahkan produk pertama."
              errorMessage={data.daftarError ?? undefined}
              hrefBase={PATH_MASTER_PRODUK}
              kolom={[
                { id: "tipe", header: "Tipe" },
                { id: "satuan", header: "Satuan" },
              ]}
              rows={baris}
              selectedId={produkId}
            />
          </div>
        </section>


      </div>

      <section className={styles.section} aria-label="Kategori produk">
        <div className={styles.panelCard}>
          <PageHeader
            description="Pengelompokan produk (D-38). Kategori nonaktif tidak bisa dipasang ke produk baru."
            title="Kategori produk"
            variant="section"
          />

          {canManageKategori ? <KategoriProdukForm /> : null}

          {data.pilihanError ? (
            <Notice className={styles.messageError} tone="danger">
              Daftar kategori gagal dimuat: {data.pilihanError}
            </Notice>
          ) : data.kategori.length === 0 ? (
            <p className={styles.emptyState}>Belum ada kategori produk.</p>
          ) : (
            <table className={styles.tabelMini}>
              <caption className={styles.panelMeta}>Daftar kategori produk</caption>
              <thead>
                <tr>
                  <th scope="col">Kode</th>
                  <th scope="col">Nama</th>
                  <th scope="col">Status</th>
                  {canManageKategori ? <th scope="col">Tindakan</th> : null}
                </tr>
              </thead>
              <tbody>
                {data.kategori.map((kategori) => (
                  <tr key={kategori.id}>
                    <td>{kategori.kode}</td>
                    <td>{kategori.nama}</td>
                    <td>
                      <span className={styles.tabelMiniStatus}>
                        <StatusBadge
                          status={statusMaster(kategori.aktif)}
                          statuses={STATUS_MASTER}
                        />
                      </span>
                    </td>
                    {canManageKategori ? (
                      <td>
                        <MasterStatusButton
                          aktif={kategori.aktif}
                          entitas="kategori_produk"
                          id={kategori.id}
                          label="Kategori produk"
                          nama={kategori.kode}
                        />
                      </td>
                    ) : null}
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
