import type { BomItem } from "@/modules/produksi/bom-produk/types";
import type { SpkItem } from "@/modules/produksi/perintah-produksi/types";

export type PrFilterTab =
  | "diperiksa_purchasing"
  | "menunggu_pembelian"
  | "dikeluarkan";

export interface PurchaseRequestItem {
  id: string;
  dokumenId: string;
  woId: string;
  gudangId: string;
  nomorPr: string;
  nomorSpk: string;
  produkLabel: string;
  bahanNama: string;
  bahanKode: string;
  jumlahDimintaTon: number;
  dibutuhkanPalingLambat: string;
  statusDokumen: string;
  status: "DIPERIKSA_PURCHASING" | "MENUNGGU_PEMBELIAN" | "DIKELUARKAN";
  createdAtShort: string;
}

export interface PembelianFormData {
  spk: SpkItem | null;
  bom: BomItem | null;
  stokTon: number | null;
  pr: PurchaseRequestItem[];
  gudangOptions: { id: string; nama: string }[];
}
