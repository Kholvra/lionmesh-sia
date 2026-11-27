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

export interface SpkItem {
  id: string;
  nomorSpk: string;
  sumberInfo: string;
  produkNama: string;
  produkKode: string;
  versiBom: string;
  mesin?: string;
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

// Stok bahan baku tersedia di Gudang (dalam ton)
export const STOK_BAHAN_TERSEDIA_TON: Record<string, number> = {
  "BB-WR05": 4.5,
  "BB-WR06": 3.2,
  "BB-WR08": 5.8,
  "BB-WR10": 6.4,
};

