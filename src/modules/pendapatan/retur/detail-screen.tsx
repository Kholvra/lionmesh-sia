import Link from "next/link";
import { notFound } from "next/navigation";

import { StatusBadge } from "@/components/ui/status-badge";
import { cekIzin } from "@/lib/auth/permissions";
import type { Profile } from "@/lib/auth/types";
import { ReturActions } from "./components/retur-actions";
import { formatAngka, formatRupiah, formatTanggal, formatWaktu } from "./format";
import { getReturDetail } from "./queries";
import styles from "./retur.module.css";
import { STATUS_RETUR_OPTIONS } from "./types";

type ReturDetailScreenProps = {
  profile: Profile;
  idOrNomor: string;
};

export async function ReturDetailScreen({
  profile,
  idOrNomor,
}: ReturDetailScreenProps) {
  const canCreate =
    cekIzin(profile.peran, "buat_pesanan") ||
    cekIzin(profile.peran, "buat_pengiriman");
  const canApprove = cekIzin(profile.peran, "setujui_retur_penjualan");
  const canQc = cekIzin(profile.peran, "periksa_qc_barang_retur");
  const canView = cekIzin(profile.peran, "lihat_piutang");

  if (!canCreate && !canApprove && !canQc && !canView) {
    return (
      <section aria-label="Detail retur" className={styles.page}>
        <section className={styles.panelCard} aria-labelledby="akses-ditolak">
          <h1 className={styles.title} id="akses-ditolak">
            Akses Ditolak
          </h1>
          <p className={styles.emptyState}>
            Anda tidak memiliki izin untuk melihat rincian retur penjualan.
          </p>
        </section>
      </section>
    );
  }

  const detail = await getReturDetail(idOrNomor);
  if (!detail) {
    notFound();
  }

  const isCreator = detail.createdBy === profile.id;

  return (
    <section
      aria-label={`Detail Retur ${detail.nomor}`}
      className={styles.page}
    >
      <header className={styles.header}>
        <div>
          <p className={styles.breadcrumb}>
            Siklus Pendapatan / Retur Penjualan / {detail.nomor}
          </p>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>{detail.nomor}</h1>
            <StatusBadge
              status={detail.status}
              statuses={STATUS_RETUR_OPTIONS}
            />
          </div>
          <p className={styles.description}>
            Faktur Asal:{" "}
            <Link
              className={styles.docLink}
              href={`/pendapatan/faktur/${encodeURIComponent(detail.fakturNomor)}`}
            >
              {detail.fakturNomor}
            </Link>{" "}
            · Tanggal Retur: {formatTanggal(detail.tanggal)} · Alasan:{" "}
            {detail.alasan}
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
          <p className={styles.statLabel}>Sisa Piutang Faktur</p>
          <p className={`${styles.statValue} ${styles.numeric}`}>
            {formatRupiah(detail.sisaPiutangFaktur)}
          </p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Total Kredit Memo</p>
          <p className={`${styles.statValue} ${styles.numeric}`}>
            {detail.status === "SELESAI"
              ? formatRupiah(detail.totalKreditMemo)
              : "-"}
          </p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Jumlah Baris Barang</p>
          <p className={`${styles.statValue} ${styles.numeric}`}>
            {detail.items.length} item
          </p>
        </div>
      </div>

      {/* 8/4 Split Grid */}
      <div className={styles.grid12}>
        <div className={styles.span8}>
          {(detail.status === "DITOLAK" || detail.status === "DIBATALKAN") &&
          detail.alasanTolak ? (
            <div className={`${styles.alertBox} ${styles.alertError}`}>
              <strong>
                {detail.status === "DITOLAK" ? "Ditolak:" : "Dibatalkan:"}
              </strong>{" "}
              {detail.alasanTolak}
            </div>
          ) : null}

          {detail.qcCatatan ? (
            <div className={`${styles.alertBox} ${styles.alertInfo}`}>
              <strong>Catatan QC:</strong> {detail.qcCatatan}
            </div>
          ) : null}

          <div className={styles.panelCard}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>Rincian Barang Retur</h2>
                <p className={styles.panelSubtitle}>
                  Stok masuk dan kredit memo hanya dihitung untuk qty lulus QC.
                </p>
              </div>
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Produk & Gudang</th>
                    <th className={styles.alignRight}>Qty Diajukan</th>
                    <th className={styles.alignRight}>Qty Lulus QC</th>
                    <th className={styles.alignRight}>Harga</th>
                    <th className={styles.alignRight}>Kredit Memo</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.items.map((it) => (
                    <tr key={it.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{it.produkNama}</div>
                        <div className={styles.fieldHint}>
                          {it.produkKode} · {it.gudangNama} ({it.satuanKode})
                        </div>
                      </td>
                      <td className={`${styles.alignRight} ${styles.numeric}`}>
                        {formatAngka(it.qtyRetur)}
                      </td>
                      <td className={`${styles.alignRight} ${styles.numeric}`}>
                        {detail.status === "SELESAI" ||
                        detail.status === "DITOLAK"
                          ? formatAngka(it.qtyLulus)
                          : "-"}
                      </td>
                      <td className={`${styles.alignRight} ${styles.numeric}`}>
                        {formatRupiah(it.hargaSatuan)}
                      </td>
                      <td className={`${styles.alignRight} ${styles.numeric}`}>
                        {detail.status === "SELESAI"
                          ? formatRupiah(it.total)
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {detail.status === "SELESAI" ? (
              <div
                style={{
                  marginTop: "var(--space-5)",
                  paddingTop: "var(--space-4)",
                  borderTop:
                    "var(--border-width-default) solid var(--border-subtle)",
                  maxWidth: "360px",
                  marginLeft: "auto",
                }}
              >
                <dl className={styles.totalsList}>
                  <div className={styles.totalRow}>
                    <dt>DPP Retur</dt>
                    <dd className={styles.numeric}>
                      {formatRupiah(detail.totalDpp)}
                    </dd>
                  </div>
                  <div className={styles.totalRow}>
                    <dt>
                      PPN Retur ({(detail.tarifPpnFaktur * 100).toFixed(0)}%)
                    </dt>
                    <dd className={styles.numeric}>
                      {formatRupiah(detail.totalPpn)}
                    </dd>
                  </div>
                  <div className={styles.totalRowStrong}>
                    <dt>Total Kredit Memo</dt>
                    <dd className={styles.numeric}>
                      {formatRupiah(detail.totalKreditMemo)}
                    </dd>
                  </div>
                </dl>
              </div>
            ) : null}
          </div>
        </div>

        <div className={styles.span4}>
          <div className={styles.panelCard}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>Informasi & Aksi</h2>
                <p className={styles.panelSubtitle}>
                  Persetujuan Accounting, QC, dan referensi jurnal
                </p>
              </div>
            </div>

            <dl className={styles.metaList}>
              <div className={styles.metaRow}>
                <dt>Nomor Retur</dt>
                <dd>{detail.nomor}</dd>
              </div>
              <div className={styles.metaRow}>
                <dt>Jurnal Kredit Memo</dt>
                <dd className={styles.numeric}>
                  {detail.jurnalKreditMemoId
                    ? detail.jurnalKreditMemoId.slice(0, 8)
                    : "-"}
                </dd>
              </div>
              <div className={styles.metaRow}>
                <dt>Jurnal Pembalik HPP</dt>
                <dd className={styles.numeric}>
                  {detail.jurnalHppId ? detail.jurnalHppId.slice(0, 8) : "-"}
                </dd>
              </div>
            </dl>

            <ReturActions
              canApprove={canApprove}
              canQc={canQc}
              isCreator={isCreator}
              items={detail.items}
              nomor={detail.nomor}
              returId={detail.id}
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
