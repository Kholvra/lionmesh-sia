export type TipeMutasi =
  | "MASUK"
  | "KELUAR"
  | "TRANSFER_KELUAR"
  | "TRANSFER_MASUK"
  | "PENYESUAIAN";

export interface SaldoStok {
  produk_id: string;
  gudang_id: string;
  qty: number;
  nilai: number;
  harga_rata: number;
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
  qty: number;
  harga_satuan: number;
  nilai: number;
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
  qty: number;
  hargaSatuan?: number;
  sumberTipe?: string;
  sumberId?: string;
  alasan?: string;
  actorId?: string;
}

export interface CatatMutasiResult {
  mutasiId: string;
  tipe: TipeMutasi;
  qty: number;
  hargaSatuan: number;
  nilai: number;
  saldo: {
    qty: number;
    nilai: number;
    hargaRata: number;
  };
}

export interface TransferStokInput {
  produkId: string;
  gudangAsalId: string;
  gudangTujuanId: string;
  qty: number;
  tanggal?: string | Date;
  sumberId?: string;
  actorId?: string;
}

export interface TransferStokResult {
  transferId: string;
  mutasiKeluarId: string;
  mutasiMasukId: string;
  nilaiTransfer: number;
  saldoAsal: {
    qty: number;
    nilai: number;
    hargaRata: number;
  };
  saldoTujuan: {
    qty: number;
    nilai: number;
    hargaRata: number;
  };
}

export interface OpnameStokInput {
  produkId: string;
  gudangId: string;
  qtyFisik: number;
  alasan: string;
  tanggal?: string | Date;
  sumberId?: string;
  actorId?: string;
}

export interface OpnameStokResult {
  opnameId: string;
  mutasiId: string | null;
  selisih: number;
  nilaiPenyesuaian: number;
  saldo: {
    qty: number;
    nilai: number;
    hargaRata: number;
  };
}

/**
 * ValuationStrategy interface (D-10):
 * Valuasi berada di balik antarmuka agar dapat diganti (misalnya ke FIFO) tanpa menyentuh modul.
 */
export interface ValuationStrategy {
  calculateIncoming(
    currentQty: number,
    currentNilai: number,
    currentHargaRata: number,
    incomingQty: number,
    incomingHarga: number,
  ): {
    qtyBaru: number;
    nilaiBaru: number;
    hargaRataBaru: number;
    nilaiMasuk: number;
  };

  calculateOutgoing(
    currentQty: number,
    currentNilai: number,
    currentHargaRata: number,
    outgoingQty: number,
  ): {
    qtyBaru: number;
    nilaiBaru: number;
    hargaRataBaru: number;
    nilaiKeluar: number;
  };
}
