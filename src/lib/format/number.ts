/**
 * Formats decimal strings without passing them through a lossy number when the
 * integer part is large. Matches the numeric(18,6) columns used by C-011.
 */
const ribuanFormatter = new Intl.NumberFormat("id-ID");

/** Groups an integer with Indonesian separators without losing BigInt precision. */
export function kelompokkanRibuan(nilai: bigint | string): string {
  return ribuanFormatter.format(BigInt(nilai));
}

export function formatDesimal(nilai: string, maksDesimal = 2): string {
  const [bulatRaw = "0", pecahanRaw = ""] = nilai.split(".");
  const bulat = BigInt(bulatRaw === "" ? "0" : bulatRaw);
  const pecahan = pecahanRaw
    .padEnd(maksDesimal, "0")
    .slice(0, maksDesimal)
    .replace(/0+$/, "");

  const grup = kelompokkanRibuan(bulat);

  return pecahan.length > 0 ? `${grup},${pecahan}` : grup;
}
