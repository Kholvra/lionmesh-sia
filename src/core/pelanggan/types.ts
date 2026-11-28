import type { Peran } from "@/lib/auth/types";

export const STATUS_PELANGGAN = ["aktif", "nonaktif"] as const;

export type StatusPelanggan = (typeof STATUS_PELANGGAN)[number];

/** PD-001 PRE-04: only these roles may read customer contact data. */
export const PERAN_BACA_KONTAK = [
  "Penjualan",
  "Accounting",
  "Manajemen",
] as const satisfies readonly Peran[];

/** Master values of a customer, without personal contact data. */
export interface PelangganRingkas {
  id: string;
  kodePelanggan: string;
  nama: string;
  terminHari: number;
  batasKredit: string;
  status: StatusPelanggan;
  createdAt: string;
  updatedAt: string;
}

export interface KontakPelanggan {
  npwp: string | null;
  alamat: string | null;
  telepon: string | null;
  email: string | null;
}

export type Pelanggan = PelangganRingkas & KontakPelanggan;

/** Actor identity always comes from the server session, never from a form. */
export interface PelangganAktor {
  id: string;
  peran: Peran | null;
}

export interface CreatePelangganInput {
  nama: string;
  terminHari?: number | string | null;
  batasKredit?: string | null;
  npwp?: string | null;
  alamat?: string | null;
  telepon?: string | null;
  email?: string | null;
}

/** Credit limit is deliberately absent: it has its own Manajemen-only action. */
export interface UpdatePelangganInput {
  id: string;
  nama: string;
  terminHari?: number | string | null;
  npwp?: string | null;
  alamat?: string | null;
  telepon?: string | null;
  email?: string | null;
}

export interface UpdateBatasKreditInput {
  id: string;
  batasKredit: string | null;
}

export interface UpdateStatusPelangganInput {
  id: string;
  status: string;
}

export type UrutkanPelanggan = "nama" | "kode" | "termin" | "batas" | "status";

export interface ListPelangganInput {
  cari?: string;
  status?: StatusPelanggan;
  urutkan?: UrutkanPelanggan;
  arah?: "ascending" | "descending";
  limit: number;
  offset: number;
}

export interface ListPelangganResult {
  baris: PelangganRingkas[];
  total: number;
}
