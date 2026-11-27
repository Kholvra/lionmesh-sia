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
 * Matriks Izin Spesifik Siklus Produksi (berdasarkan requirement dokumen PR-001 s/d PR-007).
 */
export const PRODUKSI_PERMISSIONS = {
  // PR-001: BOM
  create_bom_version: ["Produksi"],
  view_bom: ["Produksi", "Gudang", "Purchasing", "Manajemen", "Accounting"],

  // PR-002: Perintah Produksi (SPK)
  create_spk: ["Produksi"],
  cancel_spk: ["Produksi"],
  view_spk: ["Produksi", "Gudang", "QC", "Purchasing", "Manajemen", "Accounting"],

  // PR-003: Permintaan Bahan (PR)
  request_bahan: ["Produksi"],
  check_stok_bahan: ["Gudang"],
  verify_pr_bahan: ["Purchasing"],
  approve_pr_bahan: ["Manajemen"],

  // PR-004: Pemakaian Bahan & WIP
  issue_bahan_gudang: ["Gudang"],
  confirm_bahan_usage: ["Produksi"],

  // PR-005: Hasil Produksi & QC
  record_hasil_produksi: ["Produksi"],
  inspect_qc: ["QC"],
  receive_finish_goods: ["Gudang"],

  // PR-006: Biaya Produksi & HPP
  record_kartu_jam_kerja: ["Produksi"],
  post_final_hpp: ["Accounting"],
  view_hpp_detail: ["Produksi", "Accounting", "Manajemen"],

  // PR-007: Laporan & Efisiensi
  view_report_produksi: ["Produksi", "Accounting", "Manajemen"],
  view_report_wip: ["Produksi", "Accounting", "Manajemen"],
  view_report_persediaan: ["Gudang", "Accounting", "Manajemen"],
} as const;

export type ProduksiAction = keyof typeof PRODUKSI_PERMISSIONS;

export function canActorPerform(role: Peran | null | undefined, action: ProduksiAction): boolean {
  if (!role) return false;
  const allowed = PRODUKSI_PERMISSIONS[action] as readonly string[];
  return allowed.includes(role);
}
