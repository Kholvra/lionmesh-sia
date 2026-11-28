import Link from "next/link";
import { notFound } from "next/navigation";

import { StatusBadge } from "@/components/ui/status-badge";
import { cekIzin } from "@/lib/auth/permissions";
import type { Profile } from "@/lib/auth/types";
import { PengirimanActions } from "./components/pengiriman-actions";
import { formatAngka, formatTanggal, formatWaktu } from "./format";
import styles from "./pengiriman.module.css";
import { getPengirimanDetail } from "./queries";
import { STATUS_PENGIRIMAN_OPTIONS } from "./types";

type PengirimanDetailScreenProps = {
  profile: Profile;
  idOrNomor: string;
};

export async function PengirimanDetailScreen({
  profile,
  idOrNomor,
}: PengirimanDetailScreenProps) {
  if (!profile.peran) {
    return (
      <section aria-label="Detail pengiriman" className={styles.page}>
        <section className={styles.panelCard} aria-labelledby="akses-ditolak">
          <h1 className={styles.title} id="akses-ditolak">
            Akses Ditolak
          </h1>
          <p className={styles.emptyState}>
            Peran Anda tidak memiliki akses ke dokumen pengiriman.
          </p>
        </section>
      </section>
    );
  }

  const detail = await getPengirimanDetail(idOrNomor);
  if (!detail) {
    notFound();
  }

  const canAct = cekIzin(profile.peran, "buat_pengiriman");

  return (
    <section aria-label={`Detail Pengiriman ${detail.nomor}`} className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.breadcrumb}>
            Siklus Pendapatan / Pengiriman & Surat Jalan / {detail.nomor}
          </p>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>{detail.nomor}</h1>
            <StatusBadge
              status={detail.status}
              statuses={STATUS_PENGIRIMAN_OPTIONS}
            />
          </div>
          <p className={styles.description}>
            Pesanan Asal:{" "}
            <Link href={`/pendapatan/pesanan/${detail.pesananId}`}>
              {detail.pesananNomor}
            </Link>{" "}
            · Dibuat pada {formatWaktu(detail.createdAt)}
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
          <p className={styles.statLabel}>Tanggal Pengiriman</p>
          <p className={styles.statValue}>{formatTanggal(detail.tanggalPengiriman)}</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Pesanan Penjualan</p>
          <p className={styles.statValue}>{detail.pesananNomor}</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Bukti Terima</p>
          <p className={styles.statValue}>
            {detail.namaPenerima
              ? `${detail.namaPenerima} (${formatTanggal(detail.tanggalTerima)})`
              : "Belum diterima"}
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

          {detail.status === "DITERIMA" ? (
            <div className={`${styles.alertBox} ${styles.alertSuccess}`}>
              <strong>Diterima Pelanggan:</strong> Diterima oleh{" "}
              {detail.namaPenerima} pada {formatTanggal(detail.tanggalTerima)}.
            </div>
          ) : null}

          <div className={styles.panelCard}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>Rincian Barang Surat Jalan</h2>
                <p className={styles.panelSubtitle}>
                  {detail.keterangan ? `Catatan: ${detail.keterangan}` : `${detail.items.length} baris barang`}
                </p>
              </div>
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Produk</th>
                    <th>Gudang Asal</th>
                    <th className={styles.alignRight}>Qty Kirim</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.items.map((item) => (
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
                      <td>
                        {item.gudangNama} ({item.gudangKode})
                      </td>
                      <td className={`${styles.alignRight} ${styles.numeric}`}>
                        {formatAngka(item.qty)} {item.satuanKode}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Rail: Audit Trail (4 cols) */}
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

      <PengirimanActions
        canAct={canAct}
        nomor={detail.nomor}
        pengirimanId={detail.id}
        status={detail.status}
      />
    </section>
  );
}
