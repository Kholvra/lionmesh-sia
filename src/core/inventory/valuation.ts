import { parseDecimal, type DecimalOptions } from "../ledger/money.ts";
import type { ValuationStrategy } from "./types";

const PILIHAN_QTY: DecimalOptions = {
  scale: 4,
  allowNegative: false,
  rejectExcessPrecision: true,
  maxWholeDigits: 14,
};
const PILIHAN_NILAI: DecimalOptions = {
  scale: 2,
  allowNegative: false,
  rejectExcessPrecision: true,
  maxWholeDigits: 16,
};

function units(value: string, options: DecimalOptions): bigint {
  const hasil = parseDecimal(value, options);
  if (hasil === null) throw new Error("Nilai desimal tidak valid.");
  return hasil;
}

function decimal(value: bigint, scale: number): string {
  if (value < BigInt(0) || value.toString().length > 18) {
    throw new Error("Hasil valuasi di luar batas saldo yang valid.");
  }
  const digits = value.toString().padStart(scale + 1, "0");
  return `${digits.slice(0, -scale)}.${digits.slice(-scale)}`;
}

function divideRounded(numerator: bigint, denominator: bigint): bigint {
  return (numerator + denominator / BigInt(2)) / denominator;
}

export class MovingAverageValuation implements ValuationStrategy {
  calculateIncoming(currentQty: string, currentNilai: string, currentHargaRata: string, incomingQty: string, incomingHarga: string) {
    const qty = units(currentQty, PILIHAN_QTY);
    const nilai = units(currentNilai, PILIHAN_NILAI);
    const oldPrice = units(currentHargaRata, PILIHAN_QTY);
    const incoming = units(incomingQty, PILIHAN_QTY);
    const price = units(incomingHarga, PILIHAN_QTY);
    if (incoming === BigInt(0)) throw new Error("Qty masuk harus lebih dari nol.");
    const nilaiMasuk = divideRounded(incoming * (price || oldPrice), BigInt(1000000));
    const qtyBaru = qty + incoming;
    const nilaiBaru = nilai + nilaiMasuk;
    const hargaRataBaru = divideRounded(nilaiBaru * BigInt(1000000), qtyBaru);
    return { qtyBaru: decimal(qtyBaru, 4), nilaiBaru: decimal(nilaiBaru, 2), hargaRataBaru: decimal(hargaRataBaru, 4), nilaiMasuk: decimal(nilaiMasuk, 2) };
  }

  calculateOutgoing(currentQty: string, currentNilai: string, currentHargaRata: string, outgoingQty: string) {
    const qty = units(currentQty, PILIHAN_QTY);
    const nilai = units(currentNilai, PILIHAN_NILAI);
    const price = units(currentHargaRata, PILIHAN_QTY);
    const outgoing = units(outgoingQty, PILIHAN_QTY);
    if (outgoing === BigInt(0)) throw new Error("Qty keluar harus lebih dari nol.");
    if (outgoing > qty) throw new Error(`Qty keluar ${outgoingQty} melebihi stok tersedia ${currentQty}.`);
    const nilaiKeluar = outgoing === qty ? nilai : divideRounded(outgoing * price, BigInt(1000000));
    return { qtyBaru: decimal(qty - outgoing, 4), nilaiBaru: decimal(nilai - nilaiKeluar, 2), hargaRataBaru: decimal(price, 4), nilaiKeluar: decimal(nilaiKeluar, 2) };
  }
}

export const defaultValuationStrategy = new MovingAverageValuation();
