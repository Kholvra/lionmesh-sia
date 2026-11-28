import type { StatusSpkInti } from "@/modules/produksi/perintah-produksi/types";

export interface HasilProduksiSpkItem {
  id: string;
  woId: string;
  nomorSpk: string;
  jadwalText: string;
  produkNama: string;
  produkKode: string;
  produkId: string;
  gudangId: string;
  targetLembar: number;
  bahanDiterimaText: string;
  statusInti: StatusSpkInti;
  status: "DIPROSES" | "REWORK";
}

export interface HasilDetailData {
  spk: HasilProduksiSpkItem;
  pengeluaran: {
    id: string;
    qtyKeluar: string;
    produkId: string;
    satuanId: string;
    sudahDikonfirmasi: boolean;
  }[];
  hasil: {
    id: string;
    percobaan: number;
    qtyDiproses: string;
    createdBy: string | null;
    tanggal: string;
    qc: { keputusan: string; qtyLulus: string; qtyRework: string; qtyReject: string } | null;
    kunciQc: string | null;
  }[];
}

export interface RiwayatHasilData {
  nomorSpk: string;
  produkNama: string;
  jumlahJadi: number;
  scrapText: string;
  selesaiPada: string;
  kejadian: { waktu: string; kejadian: string; oleh: string }[];
}
