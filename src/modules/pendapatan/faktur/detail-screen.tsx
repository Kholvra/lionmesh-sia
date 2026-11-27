import Link from "next/link";
import { notFound } from "next/navigation";

import { StatusBadge } from "@/components/ui/status-badge";
import { cekIzin } from "@/lib/auth/permissions";
import type { Profile } from "@/lib/auth/types";
import { FakturActions } from "./components/faktur-actions";
import { formatAngka, formatRupiah, formatTanggal, formatWaktu } from "./format";
import styles from "./faktur.module.css";
import { getFakturDetail } from "./queries";
import { STATUS_FAKTUR_OPTIONS } from "./types";

type FakturDetailScreenProps = {
  profile: Profile;
  idOrNomor: string;
};

export async function FakturDetailScreen({
  profile,
  idOrNomor,
}: FakturDetailScreenProps) {
  const canIssue = cekIzin(profile.peran, "terbitkan_faktur");
  const canViewPiutang = cekIzin(profile.peran, "lihat_piutang");

  if (!canIssue && !canViewPiutang) {
    return (
      <section aria-label="Detail faktur" className={styles.page}>
        <section className={styles.panelCard} aria-labelledby="akses-ditolak">
          <h1 className={styles.title} id="akses-ditolak">
            Akses Ditolak
          </h1>
          <p className={styles.emptyState}>
            Hanya peran Accounting atau Manajemen yang dapat melihat rincian
            faktur dan piutang.
          </p>
        </section>
      </section>
    );
  }

  const detail = await getFakturDetail(idOrNomor);
  if (!detail) {
    notFound();
  }

  return (
    <section aria-label={`Detail Faktur ${detail.nomor}`} className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.breadcrumb}>
            Siklus Pendapatan / Faktur Penjualan / {detail.nomor}
          </p>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>{detail.nomor}</h1>
            <StatusBadge
              status={detail.status}
              statuses={STATUS_FAKTUR_OPTIONS}
            />
          </div>
          <p className={styles.description}>
            Surat Jalan:{" "}
            <Link
              href={`/pendapatan/pengiriman/${encodeURIComponent(detail.pengirimanNomor)}`}
            >
              {detail.pengirimanNomor}
            </Link>{" "}
            · Pesanan:{" "}
            <Link href={`/pendapatan/pesanan/${detail.pesananId}`}>
              {detail.pesananNomor}
            </Link>{" "}
            · No. Faktur Pajak: {detail.nomorFakturPajak ?? "-"}
          </p>
        </div>
      </header>

      {/* Summary Strip: 4 equal cards */}
      <div className={styles.summaryStrip}>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Pelanggan</p>
          <p className={styles.statValue}>{detail.pelangganNama}</p>
          <p className={styles.fieldHint}>{detail.pelangganKode}</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Tanggal & Jatuh Tempo</p>
          <p className={styles.statValue}>{formatTanggal(detail.tanggalFaktur)}</p>
          <p className={styles.fieldHint}>
            Jatuh tempo: {formatTanggal(detail.jatuhTempo)} ({detail.terminHari} hari)
          </p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Total Faktur</p>
          <p className={`${styles.statValue} ${styles.numeric}`}>
            {formatRupiah(detail.total)}
          </p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Sisa Piutang</p>
          <p className={`${styles.statValue} ${styles.numeric}`}>
            {formatRupiah(detail.sisaPiutang)}
          </p>
        </div>
      </div>

      {/* 8/4 Split Grid */}
      <div className={styles.grid12}>
        <div className={styles.span8}>
          {detail.status === "DIBATALKAN" && detail.alasanBatal ? (
            <div className={`${styles.alertBox} ${styles.alertError}`}>
              <strong>Dibatalkan:</strong> {detail.alasanBatal}
            </div>
          ) : null}

          <div className={styles.panelCard}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>Rincian Barang & Pajak</h2>
                <p className={styles.panelSubtitle}>
                  Tarif PPN berlaku {(detail.tarifPpn * 100).toFixed(0)}%
                </p>
              </div>
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Produk</th>
                    <th className={styles.alignRight}>Qty</th>
                    <th className={styles.alignRight}>Harga</th>
                    <th className={styles.alignRight}>Diskon</th>
                    <th className={styles.alignRight}>DPP</th>
                    <th className={styles.alignRight}>PPN</th>
                    <th className={styles.alignRight}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.items.map((it) => (
                    <tr key={it.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{it.produkNama}</div>
                        <div
                          style={{
                            color: "var(--text-muted)",
                            fontSize: "var(--font-size-caption)",
                          }}
                        >
                          {it.produkKode} · {it.satuanKode}
                        </div>
                      </td>
                      <td className={`${styles.alignRight} ${styles.numeric}`}>
                        {formatAngka(it.qty)}
                      </td>
                      <td className={`${styles.alignRight} ${styles.numeric}`}>
                        {formatRupiah(it.hargaSatuan)}
                      </td>
                      <td className={`${styles.alignRight} ${styles.numeric}`}>
                        {formatAngka(it.diskonPersen)}%
                      </td>
                      <td className={`${styles.alignRight} ${styles.numeric}`}>
                        {formatRupiah(it.dpp)}
                      </td>
                      <td className={`${styles.alignRight} ${styles.numeric}`}>
                        {formatRupiah(it.ppn)}
                      </td>
                      <td className={`${styles.alignRight} ${styles.numeric}`}>
                        {formatRupiah(it.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div
              style={{
                marginTop: "var(--space-5)",
                paddingTop: "var(--space-4)",
                borderTop: "var(--border-width-default) solid var(--border-subtle)",
                maxWidth: "360px",
                marginLeft: "auto",
              }}
            >
              <dl className={styles.totalsList}>
                <div className={styles.totalRow}>
                  <dt>DPP</dt>
                  <dd className={styles.numeric}>{formatRupiah(detail.dpp)}</dd>
                </div>
                <div className={styles.totalRow}>
                  <dt>PPN ({(detail.tarifPpn * 100).toFixed(0)}%)</dt>
                  <dd className={styles.numeric}>{formatRupiah(detail.ppn)}</dd>
                </div>
                <div className={styles.totalRowStrong}>
                  <dt>Total Faktur</dt>
                  <dd className={styles.numeric}>{formatRupiah(detail.total)}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Right Rail: Audit Trail (4 cols) */}
        <div className={styles.span4}>
          <div className={styles.panelCard}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>Riwayat Status & Jurnal</h2>
                <p className={styles.panelSubtitle}>Jejak audit dokumen (terbaru dulu)</p>
              </div>
            </div>

            {detail.riwayat.length === 0 ? (
              <p className={styles.emptyState}>Belum ada catatan riwayat.</p>
            ) : (
              <ul className={styles.timeline}>
                {detail.riwayat.map((r) => (
                  <li className={styles.timelineItem} key={r.id}>
                    <p className={styles.timelineAction}>
                      {r.status_asal ? `${r.status_asal} → ` : ""}
                      {r.status_tujuan}
                    </p>
                    <p className={styles.timelineMeta}>
                      Aksi: {r.aksi} · {formatWaktu(r.created_at)}
                    </p>
                    {r.alasan ? (
                      <p className={styles.timelineReason}>{r.alasan}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <FakturActions
        canIssue={canIssue}
        fakturId={detail.id}
        initialNomorFakturPajak={detail.nomorFakturPajak}
        nomor={detail.nomor}
        status={detail.status}
      />
    </section>
  );
}
