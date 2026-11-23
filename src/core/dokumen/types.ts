import type { Peran } from "@/lib/auth/types";

export const DAFTAR_STATUS_DOKUMEN = [
  "DRAFT",
  "DIAJUKAN",
  "DIPERIKSA",
  "DISETUJUI",
  "DIPROSES",
  "SELESAI",
  "REVISI",
  "DITOLAK",
  "DIBATALKAN",
  "VERIFIED",
  "MENUNGGU_STOK",
  "SIAP_KIRIM",
  "TERKIRIM_SEBAGIAN",
  "TERKIRIM",
  "DIFAKTURKAN",
  "MENUNGGU_PERSETUJUAN",
  "PEMASOK_DITETAPKAN",
  "DITERBITKAN",
  "DITERIMA_SEBAGIAN",
  "DITERIMA",
  "QC_LULUS",
  "QC_GAGAL",
  "COCOK",
  "SELISIH",
  "TERCATAT",
  "DIBAYAR_SEBAGIAN",
  "LUNAS",
  "DIRENCANAKAN",
  "CEK_BAHAN",
  "BAHAN_CUKUP",
  "BAHAN_KURANG",
  "MENUNGGU_PEMBELIAN",
  "BAHAN_SIAP",
  "BERJALAN",
  "HASIL_DICATAT",
  "QC_PASSED",
  "REWORK",
  "REJECTED",
  "TERBUKA",
  "REKAP",
  "TERVALIDASI",
  "DRAFT_TERHITUNG",
  "DIBAYAR",
  "GAGAL_TRANSFER",
  "DIPOSTING",
  "MENUNGGU_PERSETUJUAN_KREDIT",
  "DIKIRIM",
  "DICATAT",
  "TERVERIFIKASI",
  "SEBAGIAN_LUNAS",
  "MENUNGGU_VALIDASI_SUPERVISOR",
  "BELUM_COCOK",
] as const;

export type StatusDokumen = (typeof DAFTAR_STATUS_DOKUMEN)[number];

export const DAFTAR_AKSI_DOKUMEN = [
  "BUAT",
  "AJUKAN",
  "PERIKSA",
  "SETUJUI",
  "TOLAK",
  "REVISI",
  "REVISI_SELESAI",
  "PROSES",
  "SELESAI",
  "BATAL",
  "VERIFIKASI",
  "CEK_STOK",
  "KIRIM",
  "TERIMA",
  "FAKTURKAN",
  "CEK_KREDIT",
  "OVERRIDE",
  "PILIH_PEMASOK",
  "TERBITKAN",
  "QC",
  "COCOK",
  "SELISIH",
  "KOREKSI",
  "CATAT",
  "BAYAR",
  "CEK_BAHAN",
  "AJUKAN_PEMBELIAN",
  "TERIMA_BAHAN",
  "MULAI",
  "CATAT_HASIL",
  "REKAP",
  "VALIDASI",
  "HITUNG",
  "POSTING",
] as const;

export type AksiDokumen = (typeof DAFTAR_AKSI_DOKUMEN)[number];

export interface AturanApprovalSnapshot {
  level: number;
  peran: Peran;
  batas_bawah: string;
  batas_atas: string | null;
}

export interface Dokumen {
  id: string;
  tipe: string;
  nomor: string;
  periode: string;
  status: StatusDokumen;
  pembuat_id: string;
  nominal: string | null;
  approval_snapshot: AturanApprovalSnapshot[];
  siklus_approval: number;
  diposting: boolean;
  diposting_at: string | null;
  versi: number;
  created_by: string | null;
  created_at: string;
  updated_by: string | null;
  updated_at: string;
}

export interface RiwayatStatus {
  id: string;
  dokumen_id: string;
  tipe_dokumen: string;
  aksi: AksiDokumen;
  status_asal: StatusDokumen | null;
  status_tujuan: StatusDokumen;
  level: number | null;
  alasan: string | null;
  siklus_approval: number;
  actor_id: string;
  created_by: string | null;
  created_at: string;
  updated_by: string | null;
  updated_at: string;
}

export interface JenisDokumen {
  tipe: string;
  nama: string;
  status_awal: StatusDokumen;
  perlu_approval: boolean;
  status_menunggu_approval: StatusDokumen | null;
  created_by: string | null;
  created_at: string;
  updated_by: string | null;
  updated_at: string;
}

export interface AturanApproval {
  id: string;
  tipe: string;
  level: number;
  peran: Peran;
  batas_bawah: string;
  batas_atas: string | null;
  aktif: boolean;
  created_by: string | null;
  created_at: string;
  updated_by: string | null;
  updated_at: string;
}

export interface BuatDokumenInput {
  tipe: string;
  actorId: string;
  nominal?: string;
  tanggal?: string;
}

export interface TransisiDokumenInput {
  dokumenId: string;
  versi: number;
  actorId: string;
  alasan?: string;
  diposting?: boolean;
}

export interface PindahStatusDokumenInput extends TransisiDokumenInput {
  statusTujuan: StatusDokumen;
  aksi: AksiDokumen;
  resetApproval?: boolean;
}

export interface TransisiDokumenHasil {
  dokumen: Dokumen;
  riwayat_id: string;
}
