export * from "./bom-produk/types";
export * from "./perintah-produksi/types";
export * from "./pembelian-bahan/types";
export * from "./hasil-produksi/types";
export * from "./kartu-jam-kerja/types";
export * from "./laporan/types";

export interface KebutuhanStandar {
  kawatBajaLabel: string;
  kawatBajaKg: number;
  bahanPendukungKg: number;
}

export interface ProdukProduksi {
  id: string;
  kode: string;
  nama: string;
  satuan: string;
  diameterKawat: string;
  ukuranLembar: string;
  spesifikasi: string;
  kebutuhanStandar: KebutuhanStandar;
}

export const INITIAL_PRODUK_DATA: ProdukProduksi[] = [
  {
    id: "prod-1",
    kode: "WM-M6-2154",
    nama: "Wiremesh M6",
    satuan: "Lembar",
    diameterKawat: "Ø 6 mm",
    ukuranLembar: "2,1 m × 5,4 m",
    spesifikasi: "SNI 07-0663-1995 · Spasi 150×150 mm",
    kebutuhanStandar: {
      kawatBajaLabel: "Kawat baja Ø 6 mm",
      kawatBajaKg: 3400,
      bahanPendukungKg: 12,
    },
  },
  {
    id: "prod-2",
    kode: "WM-M8-2154",
    nama: "Wiremesh M8",
    satuan: "Lembar",
    diameterKawat: "Ø 8 mm",
    ukuranLembar: "2,1 m × 5,4 m",
    spesifikasi: "SNI 07-0663-1995 · Spasi 150×150 mm",
    kebutuhanStandar: {
      kawatBajaLabel: "Kawat baja Ø 8 mm",
      kawatBajaKg: 6000,
      bahanPendukungKg: 20,
    },
  },
  {
    id: "prod-3",
    kode: "WM-M10-2154",
    nama: "Wiremesh M10",
    satuan: "Lembar",
    diameterKawat: "Ø 10 mm",
    ukuranLembar: "2,1 m × 5,4 m",
    spesifikasi: "SNI 07-0663-1995 · Spasi 150×150 mm",
    kebutuhanStandar: {
      kawatBajaLabel: "Kawat baja Ø 10 mm",
      kawatBajaKg: 9400,
      bahanPendukungKg: 28,
    },
  },
];
