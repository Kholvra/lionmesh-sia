import Link from "next/link";
import { notFound } from "next/navigation";

import { StatusBadge } from "@/components/ui/status-badge";
import { cekIzin } from "@/lib/auth/permissions";
import type { Profile } from "@/lib/auth/types";
import { PembayaranActions } from "./components/pembayaran-actions";
import { formatRupiah, formatTanggal, formatWaktu } from "./format";
import styles from "./pembayaran.module.css";
import { getPembayaranDetail } from "./queries";
import { STATUS_PEMBAYARAN_OPTIONS } from "./types";

type PembayaranDetailScreenProps = {
  profile: Profile;
  idOrNomor: string;
};

export async function PembayaranDetailScreen({
  profile,
  idOrNomor,
}: PembayaranDetailScreenProps) {
  const canRecord = cekIzin(profile.peran, "catat_pembayaran_piutang");
  const canVerify = cekIzin(profile.peran, "verifikasi_pembayaran_piutang");
  const canViewPiutang = cekIzin(profile.peran, "lihat_piutang");

  if (!canRecord && !canVerify && !canViewPiutang) {
    return (
      <section aria-label="Detail pembayaran" className={styles.page}>
        <section className={styles.panelCard} aria-labelledby="akses-ditolak">
          <h1 className={styles.title} id="akses-ditolak">
            Akses Ditolak
          </h1>
          <p className={styles.emptyState}>
            Anda tidak memiliki izin untuk melihat rincian penerimaan pembayaran
            pelanggan.
          </p>
        </section>
      </section>
    );
  }

  const detail = await getPembayaranDetail(idOrNomor);
  if (!detail) {
    notFound();
  }

  const totalDialokasikan = detail.alokasi.reduce(
    (sum, item) => sum + item.nominal,
    0,
  );
  const isCreator = detail.createdBy === profile.id;

  return (
    <section
      aria-label={`Detail Pembayaran ${detail.nomor}`}
      className={styles.page}
    >
      <header className={styles.header}>
        <div>
          <p className={styles.breadcrumb}>
            Siklus Pendapatan / Penerimaan Pembayaran / {detail.nomor}
          </p>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>{detail.nomor}</h1>
            <StatusBadge
              status={detail.status}
              statuses={STATUS_PEMBAYARAN_OPTIONS}
            />
          </div>
          <p className={styles.description}>
            Metode: {detail.metode} · Referensi:{" "}
            {detail.nomorReferensi ?? "-"} · Dicatat:{" "}
            {formatWaktu(detail.createdAt)}
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
          <p className={styles.statLabel}>Tanggal & Metode</p>
          <p className={styles.statValue}>{formatTanggal(detail.tanggal)}</p>
          <p className={styles.fieldHint}>
            {detail.metode}
            {detail.nomorReferensi ? ` (${detail.nomorReferensi})` : ""}
          </p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Nominal Diterima</p>
          <p className={`${styles.statValue} ${styles.numeric}`}>
            {formatRupiah(detail.nominal)}
          </p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Total Dialokasikan</p>
          <p className={`${styles.statValue} ${styles.numeric}`}>
            {formatRupiah(totalDialokasikan)}
          </p>
          <p className={styles.fieldHint}>
            {detail.alokasi.length} faktur teralokasi
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
                <h2 className={styles.panelTitle}>
                  Alokasi Pembayaran ke Faktur (FIFO)
                </h2>
                <p className={styles.panelSubtitle}>
                  Pembayaran dialokasikan otomatis ke faktur pelanggan terlama
                  terlebih dahulu saat diverifikasi.
                </p>
              </div>
            </div>

            {detail.alokasi.length === 0 ? (
              <p className={styles.emptyState}>
                {detail.status === "DICATAT"
                  ? "Belum ada alokasi tercatat. Alokasi FIFO akan dihitung dan disimpan otomatis saat pembayaran diverifikasi oleh Accounting."
                  : "Tidak ada alokasi faktur aktif pada pembayaran ini."}
              </p>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Nomor Faktur</th>
                      <th>Tanggal Faktur</th>
                      <th className={styles.alignRight}>Dialokasikan</th>
                      <th className={styles.alignRight}>Sisa Piutang</th>
                      <th>Status Faktur</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.alokasi.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <Link
                            className={styles.docLink}
                            href={`/pendapatan/faktur/${encodeURIComponent(row.fakturNomor)}`}
                          >
                            {row.fakturNomor}
                          </Link>
                        </td>
                        <td>{formatTanggal(row.tanggalFaktur)}</td>
                        <td
                          className={`${styles.alignRight} ${styles.numeric}`}
                          style={{ fontWeight: 600 }}
                        >
                          {formatRupiah(row.nominal)}
                        </td>
                        <td className={`${styles.alignRight} ${styles.numeric}`}>
                          {formatRupiah(row.sisaFakturSaatIni)}
                        </td>
                        <td>{row.statusFaktur}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className={styles.span4}>
          <div className={styles.panelCard}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>Informasi & Aksi</h2>
                <p className={styles.panelSubtitle}>
                  Verifikasi jurnal penerimaan & kontrol status
                </p>
              </div>
            </div>

            <dl className={styles.metaList}>
              <div className={styles.metaRow}>
                <dt>Nomor BKM</dt>
                <dd>{detail.nomor}</dd>
              </div>
              <div className={styles.metaRow}>
                <dt>Status</dt>
                <dd>{detail.status}</dd>
              </div>
              <div className={styles.metaRow}>
                <dt>Jurnal Penerimaan</dt>
                <dd className={styles.numeric}>
                  {detail.jurnalId ? detail.jurnalId.slice(0, 8) : "-"}
                </dd>
              </div>
              {detail.jurnalPembalikId ? (
                <div className={styles.metaRow}>
                  <dt>Jurnal Pembalik</dt>
                  <dd className={styles.numeric}>
                    {detail.jurnalPembalikId.slice(0, 8)}
                  </dd>
                </div>
              ) : null}
            </dl>

            <PembayaranActions
              canRecord={canRecord}
              canVerify={canVerify}
              isCreator={isCreator}
              nomor={detail.nomor}
              pembayaranId={detail.id}
              status={detail.status}
            />
          </div>

          <div
            className={styles.panelCard}
            style={{ marginTop: "var(--space-6)" }}
          >
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>Riwayat Status</h2>
              </div>
            </div>

            {detail.riwayat.length === 0 ? (
              <p className={styles.emptyState}>Belum ada riwayat status.</p>
            ) : (
              <ul className={styles.timeline}>
                {detail.riwayat.map((item) => (
                  <li className={styles.timelineItem} key={item.id}>
                    <p className={styles.timelineAction}>
                      {item.status_asal ? `${item.status_asal} → ` : ""}
                      {item.status_tujuan}
                    </p>
                    <p className={styles.timelineMeta}>
                      Aksi: {item.aksi} · {formatWaktu(item.created_at)}
                    </p>
                    {item.alasan ? (
                      <p className={styles.timelineReason}>{item.alasan}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
