export interface BomItem {
  id: string;
  bomId: string;
  produkId: string;
  produkNama: string;
  produkKode: string;
  versiNumber: number;
  berlakuDari: string;
  berlakuDariISO: string;
  toleransiScrap: string;
  toleransiReject: string;
  jumlahPerLembarKg: number;
  komponenKode: string;
  komponenNama: string;
  komponenProdukId: string;
  satuanId: string;
  status: "BERLAKU" | "TERJADWAL" | "DIGANTIKAN";
}

export interface BomFormData {
  bomList: BomItem[];
  produkOptions: { id: string; kode: string; nama: string }[];
  bahanOptions: { id: string; kode: string; nama: string; satuanId: string }[];
}
