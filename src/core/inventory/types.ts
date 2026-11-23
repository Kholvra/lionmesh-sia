export type TipeMutasi =
  | "MASUK"
  | "KELUAR"
  | "TRANSFER_KELUAR"
  | "TRANSFER_MASUK"
  | "PENYESUAIAN";

export interface SaldoStok {
  produk_id: string;
  gudang_id: string;
  qty: string;
  nilai: string;
  harga_rata: string;
  created_by?: string | null;
  created_at: string;
  updated_by?: string | null;
  updated_at: string;
}

export interface MutasiStok {
  id: string;
  produk_id: string;
  gudang_id: string;
  tanggal: string;
  tipe: TipeMutasi;
  qty: string;
  harga_satuan: string;
  nilai: string;
  sumber_tipe: string;
  sumber_id: string;
  alasan?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_by?: string | null;
  updated_at: string;
}

export interface CatatMutasiInput {
  produkId: string;
  gudangId: string;
  tanggal: string | Date;
  tipe: TipeMutasi;
  qty: string;
  hargaSatuan?: string;
  sumberTipe?: string;
  sumberId?: string;
  alasan?: string;
  actorId?: string;
}

export interface CatatMutasiResult {
  mutasiId: string;
  tipe: TipeMutasi;
  qty: string;
  hargaSatuan: string;
  nilai: string;
  saldo: {
    qty: string;
    nilai: string;
    hargaRata: string;
  };
}

export interface TransferStokInput {
  produkId: string;
  gudangAsalId: string;
  gudangTujuanId: string;
  qty: string;
  tanggal?: string | Date;
  sumberId?: string;
  actorId?: string;
}

export interface TransferStokResult {
  transferId: string;
  mutasiKeluarId: string;
  mutasiMasukId: string;
  nilaiTransfer: string;
  saldoAsal: {
    qty: string;
    nilai: string;
    hargaRata: string;
  };
  saldoTujuan: {
    qty: string;
    nilai: string;
    hargaRata: string;
  };
}

export interface OpnameStokInput {
  produkId: string;
  gudangId: string;
  qtyFisik: string;
  alasan: string;
  tanggal?: string | Date;
  sumberId?: string;
  actorId?: string;
}

export interface OpnameStokResult {
  opnameId: string;
  mutasiId: string | null;
  selisih: string;
  nilaiPenyesuaian: string;
  saldo: {
    qty: string;
    nilai: string;
    hargaRata: string;
  };
}

/**
 * ValuationStrategy interface (D-10):
 * Valuasi berada di balik antarmuka agar dapat diganti (misalnya ke FIFO) tanpa menyentuh modul.
 */
export interface ValuationStrategy {
  calculateIncoming(
    currentQty: string,
    currentNilai: string,
    currentHargaRata: string,
    incomingQty: string,
    incomingHarga: string,
  ): {
    qtyBaru: string;
    nilaiBaru: string;
    hargaRataBaru: string;
    nilaiMasuk: string;
  };

  calculateOutgoing(
    currentQty: string,
    currentNilai: string,
    currentHargaRata: string,
    outgoingQty: string,
  ): {
    qtyBaru: string;
    nilaiBaru: string;
    hargaRataBaru: string;
    nilaiKeluar: string;
  };
}
