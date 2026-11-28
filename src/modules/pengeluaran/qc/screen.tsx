import Link from "next/link";

import { StatusBadge } from "@/components/ui";
import { cekIzin } from "@/lib/auth/permissions";
import type { Profile } from "@/lib/auth/types";
import { formatQty, formatTanggal, formatTanggalSingkat, labelAksi, STATUS_QC } from "./format";
import common from "../permintaan/permintaan.module.css";
import table from "../penerimaan/penerimaan.module.css";
import { LokasiForm } from "./components/lokasi-form";
import { QcForm } from "./components/qc-form";
import { PATH_QC } from "./constants";
import { getQcPageData } from "./queries";
import styles from "./qc.module.css";

type Props = {
  profile: Profile;
  penerimaanId?: string;
};

export async function QcScreen({ penerimaanId, profile }: Props) {
  const canQc = cekIzin(profile.peran, "catat_qc_bahan");
  const canGudang = cekIzin(profile.peran, "catat_pengeluaran_retur");
  const data = await getQcPageData(profile.peran, penerimaanId);
  const terpilih = data.terpilih;

  const produkById = new Map(data.produk.map((item) => [item.id, item]));
  const namaProduk = (id: string): string => produkById.get(id)?.nama ?? id;

  return (
    <section aria-label="QC bahan" className={common.page}>
      <header className={common.header}>
        <div>
          <p className={common.breadcrumb}>Siklus Pengeluaran / QC Bahan</p>
          <h1 className={common.title}>QC bahan</h1>
          <p className={common.description}>
            Catat qty lulus dan gagal per baris penerimaan. Qty lulus masuk stok dan
            jurnal dalam satu transaksi; qty gagal dipisahkan dan bisa diretur.
          </p>
        </div>
      </header>

      <div className={common.layout}>
        <section className={common.listPanel} aria-labelledby="daftar-qc">
          <div className={common.panelCard}>
            <div className={common.panelHeader}>
              <div>
                <h2 className={common.panelTitle} id="daftar-qc">
                  Penerimaan
                </h2>
                <p className={common.panelMeta}>
                  {data.daftar.length} dokumen · Aktor: {profile.peran ?? "—"}
                </p>
              </div>
            </div>

            {data.error ? (
              <p className={common.messageError} role="alert">
                {data.error}
              </p>
            ) : null}

            {data.daftar.length === 0 ? (
              <p className={common.emptyState}>Belum ada penerimaan untuk diperiksa.</p>
            ) : (
              <div className={table.tableWrap}>
                <table className={table.table}>
                  <caption className={table.caption}>
                    Pilih penerimaan untuk mencatat atau melihat hasil QC.
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Nomor</th>
                      <th scope="col">Tanggal</th>
                      <th scope="col">PO</th>
                      <th scope="col">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.daftar.map((row) => (
                      <tr key={row.dokumenId}>
                        <th scope="row">
                          <Link
                            className={common.tableLink}
                            href={`${PATH_QC}?penerimaan=${row.dokumenId}`}
                          >
                            {row.nomor}
                          </Link>
                        </th>
                        <td>{formatTanggalSingkat(row.tanggal)}</td>
                        <td>{row.poNomor ?? "—"}</td>
                        <td>
                          <StatusBadge status={row.status} statuses={STATUS_QC} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        <section className={common.panel} aria-label="Detail QC">
          <div className={common.panelCard}>
            {terpilih ? (
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
                  <StatusBadge status={terpilih.header.status} statuses={STATUS_QC} />
                </header>

                {terpilih.header.status === "DITERIMA" && canQc ? (
                  <QcForm
                    baris={terpilih.items.map((item) => ({
                      id: item.id,
                      label: namaProduk(item.produkId),
                      qtyDiterima: item.qtyDiterima,
                    }))}
                    penerimaanId={terpilih.header.dokumenId}
                    versi={terpilih.header.versi}
                  />
                ) : (
                  <>
                    <div className={table.tableWrap}>
                      <table className={table.table}>
                        <caption className={table.caption}>
                          Hasil QC per baris dan sisa qty gagal yang belum diretur.
                        </caption>
                        <thead>
                          <tr>
                            <th scope="col">Barang</th>
                            <th scope="col">Diterima</th>
                            <th scope="col">Lulus</th>
                            <th scope="col">Gagal</th>
                            <th scope="col">Gagal tersedia</th>
                          </tr>
                        </thead>
                        <tbody>
                          {terpilih.items.map((item) => {
                            const gagal =
                              item.qtyLulus === null
                                ? null
                                : Number(item.qtyDiterima) - Number(item.qtyLulus);
                            return (
                              <tr key={item.id}>
                                <th scope="row">{namaProduk(item.produkId)}</th>
                                <td className={table.nominal}>
                                  {formatQty(item.qtyDiterima)}
                                </td>
                                <td className={table.nominal}>
                                  {item.qtyLulus === null
                                    ? "—"
                                    : formatQty(item.qtyLulus)}
                                </td>
                                <td className={table.nominal}>
                                  {gagal === null ? "—" : formatQty(String(gagal))}
                                </td>
                                <td className={table.nominal}>
                                  {formatQty(item.qtyGagalTersedia)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {terpilih.header.status === "DITERIMA" && !canQc ? (
                      <p className={common.emptyState}>
                        Hanya QC yang dapat mencatat hasil pemeriksaan.
                      </p>
                    ) : null}
                  </>
                )}

                {terpilih.items.some(
                  (item) =>
                    item.qtyLulus !== null &&
                    Number(item.qtyDiterima) - Number(item.qtyLulus) > 0,
                ) && canGudang ? (
                  <section aria-labelledby="lokasi-pemisahan" className={styles.section}>
                    <h3 className={common.panelTitle} id="lokasi-pemisahan">
                      Pemisahan barang gagal
                    </h3>
                    <p className={common.panelMeta}>
                      Dicatat Gudang sebagai teks; tidak membuat mutasi stok.
                    </p>
                    {terpilih.items
                      .filter(
                        (item) =>
                          item.qtyLulus !== null &&
                          Number(item.qtyDiterima) - Number(item.qtyLulus) > 0,
                      )
                      .map((item) => (
                        <LokasiForm
                          key={item.id}
                          label={namaProduk(item.produkId)}
                          lokasi={item.lokasiPemisahan}
                          penerimaanItemId={item.id}
                          qtyGagal={String(
                            Number(item.qtyDiterima) - Number(item.qtyLulus),
                          )}
                        />
                      ))}
                  </section>
                ) : null}

                <hr className={common.sectionDivider} />

                <section aria-labelledby="riwayat-qc">
                  <h3 className={common.panelTitle} id="riwayat-qc">
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
            ) : penerimaanId ? (
              <div>
                <h2 className={common.panelTitle}>Penerimaan tidak ditemukan</h2>
                <Link className={common.secondaryButton} href={PATH_QC}>
                  Kembali ke daftar
                </Link>
              </div>
            ) : (
              <p className={common.emptyState}>
                Pilih penerimaan untuk mencatat hasil QC.
              </p>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
