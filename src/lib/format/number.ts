/**
 * Formats a decimal string without passing it through a lossy number when the
 * integer part is large. Matches the numeric(18,6) columns used by C-011.
 */
export function formatDesimal(nilai: string, maksDesimal = 2): string {
  const [bulatRaw = "0", pecahanRaw = ""] = nilai.split(".");
  const bulat = BigInt(bulatRaw === "" ? "0" : bulatRaw);
  const pecahan = pecahanRaw
    .padEnd(maksDesimal, "0")
    .slice(0, maksDesimal)
    .replace(/0+$/, "");

  const grup = new Intl.NumberFormat("id-ID").format(bulat);

  return pecahan.length > 0 ? `${grup},${pecahan}` : grup;
}

export function formatRupiah(nilai: string | number): string {
  return `Rp ${formatDesimal(typeof nilai === "number" ? String(nilai) : nilai, 2)}`;
}
