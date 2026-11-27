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

