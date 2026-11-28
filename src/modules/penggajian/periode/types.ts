import type { RiwayatStatus } from "@/modules/penggajian/shared/riwayat";

export type StatusPeriode =
  | "TERBUKA"
  | "REKAP"
  | "TERVALIDASI"
  // From GJ-004 on, the period document carries the payroll status as well.
  | "DRAFT_TERHITUNG"
  | "DIPERIKSA"
  | "REVISI"
  | "DISETUJUI"
  | "DIBAYAR"
  | "GAGAL_TRANSFER"
  | "DIPOSTING";

/** Manajemen's authorization to reopen a closed period (P-07, PRE-07). */
export type OtorisasiKoreksi = {
  id: string;
  alasan: string;
  oleh: string;
  pada: string;
  dipakaiPada: string | null;
};

/** One row per department a Supervisor validated in the current recap round (Q-05). */
export type ValidasiDepartemen = {
  departemenId: string;
  oleh: string;
  profileId: string;
  pada: string;
};

export type PeriodeGaji = {
  id: string;
  nama: string;
  mulai: string;
  selesai: string;
  status: StatusPeriode;
  riwayat: RiwayatStatus[];
  otorisasi: OtorisasiKoreksi[];
  validasi: ValidasiDepartemen[];
  /** Latest return reason, shown to HR until the recap is saved again (AC-03). */
  pengembalian: { departemen: string; alasan: string; oleh: string; pada: string } | null;
};
