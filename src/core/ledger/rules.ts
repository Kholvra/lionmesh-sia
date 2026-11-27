import type { KelompokAkun } from "./report-types.ts";

/**
 * Single source of truth for the persediaan COA mapping (K8). Product types,
 * report roles, and seeded account numbers stay together: inventory derives
 * its product-type choices here, ledger derives classification roles here.
 */
export const DAFTAR_AKUN_PERSEDIAAN = [
  {
    tipeProduk: "bahan",
    label: "Bahan",
    peran: "persediaan_bahan",
    nomor: "120",
  },
  {
    tipeProduk: "barang_dalam_proses",
    label: "Barang dalam proses",
    peran: "barang_dalam_proses",
    nomor: "121",
  },
  {
    tipeProduk: "barang_jadi",
    label: "Barang jadi",
    peran: "persediaan_barang_jadi",
    nomor: "122",
  },
] as const;

export type AkunPersediaan = (typeof DAFTAR_AKUN_PERSEDIAAN)[number];

const PERAN_ASET = [
  "kas_bank",
  "piutang_usaha",
  ...DAFTAR_AKUN_PERSEDIAAN.map((item) => item.peran),
] as const;

const PERAN_KEWAJIBAN = ["utang_usaha", "gr_ir", "utang_gaji"] as const;
const PERAN_EKUITAS = ["laba_ditahan"] as const;
const PERAN_PENDAPATAN = ["penjualan"] as const;
const PERAN_BEBAN = [
  "hpp",
  "tenaga_kerja_langsung",
  "overhead_pabrik",
  "beban_gaji_admin",
] as const;

/**
 * Reports classify accounts by role, never by account number (D-35 / INV-04).
 * A role outside the approved COA is returned as null so the caller can surface
 * it instead of silently dropping the amount.
 */
export function kelompokAkun(peran: string): KelompokAkun {
  if ((PERAN_ASET as readonly string[]).includes(peran)) return "aset";
  if ((PERAN_KEWAJIBAN as readonly string[]).includes(peran)) return "kewajiban";
  if ((PERAN_EKUITAS as readonly string[]).includes(peran)) return "ekuitas";
  if ((PERAN_PENDAPATAN as readonly string[]).includes(peran)) return "pendapatan";
  if ((PERAN_BEBAN as readonly string[]).includes(peran)) return "beban";
  return null;
}

const PERAN_PERSEDIAAN: readonly string[] = DAFTAR_AKUN_PERSEDIAAN.map(
  (item) => item.peran,
);

export function isPeranPersediaan(peran: string): boolean {
  return PERAN_PERSEDIAAN.includes(peran);
}
