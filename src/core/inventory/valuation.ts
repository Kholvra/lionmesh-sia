import type { ValuationStrategy } from "./types";

function units(value: string, scale: number): bigint {
  if (!/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value)) throw new Error("Nilai desimal tidak valid.");
  const [whole, fraction = ""] = value.split(".");
  if (whole.length > 18 - scale || fraction.length > scale) throw new Error("Nilai desimal tidak valid.");
  return BigInt(whole) * BigInt(10) ** BigInt(scale) + BigInt(fraction.padEnd(scale, "0"));
}

function decimal(value: bigint, scale: number): string {
  const negative = value < BigInt(0);
  const digits = (negative ? -value : value).toString().padStart(scale + 1, "0");
  return `${negative ? "-" : ""}${digits.slice(0, -scale)}.${digits.slice(-scale)}`;
}

function divideRounded(numerator: bigint, denominator: bigint): bigint {
  return (numerator + denominator / BigInt(2)) / denominator;
}

export class MovingAverageValuation implements ValuationStrategy {
  calculateIncoming(currentQty: string, currentNilai: string, currentHargaRata: string, incomingQty: string, incomingHarga: string) {
    const qty = units(currentQty, 4);
    const nilai = units(currentNilai, 2);
    const oldPrice = units(currentHargaRata, 4);
    const incoming = units(incomingQty, 4);
    const price = units(incomingHarga, 4);
    if (incoming === BigInt(0)) throw new Error("Qty masuk harus lebih dari nol.");
    const nilaiMasuk = divideRounded(incoming * (price || oldPrice), BigInt(1000000));
    const qtyBaru = qty + incoming;
    const nilaiBaru = nilai + nilaiMasuk;
    const hargaRataBaru = divideRounded(nilaiBaru * BigInt(1000000), qtyBaru);
    return { qtyBaru: decimal(qtyBaru, 4), nilaiBaru: decimal(nilaiBaru, 2), hargaRataBaru: decimal(hargaRataBaru, 4), nilaiMasuk: decimal(nilaiMasuk, 2) };
  }

  calculateOutgoing(currentQty: string, currentNilai: string, currentHargaRata: string, outgoingQty: string) {
    const qty = units(currentQty, 4);
    const nilai = units(currentNilai, 2);
    const price = units(currentHargaRata, 4);
    const outgoing = units(outgoingQty, 4);
    if (outgoing === BigInt(0)) throw new Error("Qty keluar harus lebih dari nol.");
    if (outgoing > qty) throw new Error(`Qty keluar ${outgoingQty} melebihi stok tersedia ${currentQty}.`);
    const nilaiKeluar = outgoing === qty ? nilai : divideRounded(outgoing * price, BigInt(1000000));
    return { qtyBaru: decimal(qty - outgoing, 4), nilaiBaru: decimal(nilai - nilaiKeluar, 2), hargaRataBaru: decimal(price, 4), nilaiKeluar: decimal(nilaiKeluar, 2) };
  }
}

export const defaultValuationStrategy = new MovingAverageValuation();
