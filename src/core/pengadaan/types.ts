import type { Dokumen, RiwayatStatus, StatusDokumen } from "@/core/dokumen";

import type { BarisPenerimaan, BarisPO, BarisPermintaan, BarisQC, JenisPenerimaan } from "./rules";

export type {
  BarisPenerimaan,
  BarisPO,
  BarisPermintaan,
  BarisQC,
  JenisPenerimaan,
} from "./rules";

export interface PermintaanPembelian {
  dokumen_id: string;
  wo_id: string | null;
  gudang_id: string;
  pemasok_id: string | null;
  keterangan: string | null;
  tanggal_butuh: string;
  created_by: string | null;
  created_at: string;
  updated_by: string | null;
  updated_at: string;
}

export interface PermintaanPembelianItem {
  id: string;
  permintaan_id: string;
  produk_id: string;
  satuan_id: string;
  qty: string;
  urutan: number;
}

export interface PurchaseOrder {
  dokumen_id: string;
  permintaan_id: string;
  pemasok_id: string;
  tanggal: string;
  catatan_konfirmasi: string | null;
  created_by: string | null;
  created_at: string;
  updated_by: string | null;
  updated_at: string;
}

export interface PurchaseOrderItem {
  id: string;
  po_id: string;
  produk_id: string;
  qty: string;
  harga_satuan: string;
  ppn_persen: string;
  urutan: number;
}

export interface Penerimaan {
  dokumen_id: string;
  po_id: string;
  gudang_id: string;
  jenis: JenisPenerimaan;
  tanggal: string;
  created_by: string | null;
  created_at: string;
  updated_by: string | null;
  updated_at: string;
}

export interface PenerimaanItem {
  id: string;
  penerimaan_id: string;
  po_item_id: string;
  qty_diterima: string;
  qty_lulus: string | null;
}

export type TipeExceptionPengadaan = "SELISIH_QTY" | "KELEBIHAN_QTY";

export interface ExceptionPengadaan {
  id: string;
  tipe: TipeExceptionPengadaan;
  po_id: string;
  po_item_id: string | null;
  penerimaan_id: string | null;
  qty_po: string;
  qty_diterima: string;
  selisih: string;
  alasan: string | null;
  status: "TERBUKA";
  created_at: string;
}

export interface AjukanPRInput {
  gudangId: string;
  tanggalButuh: string;
  keterangan?: string | null;
  /** Optional production order reference; the foreign key arrives with PR-002 (PT-05). */
  woId?: string | null;
  tanggal?: string;
  baris: readonly BarisPermintaan[];
  actorId: string;
}

export interface PeriksaPRInput {
  permintaanId: string;
  versi: number;
  alasan?: string;
  actorId: string;
}

export interface PeriksaPRDenganNilaiInput extends PeriksaPRInput {
  nilai: string;
}

export interface TetapkanPemasokPRInput {
  permintaanId: string;
  versi: number;
  pemasokId: string;
  actorId: string;
}

export interface BuatPOInput {
  permintaanId: string;
  versi: number;
  pemasokId: string;
  baris: readonly BarisPO[];
  tanggal?: string;
  actorId: string;
}

export interface CatatPenerimaanInput {
  poId: string;
  versiPO: number;
  gudangId: string;
  jenis: JenisPenerimaan;
  baris: readonly BarisPenerimaan[];
  tanggal?: string;
  actorId: string;
}

export interface CatatQCInput {
  penerimaanId: string;
  versi: number;
  baris: readonly BarisQC[];
  tanggal?: string;
  actorId: string;
}

export interface BatalkanDokumenPengadaanInput {
  versi: number;
  alasan: string;
  actorId: string;
}

export interface BatalkanPRInput extends BatalkanDokumenPengadaanInput {
  permintaanId: string;
}

export interface BatalkanPOInput extends BatalkanDokumenPengadaanInput {
  poId: string;
}

export interface HasilDokumenPengadaan {
  dokumen: Dokumen;
  riwayatId: string;
}

export interface HasilPermintaanPembelian extends HasilDokumenPengadaan {
  permintaanId: string;
}

export interface HasilPurchaseOrder extends HasilDokumenPengadaan {
  poId: string;
}

export interface HasilPenerimaan {
  dokumen: Dokumen;
  penerimaanId: string;
  statusPo: StatusDokumen;
}

export interface HasilQC {
  dokumen: Dokumen;
  status: StatusDokumen;
  totalNilai: string;
  jurnalId: string | null;
}

