export interface BomItem {
  id: string;
  produkNama: string;
  produkKode: string;
  versiNumber: number; // misal: 2 -> "v2"
  berlakuDari: string; // tampilan e.g. "1 Okt 2026"
  berlakuDariISO: string; // untuk validasi tanggal e.g. "2026-10-01"
  toleransiScrap: string; // e.g. "1,5%"
  toleransiReject: string; // e.g. "1%"
  jumlahPerLembarKg: number; // e.g. 35.3
  komponenKode: string; // e.g. "BB-WR06"
  komponenNama: string; // e.g. "Wire rod 6 mm"
  status: "BERLAKU" | "TERJADWAL" | "DIGANTIKAN";
}

export interface BahanBakuOption {
  kode: string;
  nama: string;
  label: string;
}

export const BAHAN_BAKU_OPTIONS: BahanBakuOption[] = [
  { kode: "BB-WR05", nama: "Wire rod 5 mm", label: "Wire rod 5 mm · BB-WR05" },
  { kode: "BB-WR06", nama: "Wire rod 6 mm", label: "Wire rod 6 mm · BB-WR06" },
  { kode: "BB-WR07", nama: "Wire rod 7 mm", label: "Wire rod 7 mm · BB-WR07" },
  { kode: "BB-WR08", nama: "Wire rod 8 mm", label: "Wire rod 8 mm · BB-WR08" },
  { kode: "BB-WR10", nama: "Wire rod 10 mm", label: "Wire rod 10 mm · BB-WR10" },
  { kode: "BB-WR12", nama: "Wire rod 12 mm", label: "Wire rod 12 mm · BB-WR12" },
];

export const PRODUK_MASTER_OPTIONS = [
  { kode: "WM-M5", nama: "Wiremesh M5" },
  { kode: "WM-M6", nama: "Wiremesh M6" },
  { kode: "WM-M7", nama: "Wiremesh M7" },
  { kode: "WM-M8", nama: "Wiremesh M8" },
  { kode: "WM-M10", nama: "Wiremesh M10" },
  { kode: "WM-M12", nama: "Wiremesh M12" },
];

