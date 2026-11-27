export interface HasilProduksiSpkItem {
  id: string;
  nomorSpk: string;
  jadwalText: string;
  produkNama: string;
  produkKode: string;
  targetLembar: number;
  bahanDiterimaText: string;
  status: "DIPROSES" | "REWORK";
}

export const INITIAL_HASIL_PRODUKSI_LIST: HasilProduksiSpkItem[] = [
  {
    id: "spk-2611-013",
    nomorSpk: "SPK-2611-013",
    jadwalText: "27–28 Nov",
    produkNama: "Wiremesh M6",
    produkKode: "WM-M6",
    targetLembar: 120,
    bahanDiterimaText: "4,3 ton · 27 Nov 06.40",
    status: "DIPROSES",
  },
];
