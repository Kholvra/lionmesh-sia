import { notFound } from "next/navigation";

import { StatusBadge } from "@/components/ui/status-badge";
import { cekIzin } from "@/lib/auth/permissions";
import type { Profile } from "@/lib/auth/types";
import { PesananBaruScreen } from "./baru-screen";
import { PesananActions } from "./components/pesanan-actions";
import { formatAngka, formatRupiah, formatTanggal, formatWaktu } from "./format";
import styles from "./pesanan.module.css";
import { getPesananDetail } from "./queries";
import { STATUS_PESANAN_OPTIONS } from "./types";

type PesananDetailScreenProps = {
  profile: Profile;
  pesananId: string;
  mode?: string;
};

export async function PesananDetailScreen({
  profile,
  pesananId,
  mode,
}: PesananDetailScreenProps) {
  if (!profile.peran) {
    return (
      <section aria-label="Detail pesanan" className={styles.page}>
        <section className={styles.panelCard} aria-labelledby="akses-ditolak">
          <h1 className={styles.title} id="akses-ditolak">
            Akses Ditolak
          </h1>
          <p className={styles.emptyState}>
            Peran Anda tidak memiliki akses ke dokumen pesanan penjualan.
          </p>
        </section>
      </section>
    );
  }

  const detail = await getPesananDetail(pesananId);
  if (!detail) {
    notFound();
  }

  const isCreator = detail.createdBy === profile.id;
  const canEdit = cekIzin(profile.peran, "buat_pesanan");
  const canVerify = cekIzin(profile.peran, "verifikasi_pesanan");
  const canOverride = cekIzin(profile.peran, "override_batas_kredit");
  const canCancel = cekIzin(profile.peran, "batalkan_pesanan");

  if (
    mode === "edit" &&
    canEdit &&
    isCreator &&
    (detail.status === "DRAFT" || detail.status === "REVISI")
  ) {
    return <PesananBaruScreen initialPesanan={detail} profile={profile} />;
  }

  const totalExposureSetelahPesanan = detail.exposureSaatIni + detail.total;

  return (
    <section aria-label={`Detail Pesanan ${detail.nomor}`} className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.breadcrumb}>
            Siklus Pendapatan / Pesanan Penjualan / {detail.nomor}
          </p>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>{detail.nomor}</h1>
            <StatusBadge
              status={detail.status}
              statuses={STATUS_PESANAN_OPTIONS}
            />
          </div>
          <p className={styles.description}>
            Dibuat pada {formatWaktu(detail.createdAt)} · Tarif PPN berlaku{" "}
            {(detail.tarifPpn * 100).toFixed(0)}%
          </p>
        </div>
      </header>

      {/* Summary Strip: 4 equal cards (LAYOUTS.md §7) */}
      <div className={styles.summaryStrip}>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Pelanggan</p>
          <p className={styles.statValue}>{detail.pelangganNama}</p>
          <p className={styles.fieldHint}>{detail.pelangganKode}</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Tanggal Pesanan</p>
          <p className={styles.statValue}>{formatTanggal(detail.tanggal)}</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Total Pesanan</p>
          <p className={`${styles.statValue} ${styles.numeric}`}>
            {formatRupiah(detail.total)}
          </p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Termin Pembayaran</p>
          <p className={styles.statValue}>{detail.terminHari} hari</p>
        </div>
      </div>

      {/* 8/4 Split Grid (LAYOUTS.md §7) */}
      <div className={styles.grid12}>
        <div className={styles.span8}>
          {detail.status === "MENUNGGU_PERSETUJUAN_KREDIT" ? (
            <div className={`${styles.alertBox} ${styles.alertWarning}`}>
              <strong>Menunggu Persetujuan Kredit (Manajemen):</strong>{" "}
              Total exposure pelanggan ({formatRupiah(totalExposureSetelahPesanan)})
              melewati batas kredit ({formatRupiah(detail.batasKreditPelanggan)}).
            </div>
          ) : null}

          {detail.status === "REVISI" && detail.alasanRevisi ? (
            <div className={`${styles.alertBox} ${styles.alertWarning}`}>
              <strong>Perlu Revisi:</strong> {detail.alasanRevisi}
            </div>
          ) : null}

          {detail.status === "DIBATALKAN" && detail.alasanBatal ? (
            <div className={`${styles.alertBox} ${styles.alertError}`}>
              <strong>Dibatalkan:</strong> {detail.alasanBatal}
            </div>
          ) : null}

          {detail.alasanOverride ? (
            <div className={`${styles.alertBox} ${styles.alertSuccess}`}>
              <strong>Catatan Override Kredit:</strong> {detail.alasanOverride}
            </div>
          ) : null}

          <div className={styles.panelCard}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>Rincian Barang & Nilai</h2>
                <p className={styles.panelSubtitle}>
                  {detail.items.length} baris barang
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
                  {detail.items.length === 0 ? (
                    <tr>
                      <td colSpan={7}>
                        <p className={styles.emptyState}>
                          Pesanan ini belum memiliki baris barang.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    detail.items.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div style={{ fontWeight: 500 }}>{item.produkNama}</div>
                          <div
                            style={{
                              color: "var(--text-muted)",
                              fontSize: "var(--font-size-caption)",
                            }}
                          >
                            {item.produkKode} · {item.satuanKode}
                          </div>
                        </td>
                        <td className={`${styles.alignRight} ${styles.numeric}`}>
                          {formatAngka(item.qty)}
                        </td>
                        <td className={`${styles.alignRight} ${styles.numeric}`}>
                          {formatRupiah(item.hargaSatuan)}
                        </td>
                        <td className={`${styles.alignRight} ${styles.numeric}`}>
                          {formatAngka(item.diskonPersen)}%
                        </td>
                        <td className={`${styles.alignRight} ${styles.numeric}`}>
                          {formatRupiah(item.dpp)}
                        </td>
                        <td className={`${styles.alignRight} ${styles.numeric}`}>
                          {formatRupiah(item.ppn)}
                        </td>
                        <td className={`${styles.alignRight} ${styles.numeric}`}>
                          {formatRupiah(item.total)}
                        </td>
                      </tr>
                    ))
                  )}
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
                  <dt>Subtotal (Nilai Kotor)</dt>
                  <dd className={styles.numeric}>{formatRupiah(detail.nilaiKotor)}</dd>
                </div>
                <div className={styles.totalRow}>
                  <dt>Total Diskon</dt>
                  <dd className={styles.numeric}>- {formatRupiah(detail.diskonTotal)}</dd>
                </div>
                <div className={styles.totalRow}>
                  <dt>DPP</dt>
                  <dd className={styles.numeric}>{formatRupiah(detail.dpp)}</dd>
                </div>
                <div className={styles.totalRow}>
                  <dt>PPN ({(detail.tarifPpn * 100).toFixed(0)}%)</dt>
                  <dd className={styles.numeric}>{formatRupiah(detail.ppn)}</dd>
                </div>
                <div className={styles.totalRowStrong}>
                  <dt>Total Pesanan</dt>
                  <dd className={styles.numeric}>{formatRupiah(detail.total)}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Right Rail: Audit Trail (4 cols, newest first) */}
        <div className={styles.span4}>
          <div className={styles.panelCard}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>Riwayat Status</h2>
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

      <PesananActions
        canCancel={canCancel}
        canEdit={canEdit}
        canOverride={canOverride}
        canVerify={canVerify}
        isCreator={isCreator}
        nomor={detail.nomor}
        pesananId={detail.id}
        status={detail.status}
      />
    </section>
  );
}
