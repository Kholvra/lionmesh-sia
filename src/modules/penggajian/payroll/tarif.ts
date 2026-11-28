import { TER_KATEGORI_A, TER_KATEGORI_B, TER_KATEGORI_C } from "@/modules/penggajian/payroll/tarif-ter";
import type { BarisTer } from "@/modules/penggajian/payroll/tarif-ter";

/*
 * Versioned rate tables (D-19). A period uses, per table, the newest version
 * whose berlakuDari is on or before the period's last day (P-09). Every
 * version names its source; values tagged "contoh" are not regulations but
 * company policy, and stay sample data until the tech lead fills them (P-02).
 */

export type VersiTarif<T> = { versi: string; berlakuDari: string; sumber: string; contoh?: boolean; nilai: T };

export type TarifBpjs = {
  jhtPekerjaPersen: number;
  jpPekerjaPersen: number;
  jpBatasUpah: number;
  kesehatanPekerjaPersen: number;
  kesehatanBatasUpah: number;
};

/** Overtime multipliers per golongan; only working-day overtime has a verified table. */
export type TarifLembur = { pembagiUpahSejam: number; pengaliJamPertama: number; pengaliJamBerikutnya: number };

export type TarifPerusahaan = {
  tunjanganTetapPerJabatan: Record<string, number>;
  tunjanganKehadiranPerHari: number;
};

export type TabelTarif = {
  ter: VersiTarif<{ A: readonly BarisTer[]; B: readonly BarisTer[]; C: readonly BarisTer[] }>[];
  bpjs: VersiTarif<TarifBpjs>[];
  lemburHariKerja: VersiTarif<TarifLembur>[];
  perusahaan: VersiTarif<TarifPerusahaan>[];
};

const BPJS_2025: TarifBpjs = {
  jhtPekerjaPersen: 2,
  jpPekerjaPersen: 1,
  jpBatasUpah: 10_547_400,
  kesehatanPekerjaPersen: 1,
  kesehatanBatasUpah: 12_000_000,
};

const SUMBER_BPJS =
  "JHT 2%: PP 46/2015 Pasal 16; JP 1%: PP 45/2015; Kesehatan 1% dan batas Rp12.000.000: Perpres 64/2020 Pasal 30 dan 32";

const globalStore = globalThis as typeof globalThis & { __tarifPayroll?: TabelTarif };

export function tabelTarif(): TabelTarif {
  globalStore.__tarifPayroll ??= {
    ter: [{ versi: "TER-2024-01", berlakuDari: "2024-01-01", sumber: "Lampiran PP 58/2023 huruf A, B, C", nilai: { A: TER_KATEGORI_A, B: TER_KATEGORI_B, C: TER_KATEGORI_C } }],
    bpjs: [
      { versi: "BPJS-2025-03", berlakuDari: "2025-03-01", sumber: `${SUMBER_BPJS}; batas JP Rp10.547.400 (Maret 2025)`, nilai: BPJS_2025 },
      {
        versi: "BPJS-2026-03",
        berlakuDari: "2026-03-01",
        sumber: `${SUMBER_BPJS}; batas JP Rp11.086.300 sejak Maret 2026 (SE BPJS Ketenagakerjaan B/1226/022026)`,
        nilai: { ...BPJS_2025, jpBatasUpah: 11_086_300 },
      },
    ],
    lemburHariKerja: [
      {
        versi: "LEMBUR-HK-2021",
        berlakuDari: "2021-02-02",
        sumber: "PP 35/2021 Pasal 31 ayat (1) dan Pasal 32: upah sejam 1/173 upah sebulan; jam pertama 1,5 kali, jam berikutnya 2 kali",
        nilai: { pembagiUpahSejam: 173, pengaliJamPertama: 1.5, pengaliJamBerikutnya: 2 },
      },
    ],
    perusahaan: [
      {
        versi: "PERUSAHAAN-CONTOH-2026",
        berlakuDari: "2026-01-01",
        sumber: "Data contoh prototipe; nilai kebijakan perusahaan belum diisi tech lead",
        contoh: true,
        nilai: {
          tunjanganTetapPerJabatan: {
            "jab-operator": 500_000,
            "jab-operator-senior": 750_000,
            "jab-staf-administrasi": 600_000,
            "jab-staf-penjualan": 600_000,
            "jab-staf-gudang": 500_000,
          },
          tunjanganKehadiranPerHari: 25_000,
        },
      },
    ],
  };
  return globalStore.__tarifPayroll;
}

export function versiBerlaku<T>(daftar: readonly VersiTarif<T>[], tanggalAkhir: string): VersiTarif<T> | null {
  return [...daftar].filter((v) => v.berlakuDari <= tanggalAkhir).sort((a, b) => b.berlakuDari.localeCompare(a.berlakuDari))[0] ?? null;
}
