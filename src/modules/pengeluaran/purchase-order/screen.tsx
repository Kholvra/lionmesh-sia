import Link from "next/link";

import { StatusBadge } from "@/components/ui";
import { cekIzin } from "@/lib/auth/permissions";
import type { Profile } from "@/lib/auth/types";
import { formatRupiah } from "@/lib/format/number";
import {
  formatQty,
  formatTanggal,
  formatTanggalSingkat,
  labelAksi,
  STATUS_PO,
} from "./format";
import common from "../permintaan/permintaan.module.css";
import { barisDariPermintaan, hitungTotalPo } from "./baris";
import { PoActions } from "./components/po-actions";
import { PoForm } from "./components/po-form";
import { PoTable } from "./components/po-table";
import { PATH_PO } from "./constants";
import { getPoPageData, hariIniJakarta } from "./queries";
import styles from "./purchase-order.module.css";

type Props = {
  profile: Profile;
  poId?: string;
  permintaanId?: string;
};

export async function PoScreen({ permintaanId, poId, profile }: Props) {
  const canKelola = cekIzin(profile.peran, "pilih_pemasok_po");
  const data = await getPoPageData(profile.peran, { poId, permintaanId });
  const terpilih = data.terpilih;

  const produkById = new Map(data.produk.map((item) => [item.id, item]));
  const satuanById = new Map(data.satuan.map((item) => [item.id, item]));

  const namaProduk = (produkId: string): string =>
    produkById.get(produkId)?.nama ?? produkId;
  const namaSatuan = (satuanId: string): string =>
    satuanById.get(satuanId)?.kode ?? "";

  const permintaan = data.permintaan;
  const barisForm =
    permintaan && permintaan.pemasokTerpilihId
      ? barisDariPermintaan(
          permintaan.items,
          permintaan.penawaran,
          permintaan.pemasokTerpilihId,
        ).map((row) => {
          const item = permintaan.items.find((entry) => entry.id === row.itemId);
          return {
            itemId: row.itemId,
            label: namaProduk(row.produkId),
            satuan: item ? namaSatuan(item.satuan_id) : "",
            qty: row.qty,
            harga: row.harga,
          };
        })
      : [];

  const bisaBatalkan =
    canKelola && terpilih?.header.status === "DITERBITKAN";

  return (
    <section aria-label="Purchase order" className={common.page}>
      <header className={common.header}>
        <div>
          <p className={common.breadcrumb}>Siklus Pengeluaran / Purchase Order</p>
          <h1 className={common.title}>Purchase order</h1>
          <p className={common.description}>
            Terbitkan PO dari permintaan yang pemasoknya sudah ditetapkan, catat
            konfirmasi pemasok, dan batalkan sebelum ada penerimaan.
          </p>
        </div>
      </header>

      <div className={common.layout}>
        <div>
          <section className={common.listPanel} aria-labelledby="daftar-po">
            <div className={common.panelCard}>
              <div className={common.panelHeader}>
                <div>
                  <h2 className={common.panelTitle} id="daftar-po">
                    Daftar purchase order
                  </h2>
                  <p className={common.panelMeta}>
                    {data.daftar.length} PO · Aktor: {profile.peran ?? "—"}
                  </p>
                </div>
              </div>
              <PoTable
                errorMessage={data.error ?? undefined}
                rows={data.daftar}
                selectedId={poId}
              />
            </div>
          </section>

          <section aria-labelledby="siap-po" style={{ marginTop: "var(--space-6)" }}>
            <div className={common.panelCard}>
              <div className={common.panelHeader}>
                <div>
                  <h2 className={common.panelTitle} id="siap-po">
                    Permintaan siap diterbitkan
                  </h2>
                  <p className={common.panelMeta}>
                    {data.siapDiterbitkan.length} permintaan · status pemasok
                    ditetapkan
                  </p>
                </div>
              </div>

              {data.siapDiterbitkan.length === 0 ? (
                <p className={common.emptyState}>
                  Belum ada permintaan yang pemasoknya sudah ditetapkan.
                </p>
              ) : (
                <div className={styles.lineTable}>
                  <table className={styles.table}>
                    <caption className={styles.caption}>
                      Pilih permintaan untuk menerbitkan PO.
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">Nomor</th>
                        <th scope="col">Butuh</th>
                        <th scope="col">Pemohon</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.siapDiterbitkan.map((row) => (
                        <tr key={row.dokumenId}>
                          <th scope="row">
                            <Link
                              className={common.tableLink}
                              href={`${PATH_PO}?permintaan=${row.dokumenId}`}
                            >
                              {row.nomor}
                            </Link>
                          </th>
                          <td>{formatTanggalSingkat(row.tanggalButuh)}</td>
                          <td>{row.pemohonNama}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </div>

        <section className={common.panel} aria-label="Detail purchase order">
          <div className={common.panelCard}>
            {permintaan ? (
              <>
                <header className={common.detailHeader}>
                  <div>
                    <h2 className={common.detailNumber}>
                      {permintaan.header.nomor}
                    </h2>
                    <p className={common.detailSubtitle}>
                      Terbitkan PO untuk {permintaan.pemasokTerpilihNama ?? "—"} ·
                      qty butuh {formatTanggalSingkat(permintaan.header.tanggalButuh)}
                    </p>
                  </div>
                  <StatusBadge
                    status={permintaan.header.status}
                    statuses={[
                      { value: "PEMASOK_DITETAPKAN", label: "Pemasok ditetapkan", tone: "success" },
                    ]}
                  />
                </header>

                {canKelola ? (
                  <PoForm
                    baris={barisForm}
                    nomorPermintaan={permintaan.header.nomor}
                    pemasokNama={permintaan.pemasokTerpilihNama ?? "—"}
                    permintaanId={permintaan.header.dokumenId}
                    ppnPersen={data.tarifPpn}
                    tanggal={hariIniJakarta()}
                    versi={permintaan.header.versi}
                  />
                ) : (
                  <p className={common.emptyState}>
                    Hanya Purchasing yang dapat menerbitkan PO.
                  </p>
                )}
              </>
            ) : terpilih ? (
              <>
                <header className={common.detailHeader}>
                  <div>
                    <h2 className={common.detailNumber}>{terpilih.header.nomor}</h2>
                    <p className={common.detailSubtitle}>
                      {terpilih.header.pemasokNama} ·{" "}
                      {formatTanggalSingkat(terpilih.header.tanggal)}
                      {terpilih.header.permintaanNomor
                        ? ` · dari ${terpilih.header.permintaanNomor}`
                        : ""}
                    </p>
                  </div>
                  <StatusBadge
                    status={terpilih.header.status}
                    statuses={STATUS_PO}
                  />
                </header>

                <dl className={common.details}>
                  <div className={common.detailItem}>
                    <dt className={common.detailLabel}>Total dokumen</dt>
                    <dd className={common.detailValue}>
                      {terpilih.header.nominal === null
                        ? "—"
                        : formatRupiah(terpilih.header.nominal)}
                    </dd>
                  </div>
                  <div className={common.detailItem}>
                    <dt className={common.detailLabel}>Konfirmasi pemasok</dt>
                    <dd className={common.detailValue}>
                      {terpilih.header.catatanKonfirmasi ?? "Belum dicatat"}
                    </dd>
                  </div>
                </dl>

                <div className={styles.lineTable}>
                  <table className={styles.table}>
                    <caption className={styles.caption}>
                      Barang, qty, harga net, dan PPN per baris.
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">Barang</th>
                        <th scope="col">Qty</th>
                        <th scope="col">Harga net</th>
                        <th scope="col">PPN</th>
                        <th scope="col">Jumlah</th>
                      </tr>
                    </thead>
                    <tbody>
                      {terpilih.items.map((item) => {
                        const total = hitungTotalPo(
                          [{ qty: item.qty, harga: item.harga_satuan }],
                          item.ppn_persen,
                        );
                        return (
                          <tr key={item.id}>
                            <th scope="row">{namaProduk(item.produk_id)}</th>
                            <td className={styles.nominal}>{formatQty(item.qty)}</td>
                            <td className={styles.nominal}>
                              {formatRupiah(item.harga_satuan)}
                            </td>
                            <td className={styles.nominal}>
                              {item.ppn_persen}%
                            </td>
                            <td className={styles.nominal}>
                              {formatRupiah(total.total)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {canKelola ? (
                  <PoActions
                    bisaBatalkan={bisaBatalkan}
                    catatanKonfirmasi={terpilih.header.catatanKonfirmasi}
                    dokumenId={terpilih.header.dokumenId}
                    versi={terpilih.header.versi}
                  />
                ) : null}

                <hr className={common.sectionDivider} />

                <section aria-labelledby="riwayat-po">
                  <h3 className={common.panelTitle} id="riwayat-po">
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
            ) : poId ? (
              <div>
                <h2 className={common.panelTitle}>PO tidak ditemukan</h2>
                <p className={common.emptyState}>
                  Purchase order tidak tersedia.
                </p>
                <Link className={common.secondaryButton} href={PATH_PO}>
                  Kembali ke daftar
                </Link>
              </div>
            ) : (
              <p className={common.emptyState}>
                Pilih PO untuk melihat detail, atau pilih permintaan siap
                diterbitkan untuk membuat PO baru.
              </p>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
