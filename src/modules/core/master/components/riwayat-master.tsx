import { Notice } from "@/components/ui/notice";
import type { RiwayatStatusMaster } from "@/core/master/types";
import { formatTanggalWaktu } from "@/lib/format/date";

import { labelAksiMaster, labelStatus } from "../format";
import styles from "../master.module.css";

type RiwayatMasterProps = {
  riwayat: readonly RiwayatStatusMaster[];
  errorMessage?: string;
};

export function RiwayatMaster({ errorMessage, riwayat }: RiwayatMasterProps) {
  return (
    <section aria-labelledby="riwayat-master">
      <div className={styles.historyHeader}>
        <h3 className={styles.historyTitle} id="riwayat-master">
          Riwayat status
        </h3>
        <span className={styles.panelMeta}>{riwayat.length} catatan</span>
      </div>

      {errorMessage ? (
        <Notice className={styles.messageError} tone="danger">
          Riwayat status gagal dimuat: {errorMessage}
        </Notice>
      ) : riwayat.length === 0 ? (
        <p className={styles.emptyState}>Belum ada riwayat status.</p>
      ) : (
        <ul className={styles.historyList}>
          {riwayat.map((item) => (
            <li className={styles.historyItem} key={item.id}>
              <span className={styles.historyAction}>
                {labelAksiMaster(item.aksi)}
              </span>
              <span className={styles.historyMeta}>
                {labelStatus(item.status_lama)} → {labelStatus(item.status_baru)} ·{" "}
                {item.actor_nama} · {formatTanggalWaktu(item.created_at)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
