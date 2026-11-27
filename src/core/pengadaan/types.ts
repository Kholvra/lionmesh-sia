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
