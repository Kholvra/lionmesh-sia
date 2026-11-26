import { StatusBadge } from "@/components/ui";
import type { PemeriksaanTutupPeriode } from "@/core/ledger";
import { formatRupiah } from "@/lib/format/money";

import { STATUS_PERIODE } from "../constants";
import styles from "../periode.module.css";

export function KartuPemeriksaanPeriode({
  data,
}: {
  data: PemeriksaanTutupPeriode;
}) {
  const sebelumnya = data.periodeSebelumnya;

  return (
    <section className={styles.panel} aria-labelledby="pemeriksaan-title">
      <h2 className={styles.sectionTitle} id="pemeriksaan-title">
        Pemeriksaan
      </h2>

      <dl className={styles.pemeriksaanGrid}>
        <div className={styles.pemeriksaanItem}>
          <dt className={styles.pemeriksaanLabel}>Periode sebelumnya</dt>
          <dd className={styles.pemeriksaanValue}>
            {sebelumnya ? (
              <>
                <span>{sebelumnya.label}</span>
                <StatusBadge
                  status={sebelumnya.status}
                  statuses={STATUS_PERIODE}
                />
              </>
            ) : (
              <span className={styles.valueSuccess}>Belum ada</span>
            )}
          </dd>
        </div>

        <div className={styles.pemeriksaanItem}>
          <dt className={styles.pemeriksaanLabel}>Neraca saldo</dt>
          <dd className={styles.pemeriksaanValue}>
            {data.neraca.seimbang ? (
              <span className={styles.valueSuccess}>
                Seimbang · {formatRupiah(data.neraca.totalDebitCents)}
              </span>
            ) : (
              <span className={styles.valueDanger}>
                Tidak seimbang · selisih{" "}
                {formatRupiah(data.neraca.selisihCents)}
              </span>
            )}
          </dd>
        </div>

        <div className={styles.pemeriksaanItem}>
          <dt className={styles.pemeriksaanLabel}>
            Dokumen setengah posting
          </dt>
          <dd className={styles.pemeriksaanValue}>
            {data.setengahPosting === 0 ? (
              <span className={styles.valueSuccess}>Tidak ada</span>
            ) : (
              <span className={styles.valueDanger}>
                {data.setengahPosting} dokumen
              </span>
            )}
          </dd>
        </div>

        <div className={styles.pemeriksaanItem}>
          <dt className={styles.pemeriksaanLabel}>Laporan periode ini</dt>
          <dd className={styles.pemeriksaanValue}>
            Tetap sama setelah ditutup
          </dd>
        </div>
      </dl>
    </section>
  );
}
