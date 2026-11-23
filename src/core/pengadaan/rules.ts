// Input gates for the pengadaan service (B-03). These run before any RPC so an
// empty or malformed form never reaches the database. The state machine and the
// quantity limits stay in the SQL functions; this file only rejects bad input.

export type JenisPenerimaan = "SEBAGIAN" | "PENUH";

export interface BarisPermintaan {
  produkId: string;
  satuanId: string;
  qty: string;
}

export interface BarisPermintaanRpc {
  produk_id: string;
  satuan_id: string;
  qty: string;
}

export interface BarisPO {
  produkId: string;
  qty: string;
  hargaSatuan: string;
  ppnPersen?: string;
}

export interface BarisPORpc {
  produk_id: string;
  qty: string;
  harga_satuan: string;
  ppn_persen: string;
}

export interface BarisPenerimaan {
  poItemId: string;
  qtyDiterima: string;
}

export interface BarisPenerimaanRpc {
  po_item_id: string;
  qty_diterima: string;
}

export interface BarisQC {
  penerimaanItemId: string;
  qtyLulus: string;
}

export interface BarisQCRpc {
  penerimaan_item_id: string;
  qty_lulus: string;
}

// numeric(18,4): at most 13 integer digits and 4 decimal digits, no sign.
const POLA_QTY = /^(?:0|[1-9]\d{0,12})(?:\.\d{1,4})?$/;

function isQtyPositif(value: string): boolean {
  return POLA_QTY.test(value) && Number(value) > 0;
}

function isQtyNonNegatif(value: string): boolean {
  return POLA_QTY.test(value);
}

export function validasiBarisPermintaan(baris: readonly BarisPermintaan[]): string | null {
  if (baris.length === 0) return "Permintaan harus memuat minimal satu barang.";
  for (const [index, item] of baris.entries()) {
    if (!isQtyPositif(item.qty)) {
      return `Qty baris ${index + 1} harus lebih dari 0 dan maksimal 4 angka desimal.`;
    }
  }
  return null;
}

export function petaBarisPermintaan(
  baris: readonly BarisPermintaan[],
): BarisPermintaanRpc[] {
  return baris.map((item) => ({
    produk_id: item.produkId,
    satuan_id: item.satuanId,
    qty: item.qty,
  }));
}

export function validasiBarisPO(baris: readonly BarisPO[]): string | null {
  if (baris.length === 0) return "PO harus memuat minimal satu barang.";
  for (const [index, item] of baris.entries()) {
    if (!isQtyPositif(item.qty)) {
      return `Qty baris ${index + 1} harus lebih dari 0 dan maksimal 4 angka desimal.`;
    }
    if (!isQtyNonNegatif(item.hargaSatuan)) {
      return `Harga satuan baris ${index + 1} tidak boleh negatif.`;
    }
    if (item.ppnPersen !== undefined && item.ppnPersen.trim().length > 0) {
      const ppn = item.ppnPersen.trim();
      if (!POLA_QTY.test(ppn) || Number(ppn) > 100) {
        return `PPN baris ${index + 1} harus antara 0 dan 100.`;
      }
    }
  }
  return null;
}

export function petaBarisPO(baris: readonly BarisPO[]): BarisPORpc[] {
  return baris.map((item) => ({
    produk_id: item.produkId,
    qty: item.qty,
    harga_satuan: item.hargaSatuan,
    ppn_persen: item.ppnPersen?.trim() || "0",
  }));
}

export function validasiJenisPenerimaan(jenis: string): string | null {
  return jenis === "SEBAGIAN" || jenis === "PENUH"
    ? null
    : "Jenis penerimaan harus SEBAGIAN atau PENUH.";
}

export function validasiBarisPenerimaan(
  baris: readonly BarisPenerimaan[],
): string | null {
  if (baris.length === 0) return "Penerimaan harus memuat minimal satu baris.";
  for (const [index, item] of baris.entries()) {
    if (!isQtyPositif(item.qtyDiterima)) {
      return `Qty diterima baris ${index + 1} harus lebih dari 0 dan maksimal 4 angka desimal.`;
    }
  }
  return null;
}

export function petaBarisPenerimaan(
  baris: readonly BarisPenerimaan[],
): BarisPenerimaanRpc[] {
  return baris.map((item) => ({
    po_item_id: item.poItemId,
    qty_diterima: item.qtyDiterima,
  }));
}

export function validasiBarisQC(baris: readonly BarisQC[]): string | null {
  if (baris.length === 0) return "QC harus memuat minimal satu baris.";
  for (const [index, item] of baris.entries()) {
    if (!isQtyNonNegatif(item.qtyLulus)) {
      return `Qty lulus baris ${index + 1} tidak boleh negatif dan maksimal 4 angka desimal.`;
    }
  }
  return null;
}

export function petaBarisQC(baris: readonly BarisQC[]): BarisQCRpc[] {
  return baris.map((item) => ({
    penerimaan_item_id: item.penerimaanItemId,
    qty_lulus: item.qtyLulus,
  }));
}

export function validasiAlasan(alasan: string | null | undefined): string | null {
  return typeof alasan === "string" && alasan.trim().length > 0
    ? null
    : "Alasan pembatalan wajib diisi.";
}

export function validasiVersi(versi: number): string | null {
  return Number.isInteger(versi) && versi >= 0 ? null : "Versi dokumen tidak valid.";
}
