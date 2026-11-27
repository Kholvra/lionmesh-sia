import type { SesiPenggajian } from "@/modules/penggajian/akun/akun";
import { aksesPayroll } from "@/modules/penggajian/payroll/akses";
import { cariDraft } from "@/modules/penggajian/payroll/store";
import { tabelTarif } from "@/modules/penggajian/payroll/tarif";
import type { BarisGaji, DraftPayroll } from "@/modules/penggajian/payroll/types";

export type RingkasanDraft = {
  jumlahKaryawan: number;
  totalBruto: number;
  totalPotongan: number;
  totalNeto: number;
  totalSelisih: number;
};

export type DraftView = Omit<DraftPayroll, "baris"> & {
  ringkasan: RingkasanDraft;
  /** Present only for HR and Accounting. */
  baris?: BarisGaji[];
  /** Net per employee, for Finance. */
  neto?: { karyawanId: string; nama: string; nik: string; neto: number }[];
};

export function ringkas(baris: readonly BarisGaji[]): RingkasanDraft {
  const total = (f: (b: BarisGaji) => number) => baris.reduce((t, b) => t + f(b), 0);
  return {
    jumlahKaryawan: baris.length,
    totalBruto: total((b) => b.totalTambah),
    totalPotongan: total((b) => b.totalKurang),
    totalNeto: total((b) => b.neto),
    totalSelisih: Math.round(total((b) => b.selisihPembulatan) * 100) / 100,
  };
}

export function getDraft(sesi: SesiPenggajian, periodeId: string): DraftView | null {
  const akses = aksesPayroll(sesi);
  const draft = cariDraft(periodeId);
  if (!akses.ringkasan || !draft) return null;
  const { baris, ...rest } = draft;
  return {
    ...rest,
    ringkasan: ringkas(baris),
    baris: akses.rincian ? baris : undefined,
    neto: akses.neto ? baris.map((b) => ({ karyawanId: b.karyawanId, nama: b.nama, nik: b.nik, neto: b.neto })) : undefined,
  };
}

export function getBarisGaji(sesi: SesiPenggajian, periodeId: string, karyawanId: string): BarisGaji | null {
  if (!aksesPayroll(sesi).rincian) return null;
  return cariDraft(periodeId)?.baris.find((b) => b.karyawanId === karyawanId) ?? null;
}

export function getTabelTarif() {
  return tabelTarif();
}
