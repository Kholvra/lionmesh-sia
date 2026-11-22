export const DAFTAR_PERAN = [
  "Penjualan",
  "Pengiriman",
  "Gudang",
  "Purchasing",
  "QC",
  "Produksi",
  "Accounting",
  "Finance",
  "Manajemen",
  "Direksi",
  "HR",
  "Supervisor Lapangan",
  "Karyawan",
] as const;

export type Peran = (typeof DAFTAR_PERAN)[number];

export interface Profile {
  id: string;
  display_name: string | null;
  peran: Peran | null;
  aktif: boolean;
  karyawan_id: string | null;
  created_at: string;
  updated_at: string;
  updated_by?: string | null;
}
