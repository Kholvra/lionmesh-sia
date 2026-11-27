import type { BomItem } from "@/modules/produksi/bom-produk/types";
import { STOK_BAHAN_TERSEDIA_TON } from "@/modules/produksi/perintah-produksi/types";

export interface KebutuhanBahan {
  perLembarKg: number;
  persenScrap: number;
  totalKg: number;
  totalTon: number;
  stokTersediaTon: number;
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

/** Single source for the material requirement used by SPK and PR screens. */
export function hitungKebutuhanBahan(
  jumlahLembar: number,
  bom: Pick<
    BomItem,
    "jumlahPerLembarKg" | "toleransiScrap" | "komponenKode"
  >,
): KebutuhanBahan {
  const persenScrap = Number.parseFloat(
    bom.toleransiScrap.replace("%", "").replace(",", ".").trim(),
  );
  const scrapValid = Number.isFinite(persenScrap) ? persenScrap : 0;
  const totalKg = jumlahLembar * bom.jumlahPerLembarKg * (1 + scrapValid / 100);
  const totalTon = totalKg / 1000;
  const stokTersediaTon = STOK_BAHAN_TERSEDIA_TON[bom.komponenKode] ?? 3.2;
  const kebutuhanTon = Number(totalTon.toFixed(1));
  const tersediaTon = Number(stokTersediaTon.toFixed(1));
  const kekuranganTon = Number(
    Math.max(0.1, kebutuhanTon - tersediaTon).toFixed(1),
  );

  return {
    perLembarKg: bom.jumlahPerLembarKg,
    persenScrap: scrapValid,
    totalKg,
    totalTon,
    stokTersediaTon,
    kekuranganTon,
    isKurang: totalTon > stokTersediaTon,
    perLembarText: `${bom.jumlahPerLembarKg.toLocaleString("id-ID", {
      minimumFractionDigits: 1,
    })} kg + scrap ${bom.toleransiScrap}`,
    totalTonText: formatTon(totalTon),
    tersediaTonText: formatTon(stokTersediaTon),
    kebutuhanText: formatTon(kebutuhanTon),
    kekuranganText: formatTon(kekuranganTon),
  };
}
