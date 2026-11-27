import type { BomItem } from "@/modules/produksi/bom-produk/types";

export type SpkFilterTab =
  | "semua"
  | "direncanakan"
  | "menunggu_bahan"
  | "diproses"
  | "hasil_dicatat";

export type SpkStatusType =
  | "MENUNGGU_QC"
  | "BARANG_JADI"
  | "DIRENCANAKAN"
  | "MENUNGGU_BAHAN"
  | "DIPROSES";

export type StatusSpkInti =
  | "DIRENCANAKAN"
  | "CEK_BAHAN"
  | "BAHAN_CUKUP"
  | "BAHAN_KURANG"
  | "MENUNGGU_PEMBELIAN"
  | "BAHAN_SIAP"
  | "BERJALAN"
  | "HASIL_DICATAT"
  | "QC_PASSED"
  | "REWORK"
  | "REJECTED"
  | "SELESAI"
  | "DIBATALKAN";

export interface SpkItem {
  id: string;
  woId: string;
  nomorSpk: string;
  sumberInfo: string;
  produkNama: string;
  produkKode: string;
  produkId: string;
  bomVersiId: string;
  gudangId: string;
  versiBom: string;
  versiDokumen: number;
  statusInti: StatusSpkInti;
  jumlahLembar: number;
  jadwalText: string;
  tanggalMulaiISO: string;
  tanggalSelesaiISO: string;
  status: SpkStatusType;
  filterCategory: Exclude<SpkFilterTab, "semua">;
}

export const MESIN_OPTIONS: string[] = [
  "Mesin las 1",
  "Mesin las 2",
  "Mesin las 3",
];

export interface SpkDetailData {
  spk: SpkItem | null;
  bom: BomItem | null;
  stokTon: number | null;
}

export interface SpkFormData {
  bomList: BomItem[];
  gudangOptions: { id: string; nama: string }[];
}