export interface PermintaanPembelianView {
  dokumenId: string;
  nomor: string;
  status: StatusDokumen;
  versi: number;
  nominal: string | null;
  pemohonId: string;
  pemohonNama: string;
  gudangId: string;
  woId: string | null;
  keterangan: string | null;
  tanggalButuh: string;
  createdAt: string;
  updatedAt: string;
}

export interface PenawaranHarga {
  id: string;
  permintaanId: string;
  itemId: string;
  pemasokId: string;
  harga: string;
  tanggal: string;
  createdAt: string;
}

export interface SimpanPenawaranHargaInput {
  permintaanId: string;
  itemId: string;
  pemasokId: string;
  harga: string;
  tanggal: string;
  actorId: string;
}

export interface TetapkanPemasokDenganAlasanInput {
  permintaanId: string;
  versi: number;
  pemasokId: string;
  alasan?: string;
  actorId: string;
}

export interface PemilihanPemasokView {
  header: PermintaanPembelianView;
  items: PermintaanPembelianItem[];
  penawaran: PenawaranHarga[];
  pemasokTerpilihId: string | null;
  pemasokTerpilihNama: string | null;
  alasanPemilihan: string | null;
  riwayat: RiwayatStatus[];
}

export interface RiwayatHarga {
  id: string;
  produkId: string;
  pemasokId: string;
  pemasokNama: string;
  harga: string;
  tanggal: string;
}

export interface KonfigurasiPajak {
  id: string;
  nama: string;
  ppnPersen: string;
  berlakuMulai: string;
  aktif: boolean;
}

export interface PurchaseOrderView {
  dokumenId: string;
  nomor: string;
  status: StatusDokumen;
  versi: number;
  tanggal: string;
  pemasokId: string;
  pemasokNama: string;
  permintaanId: string;
  permintaanNomor: string | null;
  nominal: string | null;
  catatanKonfirmasi: string | null;
  createdAt: string;
}

export interface PurchaseOrderDetail {
  header: PurchaseOrderView;
  items: PurchaseOrderItem[];
  riwayat: RiwayatStatus[];
}

export interface BarisTerbitkanPo {
  itemId: string;
  qty: string;
  hargaSatuan?: string;
}

export interface TerbitkanPoInput {
  permintaanId: string;
  versi: number;
  tanggal: string;
  baris: BarisTerbitkanPo[];
  actorId: string;
}

export interface BatalkanPoInput {
  dokumenId: string;
  versi: number;
  alasan: string;
  actorId: string;
}

export interface CatatKonfirmasiPoInput {
  dokumenId: string;
  catatan: string;
  actorId: string;
}

export interface PenerimaanView {
  dokumenId: string;
  nomor: string;
  status: StatusDokumen;
  versi: number;
  jenis: JenisPenerimaan;
  tanggal: string;
  poId: string;
  poNomor: string | null;
  gudangId: string;
  gudangNama: string;
  createdAt: string;
}

export interface PenerimaanItemView {
  id: string;
  poItemId: string;
  produkId: string;
  qtyDiterima: string;
  qtyLulus: string | null;
  qtyPo: string;
}

export interface PenerimaanDetail {
  header: PenerimaanView;
  items: PenerimaanItemView[];
  riwayat: RiwayatStatus[];
  bisaDibatalkan: boolean;
}

export interface BarisPoSiapTerima {
  poItemId: string;
  produkId: string;
  qtyPo: string;
  sisa: string;
}

export interface PoSiapTerima {
  header: PurchaseOrderView;
  items: BarisPoSiapTerima[];
}

export interface ExceptionPengadaanView {
  id: string;
  tipe: string;
  poId: string;
  poNomor: string | null;
  produkId: string | null;
  qtyPo: string;
  qtyDiterima: string;
  selisih: string;
  alasan: string | null;
  status: string;
  createdAt: string;
}

export interface BatalkanPenerimaanInput {
  dokumenId: string;
  versi: number;
  alasan: string;
  actorId: string;
}

export interface TutupExceptionInput {
  exceptionId: string;
  alasan: string;
  actorId: string;
}

export interface PenerimaanQcItem {
  id: string;
  produkId: string;
  produkTipe: string;
  qtyDiterima: string;
  qtyLulus: string | null;
  hargaPo: string;
  lokasiPemisahan: string | null;
  qtyGagalTersedia: string;
}

export interface PenerimaanQcView {
  header: PenerimaanView;
  items: PenerimaanQcItem[];
  riwayat: RiwayatStatus[];
}

export interface ReturPemasokView {
  dokumenId: string;
  nomor: string;
  status: StatusDokumen;
  versi: number;
  penerimaanId: string;
  penerimaanNomor: string | null;
  pemasokNama: string;
  alasan: string | null;
  createdAt: string;
}

