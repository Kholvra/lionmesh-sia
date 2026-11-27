import type { BomItem } from "@/modules/produksi/bom-produk/types";

export interface KebutuhanBahan {
  perLembarKg: number;
  persenScrap: number;
  totalKg: number;
  totalTon: number;
  stokTersediaTon: number | null;
  kekuranganTon: number;
  isKurang: boolean;
  perLembarText: string;
  totalTonText: string;
  tersediaTonText: string;
  kebutuhanText: string;
  kekuranganText: string;
}

function formatTon(value: number): string {
  return `${value.toLocaleString("id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} ton`;
}

/**
 * Material requirement for one WO. Stock is supplied by the caller from the
 * inventory read model; no default or exemplar stock exists here.
 */
export function hitungKebutuhanBahan(
  jumlahLembar: number,
  bom: Pick<
    BomItem,
    "jumlahPerLembarKg" | "toleransiScrap" | "komponenKode"
  >,
  stokTersediaTon: number | null,
): KebutuhanBahan | null {
  const persenScrap = Number(
    bom.toleransiScrap.replace("%", "").replace(",", ".").trim(),
  );
  if (
    !Number.isFinite(jumlahLembar) ||
    jumlahLembar <= 0 ||
    !Number.isFinite(bom.jumlahPerLembarKg) ||
    bom.jumlahPerLembarKg <= 0 ||
    !Number.isFinite(persenScrap) ||
    persenScrap < 0 ||
    persenScrap >= 100 ||
    (stokTersediaTon !== null &&
      (!Number.isFinite(stokTersediaTon) || stokTersediaTon < 0))
  ) {
    return null;
  }

  const totalKg = jumlahLembar * bom.jumlahPerLembarKg * (1 + persenScrap / 100);
  const totalTon = totalKg / 1000;
  const stok = stokTersediaTon;
  const kekuranganTon = Math.max(0, totalTon - (stok ?? 0));

  return {
    perLembarKg: bom.jumlahPerLembarKg,
    persenScrap,
    totalKg,
    totalTon,
    stokTersediaTon: stok,
    kekuranganTon,
    isKurang: stok === null || totalTon > stok,
    perLembarText: `${bom.jumlahPerLembarKg.toLocaleString("id-ID", {
      minimumFractionDigits: 1,
    })} kg + scrap ${bom.toleransiScrap}`,
    totalTonText: formatTon(totalTon),
    tersediaTonText: stok === null ? "Stok belum tercatat" : formatTon(stok),
    kebutuhanText: formatTon(Number(totalTon.toFixed(1))),
    kekuranganText: formatTon(Number(kekuranganTon.toFixed(1))),
  };
}
