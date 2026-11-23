/**
 * Formatting helpers shared by reports. They take strings or bigint cents so a
 * value never passes through a floating-point number.
 */

function kelompokkanRibuan(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function formatRupiah(cents: bigint | string): string {
  const nilai = typeof cents === "bigint" ? cents : BigInt(cents);
  const negatif = nilai < BigInt(0);
  const absolut = negatif ? -nilai : nilai;
  const utuh = kelompokkanRibuan((absolut / BigInt(100)).toString());
  const pecahan = (absolut % BigInt(100)).toString().padStart(2, "0");
  return `${negatif ? "-" : ""}Rp ${utuh},${pecahan}`;
}
