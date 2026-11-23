export const PEMBALIKAN = "PEMBALIKAN" as const;
export const SUMBER_TIPE_PATTERN = /^[A-Z][A-Z0-9_]*$/;
export const AKUN_PERAN_PATTERN = /^[a-z][a-z0-9_]*$/;

export type MataUangJurnal = "IDR";

export interface Akun {
  id: string;
  nomor: string;
  nama: string;
  peran: string;
  aktif: boolean;
  created_by?: string | null;
  created_at: string;
  updated_by?: string | null;
  updated_at: string;
}

export interface PeriodeAkuntansi {
  tahun: number;
  bulan: number;
  status: "buka" | "kunci";
  dikunci_at?: string | null;
  dikunci_oleh?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_by?: string | null;
  updated_at: string;
}

export interface BarisJurnal {
  akunPeran: string;
  debit: string;
  kredit: string;
}

export interface PostJournalInput {
  tanggal: string | Date;
  sumberTipe: string;
  sumberId: string;
  sumberNomor: string;
  sumberPemicu: string;
  mataUang?: MataUangJurnal;
  baris: readonly BarisJurnal[];
  actorId: string;
  jurnalAsalId?: string;
}

export interface PostJournalResult {
  jurnalId: string;
  totalDebit: string;
  totalKredit: string;
}

export interface ReverseJournalInput {
  jurnalId: string;
  tanggal: string | Date;
  sumberId: string;
  sumberNomor: string;
  sumberPemicu: string;
  actorId: string;
}
