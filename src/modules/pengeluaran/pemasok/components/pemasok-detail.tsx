import Link from "next/link";

import { StatusBadge } from "@/components/ui";
import { Notice } from "@/components/ui/notice";
import type { Pemasok, RiwayatStatusPemasok } from "@/core/pemasok";
import { formatRupiah } from "@/lib/format/money";
import { PATH_PEMASOK } from "../constants";
import {
  formatPersen,
  formatTanggal,
  labelAksi,
  rupiahKeCents,
  STATUS_PEMASOK,
  statusPemasok,
} from "../format";
import styles from "../pemasok.module.css";
import { PemasokStatusButton } from "./pemasok-status-button";

type PemasokDetailProps = {
  pemasok: Pemasok;
  riwayat: readonly RiwayatStatusPemasok[];
  riwayatError: string | null;
  canManage: boolean;
  canReadPic: boolean;
};

function DetailItem({
  label,
  numeric = false,
  value,
}: {
  label: string;
  numeric?: boolean;
  value: string;
}) {
  return (
    <div className={styles.detailItem}>
      <dt className={styles.detailLabel}>{label}</dt>
      <dd
        className={`${styles.detailValue} ${
          numeric ? styles.detailValueNumeric : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function RiwayatItem({ item }: { item: RiwayatStatusPemasok }) {
  const statusTransition =
    item.status_lama && item.status_baru
      ? `${item.status_lama} → ${item.status_baru}`
      : item.status_baru;

  return (
    <li className={styles.historyItem}>
      <span className={styles.historyAction}>{labelAksi(item.aksi)}</span>
      {statusTransition ? (
        <span className={styles.historyStatus}>{statusTransition}</span>
      ) : null}
      <span className={styles.historyMeta}>
        {item.actor_nama} · {formatTanggal(item.created_at)}
      </span>
    </li>
  );
}

export function PemasokDetail({
  canManage,
  canReadPic,
  pemasok,
  riwayat,
  riwayatError,
}: PemasokDetailProps) {
  return (
    <div>
      <header className={styles.detailHeader}>
        <div>
          <h2 className={styles.detailName}>{pemasok.nama}</h2>
          <p className={styles.detailSubtitle}>
            Diperbarui {formatTanggal(pemasok.updated_at)}
          </p>
        </div>
        <StatusBadge
          status={statusPemasok(pemasok.aktif)}
          statuses={STATUS_PEMASOK}
        />
      </header>

      {canManage ? (
        <div className={styles.buttonRow}>
          <Link
            className={styles.secondaryButton}
            href={`${PATH_PEMASOK}?pemasok=${pemasok.id}&mode=edit`}
          >
            Ubah data
          </Link>
          <PemasokStatusButton
            aktif={pemasok.aktif}
            key={pemasok.id}
            nama={pemasok.nama}
            pemasokId={pemasok.id}
          />
        </div>
      ) : null}

      <dl className={styles.details}>
        <DetailItem label="Termin pembayaran" value={`${pemasok.termin_hari} hari`} />
        <DetailItem
          label="Toleransi harga"
          numeric
          value={formatPersen(pemasok.toleransi_persen)}
        />
        <DetailItem
          label="Toleransi nominal"
          numeric
          value={formatRupiah(rupiahKeCents(pemasok.toleransi_nominal))}
        />
        <DetailItem label="NPWP" value={pemasok.npwp ?? "—"} />
        <DetailItem label="Alamat" value={pemasok.alamat ?? "—"} />
        <DetailItem
          label="Kontak perusahaan"
          value={pemasok.kontak_perusahaan ?? "—"}
        />
        {canReadPic ? (
          <>
            <DetailItem
              label="Nama PIC"
              value={pemasok.kontak_pic_nama ?? "—"}
            />
            <DetailItem
              label="Telepon PIC"
              value={pemasok.kontak_pic_telepon ?? "—"}
            />
          </>
        ) : null}
      </dl>

      <hr className={styles.sectionDivider} />

      <section aria-labelledby="riwayat-pemasok">
        <div className={styles.historyHeader}>
          <h3 className={styles.historyTitle} id="riwayat-pemasok">
            Riwayat status
          </h3>
          <span className={styles.historyMeta}>
            {riwayat.length} catatan
          </span>
        </div>

        {riwayatError ? (
          <Notice tone="danger">Riwayat status gagal dimuat: {riwayatError}</Notice>
        ) : riwayat.length === 0 ? (
          <p className={styles.emptyState}>
            Belum ada riwayat status untuk pemasok ini.
          </p>
        ) : (
          <ol className={styles.historyList}>
            {riwayat.map((item) => (
              <RiwayatItem item={item} key={item.id} />
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
