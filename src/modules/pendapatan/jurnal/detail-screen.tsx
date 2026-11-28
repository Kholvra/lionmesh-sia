import Link from "next/link";
import { notFound } from "next/navigation";

import { cekIzin } from "@/lib/auth/permissions";
import type { Profile } from "@/lib/auth/types";
import styles from "./jurnal.module.css";
import { getJurnalDetail } from "./queries";

type JurnalDetailScreenProps = {
  profile: Profile;
  id: string;
};

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatTanggal(dateStr: string): string {
  if (!dateStr) return "-";
  const d = new Date(`${dateStr.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

function getSourceHref(sumberTipe: string, sumberNomor: string): string | null {
  const enc = encodeURIComponent(sumberNomor);
  if (sumberTipe === "PENGIRIMAN") return `/pendapatan/pengiriman/${enc}`;
  if (sumberTipe === "FAKTUR") return `/pendapatan/faktur/${enc}`;
  if (sumberTipe === "PENERIMAAN") return `/pendapatan/pembayaran/${enc}`;
  if (sumberTipe === "RETUR") return `/pendapatan/retur/${enc}`;
  return null;
}

export async function JurnalDetailScreen({
  profile,
  id,
}: JurnalDetailScreenProps) {
  const canView =
    cekIzin(profile.peran, "lihat_piutang") ||
    cekIzin(profile.peran, "lihat_laporan_kas") ||
    cekIzin(profile.peran, "terbitkan_faktur");

  if (!canView) {
    return (
      <section aria-label="Detail jurnal" className={styles.page}>
        <section className={styles.panelCard} aria-labelledby="akses-ditolak">
          <h1 className={styles.title} id="akses-ditolak">
            Akses Ditolak
          </h1>
          <p className={styles.emptyState}>
            Hanya peran Accounting atau Manajemen yang dapat melihat rincian
            jurnal.
          </p>
        </section>
      </section>
    );
  }

  const detail = await getJurnalDetail(id);
  if (!detail) {
    notFound();
  }

  const sourceHref = getSourceHref(detail.sumberTipe, detail.sumberNomor);

  return (
    <section
      aria-label={`Detail Jurnal ${detail.sumberNomor}`}
      className={styles.page}
    >
      <header className={styles.header}>
        <div>
          <p className={styles.breadcrumb}>
            Siklus Pendapatan / Jurnal Penjualan & HPP / {detail.sumberNomor}
          </p>
          <h1 className={styles.title}>Jurnal {detail.sumberNomor}</h1>
          <p className={styles.description}>
            Sumber: {detail.sumberTipe} · Pemicu: {detail.sumberPemicu} ·
            Tanggal: {formatTanggal(detail.tanggal)}
          </p>
        </div>
        <Link className={styles.secondaryButton} href="/pendapatan/jurnal">
          Kembali ke Daftar
        </Link>
      </header>

      <div className={styles.summaryStrip}>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Jenis Transaksi</p>
          <p className={styles.statValue}>{detail.sumberTipe}</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Nomor Transaksi Asal</p>
          <p className={styles.statValue}>
            {sourceHref ? (
              <Link className={styles.docLink} href={sourceHref}>
                {detail.sumberNomor}
              </Link>
            ) : (
              detail.sumberNomor
            )}
          </p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Total Debit</p>
          <p className={`${styles.statValue} ${styles.numeric}`}>
            {formatRupiah(detail.totalDebit)}
          </p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Total Kredit</p>
          <p className={`${styles.statValue} ${styles.numeric}`}>
            {formatRupiah(detail.totalKredit)}
          </p>
        </div>
      </div>

      <div className={styles.grid12}>
        <div className={styles.span8}>
          <div className={styles.panelCard}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>Baris Jurnal</h2>
                <p className={styles.panelSubtitle}>
                  Jurnal diposting otomatis melalui core/ledger (`postJournal`)
                </p>
              </div>
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Akun</th>
                    <th>Peran Akun</th>
                    <th className={styles.alignRight}>Debit</th>
                    <th className={styles.alignRight}>Kredit</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.baris.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>
                          {b.akunNomor} — {b.akunNama}
                        </div>
                      </td>
                      <td>{b.akunPeran}</td>
                      <td className={`${styles.alignRight} ${styles.numeric}`}>
                        {b.debit > 0 ? formatRupiah(b.debit) : "-"}
                      </td>
                      <td className={`${styles.alignRight} ${styles.numeric}`}>
                        {b.kredit > 0 ? formatRupiah(b.kredit) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className={styles.span4}>
          <div className={styles.panelCard}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>Metadata Jurnal</h2>
              </div>
            </div>

            <dl className={styles.metaList}>
              <div className={styles.metaRow}>
                <dt>ID Jurnal</dt>
                <dd className={styles.numeric}>{detail.id.slice(0, 8)}</dd>
              </div>
              <div className={styles.metaRow}>
                <dt>Pemicu</dt>
                <dd>{detail.sumberPemicu}</dd>
              </div>
              {detail.jurnalAsalId ? (
                <div className={styles.metaRow}>
                  <dt>Jurnal Asal (Pembalik)</dt>
                  <dd>
                    <Link
                      className={styles.docLink}
                      href={`/pendapatan/jurnal/${detail.jurnalAsalId}`}
                    >
                      {detail.jurnalAsalId.slice(0, 8)}
                    </Link>
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
