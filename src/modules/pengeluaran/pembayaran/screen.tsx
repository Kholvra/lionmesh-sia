import Link from "next/link";

import { StatusBadge } from "@/components/ui";
import { cekIzin } from "@/lib/auth/permissions";
import type { Profile } from "@/lib/auth/types";
import { formatRupiah } from "@/lib/format/number";
import {
  formatTanggal,
  formatTanggalSingkat,
  labelAksi,
  STATUS_BAYAR,
} from "./format";
import common from "../permintaan/permintaan.module.css";
import table from "../penerimaan/penerimaan.module.css";
import { CatatPembayaranForm } from "./components/catat-form";
import { PembayaranActions } from "./components/pembayaran-actions";
import { PATH_BAYAR } from "./constants";
import { getBayarPageData, hariIniJakarta } from "./queries";

type Props = {
  profile: Profile;
  bayarId?: string;
  pemasokId?: string;
};

export async function PembayaranScreen({ bayarId, pemasokId, profile }: Props) {
  const canCatat = cekIzin(profile.peran, "bayar_pemasok");
  const canVerifikasi = cekIzin(profile.peran, "verifikasi_pembayaran_pemasok");
  const data = await getBayarPageData(profile.peran, { bayarId });
  const terpilih = data.terpilih;

  const utangPerPemasok = new Map<
    string,
    { id: string; nama: string; sisa: number; jumlahInvoice: number }
  >();
  for (const row of data.utang) {
    const current = utangPerPemasok.get(row.pemasokId) ?? {
      id: row.pemasokId,
      nama: row.pemasokNama,
      sisa: 0,
      jumlahInvoice: 0,
    };
    current.sisa += Number(row.sisa);
    current.jumlahInvoice += 1;
    utangPerPemasok.set(row.pemasokId, current);
  }
  const pemasokUtang = [...utangPerPemasok.values()];

  return (
    <section aria-label="Pembayaran pemasok" className={common.page}>
      <header className={common.header}>
        <div>
          <p className={common.breadcrumb}>Siklus Pengeluaran / Pembayaran Pemasok</p>
          <h1 className={common.title}>Pembayaran pemasok</h1>
          <p className={common.description}>
            Catat pembayaran utang, alokasikan otomatis ke invoice tertua, dan
            verifikasi sebelum mencatat hasil transfer.
          </p>
        </div>
      </header>

      <div className={common.layout}>
        <div>
          <section className={common.listPanel} aria-labelledby="utang-terbuka">
            <div className={common.panelCard}>
              <div className={common.panelHeader}>
                <div>
                  <h2 className={common.panelTitle} id="utang-terbuka">
                    Utang terbuka
                  </h2>
                  <p className={common.panelMeta}>
                    {data.utang.length} invoice · Aktor: {profile.peran ?? "—"}
                  </p>
                </div>
              </div>

              {data.error ? (
                <p className={common.messageError} role="alert">
                  {data.error}
                </p>
              ) : null}

              {data.utang.length === 0 ? (
                <p className={common.emptyState}>Tidak ada utang yang bisa dibayar.</p>
              ) : (
                <div className={table.tableWrap}>
                  <table className={table.table}>
                    <caption className={table.caption}>
                      Invoice berstatus tercatat atau dibayar sebagian, urut tanggal.
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">Invoice</th>
                        <th scope="col">Pemasok</th>
                        <th scope="col">Jatuh tempo</th>
                        <th scope="col">Sisa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.utang.map((row) => (
                        <tr key={row.invoiceId}>
                          <th scope="row">{row.nomorInvoice}</th>
                          <td>{row.pemasokNama}</td>
                          <td>{formatTanggalSingkat(row.jatuhTempo)}</td>
                          <td className={table.nominal}>{formatRupiah(row.sisa)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          <section aria-labelledby="daftar-bayar" style={{ marginTop: "var(--space-6)" }}>
            <div className={common.panelCard}>
              <div className={common.panelHeader}>
                <div>
                  <h2 className={common.panelTitle} id="daftar-bayar">
                    Daftar pembayaran
                  </h2>
                  <p className={common.panelMeta}>{data.daftar.length} dokumen</p>
                </div>
              </div>

              {data.daftar.length === 0 ? (
                <p className={common.emptyState}>Belum ada pembayaran.</p>
              ) : (
                <div className={table.tableWrap}>
                  <table className={table.table}>
                    <thead>
                      <tr>
                        <th scope="col">Nomor</th>
                        <th scope="col">Pemasok</th>
                        <th scope="col">Tanggal</th>
                        <th scope="col">Nominal</th>
                        <th scope="col">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.daftar.map((row) => (
                        <tr key={row.dokumenId}>
                          <th scope="row">
                            <Link
                              className={common.tableLink}
                              href={`${PATH_BAYAR}?bayar=${row.dokumenId}`}
                            >
                              {row.nomor}
                            </Link>
                          </th>
                          <td>{row.pemasokNama}</td>
                          <td>{formatTanggalSingkat(row.tanggal)}</td>
                          <td className={table.nominal}>{formatRupiah(row.nominal)}</td>
                          <td>
                            <StatusBadge status={row.status} statuses={STATUS_BAYAR} />
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

        <section className={common.panel} aria-label="Detail pembayaran">
          <div className={common.panelCard}>
            {terpilih ? (
              <>
                <header className={common.detailHeader}>
                  <div>
                    <h2 className={common.detailNumber}>{terpilih.header.nomor}</h2>
                    <p className={common.detailSubtitle}>
                      {terpilih.header.pemasokNama} ·{" "}
                      {formatTanggalSingkat(terpilih.header.tanggal)} ·{" "}
                      {terpilih.header.rekeningLabel}
                    </p>
                  </div>
                  <StatusBadge status={terpilih.header.status} statuses={STATUS_BAYAR} />
                </header>

                <dl className={common.details}>
                  <div className={common.detailItem}>
                    <dt className={common.detailLabel}>Nominal</dt>
                    <dd className={common.detailValue}>
                      {formatRupiah(terpilih.header.nominal)}
                    </dd>
                  </div>
                  <div className={common.detailItem}>
                    <dt className={common.detailLabel}>Verifikasi Accounting</dt>
                    <dd className={common.detailValue}>
                      {terpilih.header.diverifikasiOleh ? "Sudah diverifikasi" : "Belum"}
                    </dd>
                  </div>
                  <div className={common.detailItem}>
                    <dt className={common.detailLabel}>Bukti transfer</dt>
                    <dd className={common.detailValue}>
                      {data.buktiUrl ? (
                        <a href={data.buktiUrl} rel="noreferrer" target="_blank">
                          Buka bukti transfer
                        </a>
                      ) : (
                        "—"
                      )}
                    </dd>
                  </div>
                  <div className={common.detailItem}>
                    <dt className={common.detailLabel}>Alasan gagal</dt>
                    <dd className={common.detailValue}>
                      {terpilih.header.alasanGagal ?? "—"}
                    </dd>
                  </div>
                </dl>

                <div className={table.tableWrap}>
                  <table className={table.table}>
                    <caption className={table.caption}>
                      Alokasi pembayaran ke invoice, tertua dulu.
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">Invoice</th>
                        <th scope="col">Nominal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {terpilih.alokasi.map((row) => (
                        <tr key={row.id}>
                          <th scope="row">{row.invoiceNomor ?? row.invoiceId}</th>
                          <td className={table.nominal}>{formatRupiah(row.nominal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <PembayaranActions
                  bisaBatal={canCatat}
                  bisaHasil={canCatat}
                  bisaVerifikasi={canVerifikasi}
                  dokumenId={terpilih.header.dokumenId}
                  status={terpilih.header.status}
                  terverifikasi={terpilih.header.diverifikasiOleh !== null}
                  versi={terpilih.header.versi}
                />

                <hr className={common.sectionDivider} />

                <section aria-labelledby="riwayat-bayar">
                  <h3 className={common.panelTitle} id="riwayat-bayar">
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
            ) : canCatat ? (
              <>
                <header className={common.detailHeader}>
                  <div>
                    <h2 className={common.detailNumber}>Catat pembayaran</h2>
                    <p className={common.detailSubtitle}>
                      Alokasi otomatis ke invoice tertua; kelebihan bayar ditolak.
                    </p>
                  </div>
                </header>
                <CatatPembayaranForm
                  hariIni={hariIniJakarta()}
                  pemasok={pemasokUtang.map((item) => ({
                    id: item.id,
                    nama: item.nama,
                    sisa: item.sisa.toString(),
                    jumlahInvoice: item.jumlahInvoice,
                  }))}
                  pemasokTerpilih={pemasokId}
                  rekening={data.rekening.map((item) => ({
                    id: item.id,
                    label: `${item.namaBank} · ${item.nomor} · ${item.namaPemilik}`,
                  }))}
                />
              </>
            ) : bayarId ? (
              <div>
                <h2 className={common.panelTitle}>Pembayaran tidak ditemukan</h2>
                <Link className={common.secondaryButton} href={PATH_BAYAR}>
                  Kembali ke daftar
                </Link>
              </div>
            ) : (
              <p className={common.emptyState}>
                Pilih pembayaran untuk melihat detail. Hanya Finance yang dapat
                mencatat pembayaran baru.
              </p>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
