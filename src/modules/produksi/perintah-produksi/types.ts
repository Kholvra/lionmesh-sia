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

export const INITIAL_SPK_LIST: SpkItem[] = [
  {
    id: "spk-2611-012",
    nomorSpk: "SPK-2611-012",
    sumberInfo: "dari stok minimum",
    produkNama: "Wiremesh M8",
    produkKode: "WM-M8",
    versiBom: "v3",
    mesin: "Mesin las 2",
    jumlahLembar: 400,
    jadwalText: "20–21 Nov",
    tanggalMulaiISO: "2026-11-20",
    tanggalSelesaiISO: "2026-11-21",
    status: "MENUNGGU_QC",
    filterCategory: "hasil_dicatat",
  },
  {
    id: "spk-2611-011",
    nomorSpk: "SPK-2611-011",
    sumberInfo: "dari SO-2611-010",
    produkNama: "Wiremesh M6",
    produkKode: "WM-M6",
    versiBom: "v2",
    mesin: "Mesin las 1",
    jumlahLembar: 250,
    jadwalText: "18–19 Nov",
    tanggalMulaiISO: "2026-11-18",
    tanggalSelesaiISO: "2026-11-19",
    status: "BARANG_JADI",
    filterCategory: "hasil_dicatat",
  },
];
