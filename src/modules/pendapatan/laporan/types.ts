export interface AgingBucketDef {
  key: string;
  label: string;
  minDays: number | null;
  maxDays: number | null;
}

export interface LaporanPenjualanPelangganRow {
  pelangganId: string;
  pelangganKode: string;
  pelangganNama: string;
  dppFaktur: number;
  dppRetur: number;
  penjualanNeto: number;
}

export interface LaporanPenjualanProdukRow {
  produkId: string;
  produkKode: string;
  produkNama: string;
  qtyTerjual: number;
  dppPenjualan: number;
}

export interface LaporanPenjualanDokumenRow {
  id: string;
  jenis: "FAKTUR" | "RETUR";
  nomor: string;
  tanggal: string;
  pelangganNama: string;
  status: string;
  dpp: number;
}

export interface LaporanPenjualanResult {
  periode: string;
  totalPenjualanBukuBesar: number;
  totalDppFaktur: number;
  totalDppRetur: number;
  totalPenjualanNeto: number;
  perPelanggan: LaporanPenjualanPelangganRow[];
  perProduk: LaporanPenjualanProdukRow[];
  dokumen: LaporanPenjualanDokumenRow[];
}

export interface LaporanPiutangFakturRow {
  id: string;
  nomor: string;
  pelangganKode: string;
  pelangganNama: string;
  tanggalFaktur: string;
  jatuhTempo: string;
  totalFaktur: number;
  sisaPiutang: number;
  umurHari: number;
  bucketKey: string;
  bucketLabel: string;
}

export interface LaporanPiutangBucketSummary {
  key: string;
  label: string;
  jumlahFaktur: number;
  totalSisa: number;
}

export interface LaporanPiutangResult {
  tanggalLaporan: string;
  totalPiutang: number;
  buckets: LaporanPiutangBucketSummary[];
  rows: LaporanPiutangFakturRow[];
}

export interface LaporanKasRow {
  jurnalId: string;
  tanggal: string;
  sumberTipe: string;
  sumberNomor: string;
  sumberPemicu: string;
  akunNomor: string;
  akunNama: string;
  nominalDebit: number;
}

export interface LaporanKasResult {
  periode: string;
  totalPenerimaanKas: number;
  rows: LaporanKasRow[];
}
