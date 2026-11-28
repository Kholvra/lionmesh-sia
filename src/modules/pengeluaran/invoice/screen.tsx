import Link from "next/link";

import { StatusBadge } from "@/components/ui";
import { cekIzin } from "@/lib/auth/permissions";
import type { Profile } from "@/lib/auth/types";
import { formatRupiah } from "@/lib/format/money";
import { rupiahKeCents } from "@/modules/pengeluaran/pemasok/format";
import {
  formatTanggal,
  formatTanggalSingkat,
  labelAksi,
  STATUS_INVOICE,
} from "./format";
import common from "../permintaan/permintaan.module.css";
import table from "../penerimaan/penerimaan.module.css";
import { InvoiceActions } from "./components/invoice-actions";
import { InvoiceForm } from "./components/invoice-form";
import { PATH_INVOICE } from "./constants";
import { getInvoicePageData, hariIniJakarta } from "./queries";

type Props = {
  profile: Profile;
  invoiceId?: string;
  penerimaanId?: string;
};

export async function InvoiceScreen({ invoiceId, penerimaanId, profile }: Props) {
  const canCatat = cekIzin(profile.peran, "catat_invoice_utang");
  const canSahkan = cekIzin(profile.peran, "sahkan_pencocokan");
  const data = await getInvoicePageData(profile.peran, { invoiceId });
  const terpilih = data.terpilih;

  const produkById = new Map(data.produk.map((item) => [item.id, item]));
  const namaProduk = (id: string): string => produkById.get(id)?.nama ?? id;

  const kandidat = penerimaanId
    ? data.kandidat.find((item) => item.header.dokumenId === penerimaanId)
    : undefined;

  return (
    <section aria-label="Invoice pemasok" className={common.page}>
      <header className={common.header}>
        <div>
          <p className={common.breadcrumb}>Siklus Pengeluaran / Invoice Pemasok</p>
          <h1 className={common.title}>Invoice pemasok</h1>
          <p className={common.description}>
            Cocokkan invoice dengan PO dan qty lulus QC. Utang hanya diakui setelah
            invoice cocok dan disahkan Accounting.
          </p>
        </div>
      </header>

      <div className={common.layout}>
        <div>
          <section className={common.listPanel} aria-labelledby="daftar-invoice">
            <div className={common.panelCard}>
              <div className={common.panelHeader}>
                <div>
                  <h2 className={common.panelTitle} id="daftar-invoice">
                    Daftar invoice
                  </h2>
                  <p className={common.panelMeta}>
                    {data.daftar.length} invoice · Aktor: {profile.peran ?? "—"}
                  </p>
                </div>
              </div>

              {data.error ? (
                <p className={common.messageError} role="alert">
                  {data.error}
                </p>
              ) : null}

              {data.daftar.length === 0 ? (
                <p className={common.emptyState}>Belum ada invoice pemasok.</p>
              ) : (
                <div className={table.tableWrap}>
                  <table className={table.table}>
                    <caption className={table.caption}>
                      Pilih invoice untuk melihat hasil pencocokan dan pengesahan.
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">Nomor</th>
                        <th scope="col">Invoice</th>
                        <th scope="col">Pemasok</th>
                        <th scope="col">Total</th>
                        <th scope="col">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.daftar.map((row) => (
                        <tr key={row.dokumenId}>
                          <th scope="row">
                            <Link
                              className={common.tableLink}
                              href={`${PATH_INVOICE}?invoice=${row.dokumenId}`}
                            >
                              {row.nomor}
                            </Link>
                          </th>
                          <td>{row.nomorInvoice}</td>
                          <td>{row.pemasokNama}</td>
                          <td className={table.nominal}>{formatRupiah(rupiahKeCents(row.total))}</td>
                          <td>
                            <StatusBadge status={row.status} statuses={STATUS_INVOICE} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          <section
            aria-labelledby="penerimaan-siap-invoice"
            style={{ marginTop: "var(--space-6)" }}
          >
            <div className={common.panelCard}>
              <div className={common.panelHeader}>
                <div>
                  <h2 className={common.panelTitle} id="penerimaan-siap-invoice">
                    Penerimaan siap ditagih
                  </h2>
                  <p className={common.panelMeta}>
                    QC final dan belum punya invoice aktif.
                  </p>
                </div>
              </div>

              {data.kandidat.length === 0 ? (
                <p className={common.emptyState}>
                  Tidak ada penerimaan yang menunggu invoice.
                </p>
              ) : (
                <div className={table.tableWrap}>
                  <table className={table.table}>
                    <thead>
                      <tr>
                        <th scope="col">Penerimaan</th>
                        <th scope="col">Tanggal</th>
                        <th scope="col">Gudang</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.kandidat.map((row) => (
                        <tr key={row.header.dokumenId}>
                          <th scope="row">
                            <Link
                              className={common.tableLink}
                              href={`${PATH_INVOICE}?penerimaan=${row.header.dokumenId}`}
                            >
                              {row.header.nomor}
                            </Link>
                          </th>
                          <td>{formatTanggalSingkat(row.header.tanggal)}</td>
                          <td>{row.header.gudangNama}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </div>

        <section className={common.panel} aria-label="Detail invoice">
          <div className={common.panelCard}>
            {kandidat ? (
              <>
                <header className={common.detailHeader}>
                  <div>
                    <h2 className={common.detailNumber}>{kandidat.header.nomor}</h2>
                    <p className={common.detailSubtitle}>
                      Catat invoice untuk penerimaan ini ·{" "}
                      {formatTanggalSingkat(kandidat.header.tanggal)}
                    </p>
                  </div>
                </header>

                {canCatat ? (
                  <InvoiceForm
                    baris={kandidat.items.map((item) => ({
                      penerimaanItemId: item.penerimaanItemId,
                      label: namaProduk(item.produkId),
                      qtyLulus: item.qtyLulus,
                      hargaPo: item.hargaPo,
                    }))}
                    hariIni={hariIniJakarta()}
                    penerimaanId={kandidat.header.dokumenId}
                    penerimaanNomor={kandidat.header.nomor}
                    tarifPpn={data.tarifPpn}
                  />
                ) : (
                  <p className={common.emptyState}>
                    Hanya Accounting yang dapat mencatat invoice.
                  </p>
                )}
              </>
            ) : terpilih ? (
              <>
                <header className={common.detailHeader}>
                  <div>
                    <h2 className={common.detailNumber}>{terpilih.header.nomor}</h2>
                    <p className={common.detailSubtitle}>
                      {terpilih.header.nomorInvoice} · {terpilih.header.pemasokNama} ·{" "}
                      {terpilih.header.penerimaanNomor ?? "penerimaan"}
                    </p>
                  </div>
                  <StatusBadge
                    status={terpilih.header.status}
                    statuses={STATUS_INVOICE}
                  />
                </header>

                <dl className={common.details}>
                  <div className={common.detailItem}>
                    <dt className={common.detailLabel}>DPP</dt>
                    <dd className={common.detailValue}>
                      {formatRupiah(rupiahKeCents(terpilih.header.dppTotal))}
                    </dd>
                  </div>
                  <div className={common.detailItem}>
                    <dt className={common.detailLabel}>PPN</dt>
                    <dd className={common.detailValue}>
                      {formatRupiah(rupiahKeCents(terpilih.header.ppnNilai))}
                    </dd>
                  </div>
                  <div className={common.detailItem}>
                    <dt className={common.detailLabel}>Total</dt>
                    <dd className={common.detailValue}>
                      {formatRupiah(rupiahKeCents(terpilih.header.total))}
                    </dd>
                  </div>
                  <div className={common.detailItem}>
                    <dt className={common.detailLabel}>Jatuh tempo</dt>
                    <dd className={common.detailValue}>
                      {formatTanggalSingkat(terpilih.header.jatuhTempo)} (
                      {terpilih.header.terminHari} hari)
                    </dd>
                  </div>
                </dl>

                {terpilih.header.catatan ? (
                  <p className={common.messageError} role="status">
                    Selisih: {terpilih.header.catatan}
                  </p>
                ) : null}

                <div className={table.tableWrap}>
                  <table className={table.table}>
                    <caption className={table.caption}>
                      Qty tagih, harga DPP, dan pembanding harga PO.
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">Barang</th>
                        <th scope="col">Qty tagih</th>
                        <th scope="col">Qty lulus</th>
                        <th scope="col">Harga DPP</th>
                        <th scope="col">Harga PO</th>
                      </tr>
                    </thead>
                    <tbody>
                      {terpilih.items.map((item) => (
                        <tr key={item.id}>
                          <th scope="row">{namaProduk(item.produkId)}</th>
                          <td className={table.nominal}>{item.qty}</td>
                          <td className={table.nominal}>{item.qtyLulus}</td>
                          <td className={table.nominal}>
                            {formatRupiah(rupiahKeCents(item.hargaSatuanDpp))}
                          </td>
                          <td className={table.nominal}>{formatRupiah(rupiahKeCents(item.hargaPo))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <InvoiceActions
                  baris={terpilih.items.map((item) => ({
                    penerimaanItemId: item.penerimaanItemId,
                    label: namaProduk(item.produkId),
                    qty: item.qty,
                    hargaSatuanDpp: item.hargaSatuanDpp,
                    qtyLulus: item.qtyLulus,
                  }))}
                  bisaBatal={canCatat}
                  bisaKoreksi={canCatat}
                  bisaSahkan={canSahkan}
                  dokumenId={terpilih.header.dokumenId}
                  ppnNilai={terpilih.header.ppnNilai}
                  status={terpilih.header.status}
                  versi={terpilih.header.versi}
                />

                <hr className={common.sectionDivider} />

                <section aria-labelledby="riwayat-invoice">
                  <h3 className={common.panelTitle} id="riwayat-invoice">
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
            ) : invoiceId || penerimaanId ? (
              <div>
                <h2 className={common.panelTitle}>Dokumen tidak ditemukan</h2>
                <Link className={common.secondaryButton} href={PATH_INVOICE}>
                  Kembali ke daftar
                </Link>
              </div>
            ) : (
              <p className={common.emptyState}>
                Pilih invoice untuk melihat detail, atau pilih penerimaan siap ditagih
                untuk mencatat invoice baru.
              </p>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
