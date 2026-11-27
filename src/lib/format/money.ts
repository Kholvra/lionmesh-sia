/**
 * Canonical formatter for integer cents. Callers holding decimal rupiah must
 * convert to cents explicitly before passing a value here.
 */
import { kelompokkanRibuan } from "./number.ts";

const POLA_CENTS = /^-?\d+$/;

export function formatRupiah(cents: bigint | string): string {
  if (typeof cents === "string" && !POLA_CENTS.test(cents)) {
    throw new Error(`Nilai sen tidak valid: ${cents}`);
  }
  const nilai = typeof cents === "bigint" ? cents : BigInt(cents);
  const negatif = nilai < BigInt(0);
  const absolut = negatif ? -nilai : nilai;
  const utuh = kelompokkanRibuan(absolut / BigInt(100));
  const pecahan = (absolut % BigInt(100)).toString().padStart(2, "0");
  return `${negatif ? "-" : ""}Rp ${utuh},${pecahan}`;
}
