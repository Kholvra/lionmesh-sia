import type { RiwayatStatus } from "@/modules/penggajian/shared/riwayat";

export type StatusPeriode = "TERBUKA" | "REKAP" | "TERVALIDASI";

/** Manajemen's authorization to reopen a closed period (P-07, PRE-07). */
export type OtorisasiKoreksi = {
  id: string;
  alasan: string;
  oleh: string;
  pada: string;
  dipakaiPada: string | null;
};

export type PeriodeGaji = {
  id: string;
  nama: string;
  mulai: string;
  selesai: string;
  status: StatusPeriode;
  riwayat: RiwayatStatus[];
  otorisasi: OtorisasiKoreksi[];
};
