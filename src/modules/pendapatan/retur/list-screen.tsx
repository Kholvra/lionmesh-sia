import Link from "next/link";

import { cekIzin } from "@/lib/auth/permissions";
import type { Profile } from "@/lib/auth/types";
import { ReturTable } from "./components/retur-table";
import { PATH_RETUR, PATH_RETUR_BARU } from "./constants";
import { listRetur } from "./queries";
import styles from "./retur.module.css";

type ReturListScreenProps = {
  profile: Profile;
  status?: string;
  cari?: string;
};

const FILTER_TABS = [
  { key: "SEMUA", label: "Semua" },
  { key: "DIAJUKAN", label: "Diajukan" },
  { key: "DISETUJUI", label: "Disetujui" },
  { key: "SELESAI", label: "Selesai" },
  { key: "DITOLAK", label: "Ditolak" },
  { key: "DIBATALKAN", label: "Dibatalkan" },
];

export async function ReturListScreen({
  profile,
  status = "SEMUA",
  cari = "",
}: ReturListScreenProps) {
  const canCreate =
    cekIzin(profile.peran, "buat_pesanan") ||
    cekIzin(profile.peran, "buat_pengiriman");
  const canApprove = cekIzin(profile.peran, "setujui_retur_penjualan");
  const canQc = cekIzin(profile.peran, "periksa_qc_barang_retur");
  const canView = cekIzin(profile.peran, "lihat_piutang");

  if (!canCreate && !canApprove && !canQc && !canView) {
    return (
      <section aria-label="Retur penjualan" className={styles.page}>
        <section className={styles.panelCard} aria-labelledby="akses-ditolak">
          <h1 className={styles.title} id="akses-ditolak">
            Akses Ditolak
          </h1>
          <p className={styles.emptyState}>
            Anda tidak memiliki izin untuk mengakses daftar retur penjualan.
          </p>
        </section>
      </section>
    );
  }

  const rows = await listRetur({ status, q: cari });

  return (
    <section aria-label="Daftar retur penjualan" className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.breadcrumb}>
            Siklus Pendapatan / Retur Penjualan
          </p>
          <h1 className={styles.title}>Retur Penjualan & Kredit Memo</h1>
          <p className={styles.description}>
            Pengajuan retur dari faktur pelanggan, persetujuan Accounting,
            pemeriksaan QC, serta penerbitan kredit memo dan stok masuk.
          </p>
        </div>

        {canCreate ? (
          <div className={styles.headerActions}>
            <Link className={styles.primaryButton} href={PATH_RETUR_BARU}>
              + Ajukan Retur
            </Link>
          </div>
        ) : null}
      </header>

      <div className={styles.panelCard}>
        <div className={styles.toolbar}>
          <nav aria-label="Filter status retur" className={styles.filterGroup}>
            {FILTER_TABS.map((tab) => {
              const active = status === tab.key;
              const href =
                tab.key === "SEMUA"
                  ? PATH_RETUR
                  : `${PATH_RETUR}?status=${tab.key}${cari ? `&q=${encodeURIComponent(cari)}` : ""}`;
              return (
                <Link
                  className={`${styles.filterPill} ${active ? styles.filterPillActive : ""}`}
                  href={href}
                  key={tab.key}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>

          <form action={PATH_RETUR} className={styles.searchForm} method="GET">
            {status !== "SEMUA" ? (
              <input name="status" type="hidden" value={status} />
            ) : null}
            <input
              aria-label="Cari retur"
              className={styles.searchInput}
              defaultValue={cari}
              name="q"
              placeholder="Cari nomor retur / faktur / pelanggan..."
              type="search"
            />
            <button className={styles.secondaryButton} type="submit">
              Cari
            </button>
          </form>
        </div>

        <ReturTable rows={rows} />
      </div>
    </section>
  );
}
