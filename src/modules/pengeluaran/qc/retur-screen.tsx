import Link from "next/link";

import { StatusBadge } from "@/components/ui";
import { cekIzin } from "@/lib/auth/permissions";
import type { Profile } from "@/lib/auth/types";
import {
  formatQty,
  formatTanggal,
  formatTanggalSingkat,
  labelAksi,
  STATUS_RETUR,
} from "./format";
import common from "../permintaan/permintaan.module.css";
import table from "../penerimaan/penerimaan.module.css";
import { ReturActions } from "./components/retur-actions";
import { ReturForm } from "./components/retur-form";
import { PATH_RETUR } from "./constants";
import { getReturPageData } from "./queries";

type Props = {
  profile: Profile;
  returId?: string;
  penerimaanId?: string;
};

export async function ReturScreen({ penerimaanId, profile, returId }: Props) {
  const canAjukan = cekIzin(profile.peran, "ajukan_retur_pemasok");
  const canPutuskan = cekIzin(profile.peran, "setujui_retur_pemasok");
  const data = await getReturPageData(profile.peran, { returId, penerimaanId });

  const produkById = new Map(data.produk.map((item) => [item.id, item]));
  const namaProduk = (id: string): string => produkById.get(id)?.nama ?? id;
  const terpilih = data.terpilih;
  const dipilih = data.penerimaan;

  return (
    <section aria-label="Retur pemasok" className={common.page}>
      <header className={common.header}>
        <div>
          <p className={common.breadcrumb}>Siklus Pengeluaran / Retur Pemasok</p>
          <h1 className={common.title}>Retur pemasok</h1>
          <p className={common.description}>
            Ajukan pengembalian bahan yang gagal QC. Retur tidak mengubah stok,
            jurnal, atau utang; hanya jejak keputusan pengembalian.
          </p>
        </div>
      </header>

      <div className={common.layout}>
        <div>
          <section className={common.listPanel} aria-labelledby="daftar-retur">
            <div className={common.panelCard}>
              <div className={common.panelHeader}>
                <div>
                  <h2 className={common.panelTitle} id="daftar-retur">
                    Daftar retur
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
                <p className={common.emptyState}>Belum ada retur pemasok.</p>
              ) : (
                <div className={table.tableWrap}>
                  <table className={table.table}>
                    <caption className={table.caption}>
                      Pilih retur untuk melihat detail dan keputusan.
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">Nomor</th>
                        <th scope="col">Penerimaan</th>
                        <th scope="col">Pemasok</th>
                        <th scope="col">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.daftar.map((row) => (
                        <tr key={row.dokumenId}>
                          <th scope="row">
                            <Link
                              className={common.tableLink}
                              href={`${PATH_RETUR}?retur=${row.dokumenId}`}
                            >
                              {row.nomor}
                            </Link>
                          </th>
                          <td>{row.penerimaanNomor ?? "—"}</td>
                          <td>{row.pemasokNama}</td>
                          <td>
                            <StatusBadge status={row.status} statuses={STATUS_RETUR} />
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
            aria-labelledby="penerimaan-gagal"
            style={{ marginTop: "var(--space-6)" }}
          >
            <div className={common.panelCard}>
              <div className={common.panelHeader}>
                <div>
                  <h2 className={common.panelTitle} id="penerimaan-gagal">
                    Penerimaan dengan hasil QC
                  </h2>
                  <p className={common.panelMeta}>
                    Pilih penerimaan untuk mengajukan retur atas qty gagal.
                  </p>
                </div>
              </div>

              {data.kandidat.length === 0 ? (
                <p className={common.emptyState}>
                  Belum ada penerimaan yang selesai QC.
                </p>
              ) : (
                <div className={table.tableWrap}>
                  <table className={table.table}>
                    <thead>
                      <tr>
                        <th scope="col">Nomor</th>
                        <th scope="col">Tanggal</th>
                        <th scope="col">Status QC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.kandidat.map((row) => (
                        <tr key={row.dokumenId}>
                          <th scope="row">
                            <Link
                              className={common.tableLink}
                              href={`${PATH_RETUR}?penerimaan=${row.dokumenId}`}
                            >
                              {row.nomor}
                            </Link>
                          </th>
                          <td>{formatTanggalSingkat(row.tanggal)}</td>
                          <td>
                            <StatusBadge status={row.status} statuses={STATUS_RETUR} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </div>

        <section className={common.panel} aria-label="Detail retur">
          <div className={common.panelCard}>
            {dipilih ? (
              <>
                <header className={common.detailHeader}>
                  <div>
                    <h2 className={common.detailNumber}>{dipilih.header.nomor}</h2>
                    <p className={common.detailSubtitle}>
                      Ajukan retur untuk {dipilih.header.poNomor ?? "penerimaan"} ·{" "}
                      {formatTanggalSingkat(dipilih.header.tanggal)}
                    </p>
                  </div>
                </header>

                {canAjukan ? (
                  <ReturForm
                    baris={dipilih.items.map((item) => ({
                      penerimaanItemId: item.id,
                      label: namaProduk(item.produkId),
                      qtyGagalTersedia: item.qtyGagalTersedia,
                    }))}
                    penerimaanId={dipilih.header.dokumenId}
                  />
                ) : (
                  <p className={common.emptyState}>
                    Hanya Purchasing yang dapat mengajukan retur.
                  </p>
                )}
              </>
            ) : terpilih ? (
              <>
                <header className={common.detailHeader}>
                  <div>
                    <h2 className={common.detailNumber}>{terpilih.header.nomor}</h2>
                    <p className={common.detailSubtitle}>
                      {terpilih.header.penerimaanNomor ?? "Penerimaan"} ·{" "}
                      {terpilih.header.pemasokNama}
                    </p>
                  </div>
                  <StatusBadge
                    status={terpilih.header.status}
                    statuses={STATUS_RETUR}
                  />
                </header>

                <dl className={common.details}>
                  <div className={common.detailItem}>
                    <dt className={common.detailLabel}>Alasan retur</dt>
                    <dd className={common.detailValue}>
                      {terpilih.header.alasan ?? "—"}
                    </dd>
                  </div>
                  <div className={common.detailItem}>
                    <dt className={common.detailLabel}>Diajukan</dt>
                    <dd className={common.detailValue}>
                      {formatTanggal(terpilih.header.createdAt)}
                    </dd>
                  </div>
                </dl>

                <div className={table.tableWrap}>
                  <table className={table.table}>
                    <caption className={table.caption}>
                      Qty retur per barang gagal.
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">Barang</th>
                        <th scope="col">Qty retur</th>
                      </tr>
                    </thead>
                    <tbody>
                      {terpilih.items.map((item) => (
                        <tr key={item.id}>
                          <th scope="row">{namaProduk(item.produkId)}</th>
                          <td className={table.nominal}>{formatQty(item.qty)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <ReturActions
                  bisaBatal={canAjukan}
                  bisaPutuskan={canPutuskan}
                  dokumenId={terpilih.header.dokumenId}
                  status={terpilih.header.status}
                  versi={terpilih.header.versi}
                />

                <hr className={common.sectionDivider} />

                <section aria-labelledby="riwayat-retur">
                  <h3 className={common.panelTitle} id="riwayat-retur">
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
            ) : returId || penerimaanId ? (
              <div>
                <h2 className={common.panelTitle}>Dokumen tidak ditemukan</h2>
                <Link className={common.secondaryButton} href={PATH_RETUR}>
                  Kembali ke daftar
                </Link>
              </div>
            ) : (
              <p className={common.emptyState}>
                Pilih retur untuk melihat detail, atau pilih penerimaan untuk
                mengajukan retur baru.
              </p>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
