import type { ValuationStrategy } from "./types";

/**
 * Pembulatan desimal sesuai konvensi D-56:
 * uang: 2 desimal
 * harga / qty: 4 desimal
 */
export function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/**
 * MovingAverageValuation (D-10):
 * Rata-rata bergerak dengan aturan operasional OQ-05-03:
 * - Masuk: nilai_masuk = pembulatan(qty * harga_satuan, 2)
 *   nilai_baru = nilai_lama + nilai_masuk
 *   qty_baru = qty_lama + qty
 *   harga_rata_baru = pembulatan(nilai_baru / qty_baru, 4)
 * - Keluar: nilai_keluar = pembulatan(qty * harga_rata, 2)
 *   Bila menghabiskan saldo: nilai_keluar = nilai_lama, qty_baru = 0, nilai_baru = 0, harga_rata dipertahankan.
 */
export class MovingAverageValuation implements ValuationStrategy {
  calculateIncoming(
    currentQty: number,
    currentNilai: number,
    currentHargaRata: number,
    incomingQty: number,
    incomingHarga: number,
  ) {
    if (incomingQty <= 0) {
      throw new Error("Qty masuk harus lebih dari nol.");
    }
    const effectiveHarga = incomingHarga > 0 ? incomingHarga : currentHargaRata;
    const nilaiMasuk = round(incomingQty * effectiveHarga, 2);
    const qtyBaru = round(currentQty + incomingQty, 4);
    const nilaiBaru = round(currentNilai + nilaiMasuk, 2);
    const hargaRataBaru = round(nilaiBaru / qtyBaru, 4);

    return {
      qtyBaru,
      nilaiBaru,
      hargaRataBaru,
      nilaiMasuk,
    };
  }

  calculateOutgoing(
    currentQty: number,
    currentNilai: number,
    currentHargaRata: number,
    outgoingQty: number,
  ) {
    if (outgoingQty <= 0) {
      throw new Error("Qty keluar harus lebih dari nol.");
    }
    if (outgoingQty > currentQty) {
      throw new Error(
        `Qty keluar ${outgoingQty} melebihi stok tersedia ${currentQty}.`,
      );
    }

    if (outgoingQty === currentQty) {
      // Seluruh saldo keluar: selisih pembulatan ikut keluar, harga_rata dipertahankan
      return {
        qtyBaru: 0,
        nilaiBaru: 0,
        hargaRataBaru: currentHargaRata,
        nilaiKeluar: currentNilai,
      };
    }

    const nilaiKeluar = round(outgoingQty * currentHargaRata, 2);
    const qtyBaru = round(currentQty - outgoingQty, 4);
    const nilaiBaru = round(currentNilai - nilaiKeluar, 2);

    return {
      qtyBaru,
      nilaiBaru,
      hargaRataBaru: currentHargaRata,
      nilaiKeluar,
    };
  }
}

export const defaultValuationStrategy = new MovingAverageValuation();