export interface ReturPemasokItemView {
  id: string;
  penerimaanItemId: string;
  produkId: string;
  qty: string;
}

export interface ReturPemasokDetail {
  header: ReturPemasokView;
  items: ReturPemasokItemView[];
  riwayat: RiwayatStatus[];
}

export interface AjukanReturInput {
  penerimaanId: string;
  alasan?: string;
  baris: readonly { penerimaanItemId: string; qty: string }[];
  actorId: string;
}

export interface PutuskanReturInput {
  dokumenId: string;
  versi: number;
  setuju: boolean;
  alasan?: string;
  actorId: string;
}

export interface BatalkanReturInput {
  dokumenId: string;
  versi: number;
  alasan: string;
  actorId: string;
}

export interface LokasiPemisahanInput {
  penerimaanItemId: string;
  lokasi: string;
  actorId: string;
}

export interface InvoicePemasokItem {
  id: string;
  penerimaanItemId: string;
  produkId: string;
  qty: string;
  hargaSatuanDpp: string;
  qtyLulus: string;
  hargaPo: string;
}

export interface InvoicePemasokView {
  dokumenId: string;
  nomor: string;
  status: StatusDokumen;
  versi: number;
  nomorInvoice: string;
  tanggal: string;
  terminHari: number;
  jatuhTempo: string;
  nomorFakturPajak: string | null;
  dppTotal: string;
  ppnNilai: string;
  total: string;
  catatan: string | null;
  penerimaanId: string;
  penerimaanNomor: string | null;
  pemasokNama: string;
  createdAt: string;
}

export interface InvoicePemasokDetail {
  header: InvoicePemasokView;
  items: InvoicePemasokItem[];
  riwayat: RiwayatStatus[];
}

export interface BarisInvoice {
  penerimaanItemId: string;
  qty: string;
  hargaSatuanDpp: string;
}

export interface CatatInvoiceInput {
  penerimaanId: string;
  nomorInvoice: string;
  tanggal: string;
  terminHari: number;
  nomorFakturPajak?: string;
  ppnNilai: string;
  baris: readonly BarisInvoice[];
  actorId: string;
}

export interface CocokkanUlangInvoiceInput {
  dokumenId: string;
  versi: number;
  ppnNilai: string;
  baris: readonly BarisInvoice[];
  actorId: string;
}

export interface SahkanInvoiceInput {
  dokumenId: string;
  versi: number;
  actorId: string;
}

export interface BatalkanInvoiceInput {
  dokumenId: string;
  versi: number;
  alasan: string;
  actorId: string;
}

export interface PenerimaanSiapInvoice {
  header: PenerimaanView;
  items: {
    penerimaanItemId: string;
    produkId: string;
    qtyLulus: string;
    hargaPo: string;
  }[];
}

export interface RekeningBank {
  id: string;
  namaBank: string;
  nomor: string;
  namaPemilik: string;
  aktif: boolean;
}

export interface PembayaranPemasokView {
  dokumenId: string;
  nomor: string;
  status: StatusDokumen;
  versi: number;
  pemasokId: string;
  pemasokNama: string;
  rekeningBankId: string;
  rekeningLabel: string;
  nominal: string;
  tanggal: string;
  alasanGagal: string | null;
  buktiTransferPath: string | null;
  diverifikasiOleh: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface PembayaranAlokasiView {
  id: string;
  invoiceId: string;
  invoiceNomor: string | null;
  nominal: string;
  urutan: number;
}

export interface PembayaranPemasokDetail {
  header: PembayaranPemasokView;
  alokasi: PembayaranAlokasiView[];
  riwayat: RiwayatStatus[];
}

export interface UtangInvoiceView {
  invoiceId: string;
  nomor: string;
  nomorInvoice: string;
  pemasokId: string;
  pemasokNama: string;
  tanggal: string;
  jatuhTempo: string;
  total: string;
  sisa: string;
  status: StatusDokumen;
}

export interface CatatPembayaranInput {
  pemasokId: string;
  rekeningBankId: string;
  nominal: string;
  tanggal: string;
  actorId: string;
}

export interface VerifikasiPembayaranInput {
  dokumenId: string;
  actorId: string;
}

export interface HasilTransferInput {
  dokumenId: string;
  versi: number;
  berhasil: boolean;
  buktiPath?: string;
  alasan?: string;
  actorId: string;
}

export interface BatalkanPembayaranInput {
  dokumenId: string;
  versi: number;
  alasan: string;
  actorId: string;
}
