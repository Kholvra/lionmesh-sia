import Link from "next/link";

import { StatusBadge } from "@/components/ui";
import type { Profile } from "@/lib/auth/types";
import { cekIzin } from "@/lib/auth/permissions";
import { formatRupiah } from "@/lib/format/number";
import { PermintaanActions } from "./components/permintaan-actions";
import { PermintaanForm } from "./components/permintaan-form";
import { PermintaanTable } from "./components/permintaan-table";
import { PATH_PERMINTAAN } from "./constants";
import {
  formatQty,
  formatTanggal,
  formatTanggalSingkat,
  labelAksi,
  STATUS_PERMINTAAN,
} from "./format";
import styles from "./permintaan.module.css";
import { getPermintaanPageData } from "./queries";

type Props = {
  profile: Profile;
  permintaanId?: string;
  mode?: string;
};

export async function PermintaanScreen({ mode, permintaanId, profile }: Props) {
  const canAjukan = cekIzin(profile.peran, "ajukan_pr");
  const canPeriksa = cekIzin(profile.peran, "periksa_pr");
  const canSetujui = cekIzin(profile.peran, "setujui_pr");
  const data = await getPermintaanPageData(profile.peran, permintaanId);
  const terpilih = data.terpilih;

  const produkById = new Map(data.produk.map((item) => [item.id, item]));
  const satuanById = new Map(data.satuan.map((item) => [item.id, item]));
  const gudangById = new Map(data.gudang.map((item) => [item.id, item]));

  const tampilkanForm = canAjukan && (mode === "baru" || !terpilih);

  return (
    <section aria-label="Permintaan pembelian" className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.breadcrumb}>Siklus Pengeluaran / Permintaan Pembelian</p>
          <h1 className={styles.title}>Permintaan pembelian</h1>
          <p className={styles.description}>
            Ajukan kebutuhan barang dari Gudang atau Produksi. Purchasing memeriksa
            antrean, lalu meneruskan permintaan untuk persetujuan.
          </p>
        </div>
      </header>

      <div className={styles.layout}>
        <section className={styles.listPanel} aria-labelledby="daftar-permintaan">
          <div className={styles.panelCard}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle} id="daftar-permintaan">
                  Antrean permintaan
                </h2>
                <p className={styles.panelMeta}>
                  {data.daftar.length} permintaan · Aktor: {profile.peran ?? "—"}
                </p>
              </div>
              {canAjukan ? (
                <Link
                  className={styles.primaryButton}
                  href={`${PATH_PERMINTAAN}?mode=baru`}
                >
                  Tambah permintaan
                </Link>
              ) : null}
            </div>

            <PermintaanTable
              errorMessage={data.error ?? undefined}
              rows={data.daftar}
              selectedId={permintaanId}
            />
          </div>
        </section>

        <section className={styles.panel} aria-label="Detail permintaan">
          <div className={styles.panelCard}>
            {tampilkanForm ? (
              <>
                <div className={styles.panelHeader}>
                  <div>
                    <h2 className={styles.panelTitle}>Tambah permintaan</h2>
                    <p className={styles.panelMeta}>
                      Nomor dokumen dibuat otomatis oleh core.
                    </p>
                  </div>
                </div>
                <PermintaanForm
                  gudang={data.gudang}
                  peran={profile.peran}
                  produk={data.produk}
                  satuan={data.satuan}
                />
              </>
            ) : terpilih ? (
              <>
                <header className={styles.detailHeader}>
                  <div>
                    <h2 className={styles.detailNumber}>{terpilih.header.nomor}</h2>
                    <p className={styles.detailSubtitle}>
                      Diajukan oleh {terpilih.header.pemohonNama} ·{" "}
                      {formatTanggal(terpilih.header.createdAt)}
                    </p>
                  </div>
                  <StatusBadge
                    status={terpilih.header.status}
                    statuses={STATUS_PERMINTAAN}
                  />
                </header>

                <dl className={styles.details}>
                  <div className={styles.detailItem}>
                    <dt className={styles.detailLabel}>Gudang tujuan</dt>
                    <dd className={styles.detailValue}>
                      {gudangById.get(terpilih.header.gudangId)?.nama ?? "—"}
                    </dd>
                  </div>
                  <div className={styles.detailItem}>
                    <dt className={styles.detailLabel}>Tanggal butuh</dt>
                    <dd className={styles.detailValue}>
                      {formatTanggalSingkat(terpilih.header.tanggalButuh)}
                    </dd>
                  </div>
                  <div className={styles.detailItem}>
                    <dt className={styles.detailLabel}>Referensi produksi</dt>
                    <dd className={styles.detailValue}>
                      {terpilih.header.woId ?? "—"}
                    </dd>
                  </div>
                  <div className={styles.detailItem}>
                    <dt className={styles.detailLabel}>Estimasi nilai</dt>
                    <dd className={styles.detailValue}>
                      {terpilih.header.nominal === null
                        ? "Belum diisi"
                        : formatRupiah(terpilih.header.nominal)}
                    </dd>
                  </div>
                  <div className={styles.detailItem}>
                    <dt className={styles.detailLabel}>Keterangan</dt>
                    <dd className={styles.detailValue}>
                      {terpilih.header.keterangan ?? "—"}
                    </dd>
                  </div>
                </dl>

                <ul className={styles.itemList} aria-label="Barang yang diminta">
                  {terpilih.detail.map((item) => (
                    <li className={styles.itemRow} key={item.id}>
                      <span className={styles.itemName}>
                        {produkById.get(item.produk_id)?.nama ?? item.produk_id}
                      </span>
                      <span className={styles.itemQty}>
                        {formatQty(item.qty)} {satuanById.get(item.satuan_id)?.kode ?? ""}
                      </span>
                    </li>
                  ))}
                </ul>

                <PermintaanActions
                  actorId={profile.id}
                  canAjukan={canAjukan}
                  canPeriksa={canPeriksa}
                  canSetujui={canSetujui}
                  permintaan={terpilih.header}
                />

                <hr className={styles.sectionDivider} />

                <section aria-labelledby="riwayat-permintaan">
                  <h3 className={styles.panelTitle} id="riwayat-permintaan">
                    Riwayat status
                  </h3>
                  {terpilih.riwayat.length === 0 ? (
                    <p className={styles.emptyState}>Belum ada riwayat.</p>
                  ) : (
                    <ol className={styles.historyList}>
                      {terpilih.riwayat.map((item) => (
                        <li className={styles.historyItem} key={item.id}>
                          <span className={styles.historyAction}>
                            {labelAksi(item.aksi)} · {item.status_asal ?? "—"} →{" "}
                            {item.status_tujuan}
                            {item.level !== null ? ` · jenjang ${item.level}` : ""}
                          </span>
                          <span className={styles.historyMeta}>
                            {formatTanggal(item.created_at)}
                            {item.alasan ? ` · ${item.alasan}` : ""}
                          </span>
                        </li>
                      ))}
                    </ol>
                  )}
                </section>
              </>
            ) : permintaanId ? (
              <div>
                <h2 className={styles.panelTitle}>Permintaan tidak ditemukan</h2>
                <p className={styles.emptyState}>
                  Permintaan tidak tersedia atau bukan milik Anda.
                </p>
                <Link className={styles.secondaryButton} href={PATH_PERMINTAAN}>
                  Kembali ke antrean
                </Link>
              </div>
            ) : (
              <p className={styles.emptyState}>
                Pilih permintaan dari antrean untuk melihat detail. Peran Anda tidak
                dapat mengajukan permintaan baru.
              </p>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
