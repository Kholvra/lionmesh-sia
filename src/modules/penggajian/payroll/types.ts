import type { RiwayatStatus } from "@/modules/penggajian/shared/riwayat";

export type StatusDraft = "DRAFT_TERHITUNG" | "REVISI" | "DIPERIKSA" | "DISETUJUI" | "DIBAYAR" | "GAGAL_TRANSFER" | "DIPOSTING";

export type KodeKomponen =
  | "GAJI_POKOK"
  | "TUNJANGAN_TETAP"
  | "TUNJANGAN_KEHADIRAN"
  | "LEMBUR"
  | "POTONGAN_KETIDAKHADIRAN"
  | "BPJS_JHT"
  | "BPJS_JP"
  | "BPJS_KESEHATAN"
  | "PPH21";

export type Komponen = {
  kode: KodeKomponen;
  label: string;
  jenis: "tambah" | "kurang";
  /** Unrounded value; the rounded one is what is paid and journaled. */
  nilaiMentah: number;
  nilai: number;
  dasar: string;
  versiTarif: string | null;
  koreksi?: { nilaiSemula: number; alasan: string; oleh: string; pada: string };
};

export type BarisGaji = {
  karyawanId: string;
  nama: string;
  nik: string;
  departemen: string;
  komponen: Komponen[];
  bruto: number;
  totalTambah: number;
  totalKurang: number;
  neto: number;
  /** Raw net minus rounded net (D-51 b); journaled to the rounding account in GJ-007. */
  selisihPembulatan: number;
  perluPenyesuaianTahunan: boolean;
};

export type KaryawanDitandai = { karyawanId: string; nama: string; nik: string; alasan: string };

export type DraftPayroll = {
  periodeId: string;
  status: StatusDraft;
  dihitungOleh: string;
  /** The calculator may not check or approve this draft (D-48). */
  dihitungOlehProfileId: string;
  dihitungPada: string;
  versiTarif: Record<string, string>;
  baris: BarisGaji[];
  ditandai: KaryawanDitandai[];
  riwayat: RiwayatStatus[];
  /** Latest return note from Accounting or Direksi (GJ-005), shown until recalculated. */
  pengembalian: { oleh: string; alasan: string; pada: string } | null;
};
