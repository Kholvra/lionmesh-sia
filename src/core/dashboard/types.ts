import type { Peran } from "@/lib/auth/types";

export const SIKLUS_DASHBOARD = [
  "Pendapatan",
  "Pengeluaran",
  "Produksi",
  "Penggajian",
] as const;

export type SiklusDashboard = (typeof SIKLUS_DASHBOARD)[number];

/** A cycle count is never shown as zero when its source is unavailable or failed. */
export type StatusSumber = "tersedia" | "belum-tersedia" | "gagal";

export interface AturanApprovalAntrean {
  level: number;
  peran: Peran;
}

export interface DokumenMenunggu {
  id: string;
  tipe: string;
  nomor: string;
  status: string;
  pembuatId: string;
  namaJenis: string;
  perluApproval: boolean;
  statusMenungguApproval: string | null;
  approvalSnapshot: readonly AturanApprovalAntrean[];
  siklusApproval: number;
  /** When the document entered its current waiting state. */
  mulaiMenunggu: string;
}

export interface PersetujuanTercatat {
  dokumenId: string;
  level: number;
  actorId: string;
  siklusApproval: number;
}

export interface TindakanAntrean {
  dokumenId: string;
  nomor: string;
  jenis: string;
  siklus: SiklusDashboard;
  tahap: string;
  mulaiMenunggu: string;
  tautan: string | null;
}

export interface KartuSiklus {
  siklus: SiklusDashboard;
  status: StatusSumber;
  jumlah: number | null;
}

export interface RingkasanDashboard {
  antrean: TindakanAntrean[];
  kartu: KartuSiklus[];
  tanpaSiklus: number;
}
