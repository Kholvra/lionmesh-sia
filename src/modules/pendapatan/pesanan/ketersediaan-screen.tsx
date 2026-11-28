import Link from "next/link";

import { StatusBadge } from "@/components/ui/status-badge";
import { cekIzin } from "@/lib/auth/permissions";
import type { Profile } from "@/lib/auth/types";
import { PATH_PESANAN } from "./constants";
import { formatRupiah, formatTanggal } from "./format";
import styles from "./pesanan.module.css";
import { listPesananKetersediaan } from "./queries";
import { STATUS_PESANAN_OPTIONS } from "./types";

type KetersediaanScreenProps = {
  profile: Profile;
};

export async function KetersediaanScreen({ profile }: KetersediaanScreenProps) {
  const canAlokasi = cekIzin(profile.peran, "cek_alokasi_stok");
  const bolehBaca = Boolean(profile.peran);

  if (!bolehBaca) {
    return (
      <section aria-label="Ketersediaan barang" className={styles.page}>
        <section className={styles.panelCard} aria-labelledby="akses-ditolak">
          <h1 className={styles.title} id="akses-ditolak">
            Akses Ditolak
          </h1>
          <p className={styles.emptyState}>
            Peran Anda tidak memiliki akses ke layar ketersediaan barang.
          </p>
        </section>
      </section>
    );
  }

  const items = await listPesananKetersediaan();

  return (
    <section aria-label="Ketersediaan barang pesanan" className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.breadcrumb}>
            Siklus Pendapatan / Gudang / Ketersediaan Barang
          </p>
          <h1 className={styles.title}>Ketersediaan Barang & Alokasi Stok</h1>
          <p className={styles.description}>
            Daftar pesanan terverifikasi yang menunggu pemeriksaan dan reservasi
            stok gudang sebelum pengiriman.
          </p>
        </div>

        <div className={styles.headerActions}>
          <Link className={styles.secondaryButton} href={PATH_PESANAN}>
            ← Daftar Pesanan
          </Link>
        </div>
      </header>

      <div className={styles.panelCard}>
        <div className={styles.panelHeader}>
          <div>
            <h2 className={styles.panelTitle}>Antrean Cek & Alokasi Stok</h2>
            <p className={styles.panelSubtitle}>
              {canAlokasi
                ? "Pilih pesanan untuk memeriksa stok tersedia dan menyimpan alokasi."
                : "Tampilan baca status ketersediaan stok pesanan."}
            </p>
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nomor Pesanan</th>
                <th>Tanggal</th>
                <th>Pelanggan</th>
                <th className={styles.alignRight}>Total</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <p className={styles.emptyState}>
                      Belum ada pesanan terverifikasi yang menunggu alokasi stok.
                    </p>
                  </td>
                </tr>
              ) : (
                items.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.nomor}</td>
                    <td>{formatTanggal(p.tanggal)}</td>
                    <td>{p.pelangganNama}</td>
                    <td className={`${styles.alignRight} ${styles.numeric}`}>
                      {formatRupiah(p.total)}
                    </td>
                    <td>
                      <StatusBadge
                        status={p.status}
                        statuses={STATUS_PESANAN_OPTIONS}
                      />
                    </td>
                    <td>
                      <Link
                        className={styles.primaryButton}
                        href={`${PATH_PESANAN}/${p.id}`}
                        style={{ height: "32px", padding: "0 var(--space-3)" }}
                      >
                        {canAlokasi ? "Periksa & Alokasi" : "Lihat Detail"}
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
