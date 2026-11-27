import { cekIzin, type AksiDomain } from "@/lib/auth/permissions";
import type { Peran } from "@/lib/auth/types";

/**
 * Daftar peran yang berinteraksi dalam Siklus Produksi (PR-001 s/d PR-007).
 */
export const PRODUKSI_ACTORS: {
  role: Peran;
  title: string;
  department: string;
  responsibility: string;
}[] = [
  {
    role: "Produksi",
    title: "Staf / Supervisor Produksi",
    department: "Lantai Pabrik & PPIC",
    responsibility: "Membuat BOM, SPK, konfirmasi pemakaian bahan, mencatat hasil, dan jam kerja TKL.",
  },
  {
    role: "Gudang",
    title: "Staf Gudang",
    department: "Logistik & Pergudangan",
    responsibility: "Cek ketersediaan bahan baku, mutasi pengeluaran bahan, terima barang jadi lulus QC.",
  },
  {
    role: "QC",
    title: "Quality Control Officer",
    department: "Penjaminan Mutu Pabrik",
    responsibility: "Inspeksi hasil produksi, membagi hasil ke Lulus, Rework, atau Reject abnormal.",
  },
  {
    role: "Purchasing",
    title: "Petugas Pengadaan",
    department: "Purchasing",
    responsibility: "Memeriksa permintaan pembelian bahan (PR) yang diajukan Produksi.",
  },
  {
    role: "Manajemen",
    title: "Manajer Pabrik / Direksi",
    department: "Manajemen Operasional",
    responsibility: "Menyetujui PR bahan bernilai besar dan memantau KPI efisiensi pabrik.",
  },
  {
    role: "Accounting",
    title: "Staf Akuntansi Biaya",
    department: "Keuangan & Akuntansi",
    responsibility: "Penetapan tarif overhead, alokasi biaya WIP, posting jurnal HPP final SPK.",
  },
];

export type ProduksiActorRole =
  | "Produksi"
  | "Gudang"
  | "QC"
  | "Purchasing"
  | "Manajemen"
  | "Accounting";

/**
 * Pemetaan aksi lokal siklus produksi ke aksi domain pada MATRIKS_IZIN.
 * Semua keputusan wewenang dibaca dari matriks tunggal melalui cekIzin.
 */
const PRODUKSI_AKSI = {
  create_bom_version: "buat_versi_bom",
  view_bom: "lihat_bom",
  create_spk: "buat_perintah_produksi",
  cancel_spk: "ubah_batal_perintah_produksi",
  view_spk: "lihat_perintah_produksi",
  request_bahan: "ajukan_permintaan_bahan",
  check_stok_bahan: "cek_ketersediaan_bahan",
  verify_pr_bahan: "verifikasi_permintaan_bahan",
  approve_pr_bahan: "setujui_pembelian_bahan",
  issue_bahan_gudang: "catat_pemakaian_bahan_keluar",
  confirm_bahan_usage: "catat_pemakaian_bahan_terpakai",
  record_hasil_produksi: "catat_hasil_produksi",
  inspect_qc: "periksa_qc_hasil",
  receive_finish_goods: "terima_barang_jadi",
  record_kartu_jam_kerja: "catat_kartu_jam_kerja",
  post_final_hpp: "posting_hpp_final",
  view_hpp_detail: "lihat_hpp_perintah_produksi",
  view_report_produksi: "lihat_laporan_hasil_produksi",
  view_report_wip: "lihat_laporan_saldo_wip",
  view_report_persediaan: "lihat_laporan_persediaan_jadi",
} as const satisfies Record<string, AksiDomain>;

export type ProduksiAction = keyof typeof PRODUKSI_AKSI;

export function canActorPerform(role: Peran | null | undefined, action: ProduksiAction): boolean {
  return cekIzin(role, PRODUKSI_AKSI[action]);
}

/**
 * Tab laporan PR-007: Gudang dibuka pada persediaan, Produksi tidak pernah
 * dibuka pada persediaan; Accounting/Manajemen mempertahankan pilihan tab.
 * Tanpa satu pun izin laporan, hasil null menandakan akses ditolak.
 */
export function tabLaporanProduksi(
  peran: Peran | null | undefined,
  tab: "produksi" | "wip" | "persediaan",
): "produksi" | "wip" | "persediaan" | null {
  const bisaProduksi = canActorPerform(peran, "view_report_produksi");
  const bisaWip = canActorPerform(peran, "view_report_wip");
  const bisaPersediaan = canActorPerform(peran, "view_report_persediaan");

  if (!bisaProduksi && !bisaWip && !bisaPersediaan) return null;
  if (bisaPersediaan && !bisaProduksi && !bisaWip) return "persediaan";
  if (bisaProduksi && !bisaPersediaan && tab === "persediaan") return "produksi";
  return tab;
}
