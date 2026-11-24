import Link from "next/link";

import type { Pelanggan } from "@/core/pelanggan";
import { StatusBadge, type StatusOption } from "@/components/ui/status-badge";
import { formatRupiah, formatTanggal, formatTermin } from "../format";
import { PATH_PELANGGAN } from "../constants";
import styles from "../pelanggan.module.css";
import { BatasKreditForm } from "./batas-kredit-form";
import { PelangganStatusButton } from "./pelanggan-status-button";

const STATUS_PELANGGAN_OPTIONS: readonly StatusOption[] = [
  { value: "aktif", label: "Aktif", tone: "success" },
  { value: "nonaktif", label: "Nonaktif", tone: "neutral" },
];

type PelangganDetailProps = {
  pelanggan: Pelanggan;
  canManage: boolean;
  canManageCredit: boolean;
  canReadKontak: boolean;
};

export function PelangganDetail({
  pelanggan,
  canManage,
  canManageCredit,
  canReadKontak,
}: PelangganDetailProps) {
  return (
    <div className={styles.panelCard}>
      <div className={styles.panelHeader}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <h2 className={styles.panelTitle}>{pelanggan.nama}</h2>
            <StatusBadge
              status={pelanggan.status}
              statuses={STATUS_PELANGGAN_OPTIONS}
            />
          </div>
          <p className={styles.panelSubtitle}>Kode: {pelanggan.kodePelanggan}</p>
        </div>

        <div className={styles.panelActions}>
          {canManage ? (
            <>
              <Link
                className={styles.secondaryButton}
                href={`${PATH_PELANGGAN}?pelanggan=${pelanggan.id}&mode=edit`}
              >
                Ubah
              </Link>
              <PelangganStatusButton
                id={pelanggan.id}
                nama={pelanggan.nama}
                status={pelanggan.status}
              />
            </>
          ) : null}
        </div>
      </div>

      <div className={styles.detailSection}>
        <h3 className={styles.sectionHeader}>Ketentuan Penjualan</h3>
        <dl className={styles.fieldGrid}>
          <div className={styles.fieldItem}>
            <dt className={styles.fieldLabel}>Termin Pembayaran</dt>
            <dd className={styles.fieldValue}>{formatTermin(pelanggan.terminHari)}</dd>
          </div>

          <div className={styles.fieldItem}>
            <dt className={styles.fieldLabel}>Batas Kredit</dt>
            <dd className={`${styles.fieldValue} ${styles.numeric}`}>
              {formatRupiah(pelanggan.batasKredit)}
            </dd>
          </div>

          <div className={styles.fieldItem}>
            <dt className={styles.fieldLabel}>Terdaftar Sejak</dt>
            <dd className={styles.fieldValue}>{formatTanggal(pelanggan.createdAt)}</dd>
          </div>

          <div className={styles.fieldItem}>
            <dt className={styles.fieldLabel}>Terakhir Diperbarui</dt>
            <dd className={styles.fieldValue}>{formatTanggal(pelanggan.updatedAt)}</dd>
          </div>
        </dl>

        {canManageCredit ? (
          <BatasKreditForm
            batasKreditSaatIni={pelanggan.batasKredit}
            id={pelanggan.id}
            nama={pelanggan.nama}
          />
        ) : null}
      </div>

      <div className={styles.detailSection}>
        <h3 className={styles.sectionHeader}>Informasi Kontak & Pajak</h3>

        {canReadKontak ? (
          <dl className={styles.fieldGrid}>
            <div className={styles.fieldItem}>
              <dt className={styles.fieldLabel}>NPWP</dt>
              <dd className={styles.fieldValue}>{pelanggan.npwp || "-"}</dd>
            </div>

            <div className={styles.fieldItem}>
              <dt className={styles.fieldLabel}>Telepon</dt>
              <dd className={styles.fieldValue}>{pelanggan.telepon || "-"}</dd>
            </div>

            <div className={styles.fieldItem}>
              <dt className={styles.fieldLabel}>Email</dt>
              <dd className={styles.fieldValue}>{pelanggan.email || "-"}</dd>
            </div>

            <div className={`${styles.fieldItem} ${styles.fullWidth}`}>
              <dt className={styles.fieldLabel}>Alamat</dt>
              <dd className={styles.fieldValue}>{pelanggan.alamat || "-"}</dd>
            </div>
          </dl>
        ) : (
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "var(--font-size-caption)",
              margin: 0,
            }}
          >
            Data kontak dan alamat hanya dapat diakses oleh peran Penjualan,
            Accounting, dan Manajemen.
          </p>
        )}
      </div>
    </div>
  );
}
