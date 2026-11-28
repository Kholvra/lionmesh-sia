import type { PenawaranHarga, PermintaanPembelianItem } from "@/core/pengadaan";
import { hargaTerbaru } from "../pemilihan/perbandingan.ts";

/**
 * PO line arithmetic. Money stays in integer cents; the gross-per-line rounding
 * matches `buat_po`, so the displayed total equals the stored document nominal.
 */

const SEN = BigInt(100);

function keSkala(nilai: string, skala: number): bigint {
  const cocok = /^(-?)(\d+)(?:\.(\d+))?$/.exec(nilai.trim());
  if (!cocok) return BigInt(0);
  const tanda = cocok[1] === "-" ? BigInt(-1) : BigInt(1);
  const bulat = BigInt(cocok[2] ?? "0");
  const pecahan = BigInt(
    (cocok[3] ?? "").padEnd(skala, "0").slice(0, skala) || "0",
  );
  return tanda * (bulat * BigInt(10 ** skala) + pecahan);
}

function dariSen(sen: bigint): string {
  const bulat = sen / SEN;
  const pecahan = (sen % SEN).toString().padStart(2, "0");
  return `${bulat}.${pecahan}`;
}

export interface BarisPo {
  itemId: string;
  produkId: string;
  qty: string;
  harga: string;
}

export interface TotalPo {
  net: string;
  ppn: string;
  total: string;
}

/** Latest quote of the assigned supplier per request item. */
export function barisDariPermintaan(
  items: readonly PermintaanPembelianItem[],
  penawaran: readonly PenawaranHarga[],
  pemasokId: string,
): BarisPo[] {
  const terbaru = hargaTerbaru(penawaran);
  const baris: BarisPo[] = [];
  for (const item of items) {
    const quote = terbaru.get(`${item.id}|${pemasokId}`);
    if (!quote) continue;
    baris.push({
      itemId: item.id,
      produkId: item.produk_id,
      qty: item.qty,
      harga: quote.harga,
    });
  }
  return baris;
}

export function hitungTotalPo(
  baris: readonly { qty: string; harga: string }[],
  ppnPersen: string,
): TotalPo {
  const ppn = keSkala(ppnPersen, 2);
  let netSen = BigInt(0);
  let totalSen = BigInt(0);

  for (const row of baris) {
    const qty = keSkala(row.qty, 4);
    const harga = keSkala(row.harga, 2);
    // qty(1e-4) * harga(1e-2) = 1e-6 of a rupiah; cents need one more 1e2.
    const netBaris = (qty * harga + BigInt(5_000)) / BigInt(10_000);
    // Gross per line, rounded like buat_po: qty*harga*(1+ppn/100).
    const grossBaris =
      (qty * harga * (BigInt(10_000) + ppn) + BigInt(50_000_000)) /
      BigInt(100_000_000);
    netSen += netBaris;
    totalSen += grossBaris;
  }

  return {
    net: dariSen(netSen),
    ppn: dariSen(totalSen - netSen),
    total: dariSen(totalSen),
  };
}
