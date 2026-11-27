import Link from "next/link";

import { StatusBadge } from "@/components/ui";
import { cekIzin } from "@/lib/auth/permissions";
import type { Profile } from "@/lib/auth/types";
import {
  formatQty,
  formatTanggal,
  formatTanggalSingkat,
  labelAksi,
  STATUS_PENERIMAAN,
} from "./format";
import common from "../permintaan/permintaan.module.css";
import { ExceptionList } from "./components/exception-list";
import { PenerimaanActions } from "./components/penerimaan-actions";
import { PenerimaanTable } from "./components/penerimaan-table";
import { TerimaForm } from "./components/terima-form";
import { PATH_PENERIMAAN } from "./constants";
import { getPenerimaanPageData, hariIniJakarta } from "./queries";
import styles from "./penerimaan.module.css";

type Props = {
  profile: Profile;
  penerimaanId?: string;
  poId?: string;
};

export async function PenerimaanScreen({ penerimaanId, poId, profile }: Props) {
  const canCatat = cekIzin(profile.peran, "catat_penerimaan");
  const canTutup = cekIzin(profile.peran, "tutup_exception_selisih");
  const data = await getPenerimaanPageData(profile.peran, { penerimaanId, poId });
  const terpilih = data.terpilih;

  const produkById = new Map(data.produk.map((item) => [item.id, item]));
  const produkNama = new Map(data.produk.map((item) => [item.id, item.nama]));
  const namaProduk = (produkId: string): string =>
    produkById.get(produkId)?.nama ?? produkId;

  const poTerpilih = poId
    ? data.poSiapTerima.find((item) => item.header.dokumenId === poId)
    : undefined;

  return (
    <section aria-label="Penerimaan barang" className={common.page}>
      <header className={common.header}>
        <div>
          <p className={common.breadcrumb}>Siklus Pengeluaran / Penerimaan Barang</p>
          <h1 className={common.title}>Penerimaan barang</h1>
          <p className={common.description}>
            Catat barang yang datang untuk PO yang sudah terbit. Penerimaan belum
            menambah stok dan belum membuat jurnal; keduanya terjadi setelah QC.
          </p>
        </div>
      </header>

      <div className={common.layout}>
        <div>
          <section className={common.listPanel} aria-labelledby="daftar-penerimaan">
            <div className={common.panelCard}>
              <div className={common.panelHeader}>
                <div>
                  <h2 className={common.panelTitle} id="daftar-penerimaan">
                    Daftar penerimaan
                  </h2>
                  <p className={common.panelMeta}>
                    {data.daftar.length} dokumen · Aktor: {profile.peran ?? "—"}
                  </p>
                </div>
              </div>
              <PenerimaanTable
                errorMessage={data.error ?? undefined}
                rows={data.daftar}
                selectedId={penerimaanId}
              />
            </div>
          </section>

          <section aria-labelledby="po-terima" style={{ marginTop: "var(--space-6)" }}>
            <div className={common.panelCard}>
              <div className={common.panelHeader}>
                <div>
                  <h2 className={common.panelTitle} id="po-terima">
                    PO siap diterima
                  </h2>
                  <p className={common.panelMeta}>
                    {data.poSiapTerima.length} PO dengan sisa qty
                  </p>
                </div>
              </div>

              {data.poSiapTerima.length === 0 ? (
                <p className={common.emptyState}>
                  Tidak ada PO yang menunggu penerimaan.
                </p>
              ) : (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <caption className={styles.caption}>
                      Pilih PO untuk mencatat penerimaan.
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">Nomor</th>
                        <th scope="col">Tanggal</th>
                        <th scope="col">Pemasok</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.poSiapTerima.map((row) => (
                        <tr key={row.header.dokumenId}>
                          <th scope="row">
                            <Link
                              className={common.tableLink}
                              href={`${PATH_PENERIMAAN}?po=${row.header.dokumenId}`}
                            >
                              {row.header.nomor}
                            </Link>
                          </th>
                          <td>{formatTanggalSingkat(row.header.tanggal)}</td>
                          <td>{row.header.pemasokNama}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          <section aria-labelledby="exception-terbuka" style={{ marginTop: "var(--space-6)" }}>
            <div className={common.panelCard}>
              <div className={common.panelHeader}>
                <div>
                  <h2 className={common.panelTitle} id="exception-terbuka">
                    Exception qty
                  </h2>
                  <p className={common.panelMeta}>
                    {data.exception.length} exception terbuka
                  </p>
                </div>
              </div>
              <ExceptionList
                bisaTutup={canTutup}
                exception={data.exception}
                produkNama={produkNama}
              />
            </div>
          </section>
        </div>

        <section className={common.panel} aria-label="Detail penerimaan">
          <div className={common.panelCard}>
            {poTerpilih ? (
              <>
                <header className={common.detailHeader}>
                  <div>
                    <h2 className={common.detailNumber}>
                      {poTerpilih.header.nomor}
                    </h2>
                    <p className={common.detailSubtitle}>
                      {poTerpilih.header.pemasokNama} ·{" "}
                      {formatTanggalSingkat(poTerpilih.header.tanggal)}
                    </p>
                  </div>
                  <StatusBadge
                    status={poTerpilih.header.status}
                    statuses={[
                      { value: "DITERBITKAN", label: "PO terbit", tone: "info" },
                      {
                        value: "DITERIMA_SEBAGIAN",
                        label: "Diterima sebagian",
                        tone: "warning",
                      },
                    ]}
                  />
                </header>

                {canCatat ? (
                  <TerimaForm
                    baris={poTerpilih.items.map((item) => ({
                      poItemId: item.poItemId,
                      produkId: item.produkId,
                      label: namaProduk(item.produkId),
                      qtyPo: item.qtyPo,
                      sisa: item.sisa,
                    }))}
                    gudang={data.gudang.map((item) => ({ id: item.id, nama: item.nama }))}
                    poId={poTerpilih.header.dokumenId}
                    poNomor={poTerpilih.header.nomor}
                    tanggal={hariIniJakarta()}
                    versiPo={poTerpilih.header.versi}
                  />
                ) : (
                  <p className={common.emptyState}>
                    Hanya Gudang yang dapat mencatat penerimaan.
                  </p>
                )}
              </>
            ) : terpilih ? (
              <>
                <header className={common.detailHeader}>
                  <div>
                    <h2 className={common.detailNumber}>{terpilih.header.nomor}</h2>
                    <p className={common.detailSubtitle}>
                      {terpilih.header.poNomor ?? "PO"} ·{" "}
                      {formatTanggalSingkat(terpilih.header.tanggal)} ·{" "}
                      {terpilih.header.gudangNama}
                    </p>
                  </div>
                  <StatusBadge
                    status={terpilih.header.status}
                    statuses={STATUS_PENERIMAAN}
                  />
                </header>

                <dl className={common.details}>
                  <div className={common.detailItem}>
                    <dt className={common.detailLabel}>Jenis penerimaan</dt>
                    <dd className={common.detailValue}>
                      {terpilih.header.jenis === "PENUH" ? "Penuh" : "Sebagian"}
                    </dd>
                  </div>
                  <div className={common.detailItem}>
                    <dt className={common.detailLabel}>Gudang tujuan</dt>
                    <dd className={common.detailValue}>
                      {terpilih.header.gudangNama}
                    </dd>
                  </div>
                </dl>

                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <caption className={styles.caption}>
                      Qty diterima dan qty lulus QC per baris.
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">Barang</th>
                        <th scope="col">Qty PO</th>
                        <th scope="col">Diterima</th>
                        <th scope="col">Lulus QC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {terpilih.items.map((item) => (
                        <tr key={item.id}>
                          <th scope="row">{namaProduk(item.produkId)}</th>
                          <td className={styles.nominal}>{formatQty(item.qtyPo)}</td>
                          <td className={styles.nominal}>
                            {formatQty(item.qtyDiterima)}
                          </td>
                          <td className={styles.nominal}>
                            {item.qtyLulus === null ? "Belum" : formatQty(item.qtyLulus)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {canCatat && terpilih.bisaDibatalkan ? (
                  <PenerimaanActions
                    dokumenId={terpilih.header.dokumenId}
                    versi={terpilih.header.versi}
                  />
                ) : null}

                <hr className={common.sectionDivider} />

                <section aria-labelledby="riwayat-penerimaan">
                  <h3 className={common.panelTitle} id="riwayat-penerimaan">
                    Riwayat status
                  </h3>
                  {terpilih.riwayat.length === 0 ? (
                    <p className={common.emptyState}>Belum ada riwayat.</p>
                  ) : (
                    <ol className={common.historyList}>
                      {terpilih.riwayat.map((item) => (
                        <li className={common.historyItem} key={item.id}>
                          <span className={common.historyAction}>
                            {labelAksi(item.aksi)} · {item.status_asal ?? "—"} →{" "}
                            {item.status_tujuan}
                          </span>
                          <span className={common.historyMeta}>
                            {formatTanggal(item.created_at)}
                            {item.alasan ? ` · ${item.alasan}` : ""}
                          </span>
                        </li>
                      ))}
                    </ol>
                  )}
                </section>
              </>
            ) : penerimaanId || poId ? (
              <div>
                <h2 className={common.panelTitle}>Dokumen tidak ditemukan</h2>
                <p className={common.emptyState}>
                  Penerimaan atau PO tidak tersedia.
                </p>
                <Link className={common.secondaryButton} href={PATH_PENERIMAAN}>
                  Kembali ke daftar
                </Link>
              </div>
            ) : (
              <p className={common.emptyState}>
                Pilih penerimaan untuk melihat detail, atau pilih PO siap diterima
                untuk mencatat penerimaan baru.
              </p>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
