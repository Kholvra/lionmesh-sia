/**
 * Canonical formatter for whole-rupiah cents. Callers holding decimal rupiah
 * must convert to cents explicitly before passing a value here.
 */
import { kelompokkanRibuan } from "./number.ts";

const POLA_CENTS = /^-?\d+$/;

export function formatRupiah(cents: bigint | string): string {
  if (typeof cents === "string" && !POLA_CENTS.test(cents)) {
    throw new Error(`Nilai rupiah tidak valid: ${cents}`);
  }
  const nilai = typeof cents === "bigint" ? cents : BigInt(cents);
  if (nilai % BigInt(100) !== BigInt(0)) {
    throw new Error(`Nominal harus bulat tanpa sen: ${cents}`);
  }
  const negatif = nilai < BigInt(0);
  const utuh = kelompokkanRibuan((negatif ? -nilai : nilai) / BigInt(100));
  return `${negatif ? "-" : ""}Rp ${utuh},00`;
}
