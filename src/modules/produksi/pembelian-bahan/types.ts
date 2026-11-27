export type PrFilterTab =
  | "diperiksa_purchasing"
  | "menunggu_pembelian"
  | "dikeluarkan";

export interface PurchaseRequestItem {
  id: string;
  nomorPr: string;
  nomorSpk: string;
  produkLabel: string;
  bahanNama: string;
  bahanKode: string;
  jumlahDimintaTon: number;
  dibutuhkanPalingLambat: string;
  status: "DIPERIKSA_PURCHASING" | "MENUNGGU_PEMBELIAN" | "DIKELUARKAN";
  createdAtShort: string;
}

export const INITIAL_PR_LIST: PurchaseRequestItem[] = [];
