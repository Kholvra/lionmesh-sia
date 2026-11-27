import type { SesiPenggajian } from "@/modules/penggajian/akun/akun";
import { cariKaryawan } from "@/modules/penggajian/karyawan/store";
import type { Rekening } from "@/modules/penggajian/karyawan/types";
import { masalahRekening } from "@/modules/penggajian/pembayaran/rules";
import { cariPembayaran } from "@/modules/penggajian/pembayaran/store";
import type { Batch, Percobaan, StatusTransfer } from "@/modules/penggajian/pembayaran/types";
import { cariDraft } from "@/modules/penggajian/payroll/store";
import type { StatusDraft } from "@/modules/penggajian/payroll/types";

/*
 * GJ-006 readers (T-09): Finance sees accounts and amounts; Accounting sees
 * amounts, statuses, and proofs; HR sees accounts to fix them and statuses for
 * slips; Direksi sees only the period status and counts.
 */
export type AksesPembayaran = { membaca: boolean; rekening: boolean; nominal: boolean; perKaryawan: boolean; bayar: boolean };

export function aksesPembayaran(sesi: SesiPenggajian): AksesPembayaran {
  const p = sesi.peran;
  return {
    membaca: p === "Finance" || p === "Accounting" || p === "HR" || p === "Direksi",
    rekening: p === "Finance" || p === "HR",
    nominal: p === "Finance" || p === "Accounting",
    perKaryawan: p !== "Direksi",
    bayar: p === "Finance",
  };
}

export type BarisPembayaran = {
  karyawanId: string;
  nama: string;
  nik: string;
  rekening?: Rekening;
  nominal?: number;
  status: StatusTransfer | "BELUM" | "DITUNDA";
  masalahRekening: string | null;
  percobaan: Percobaan[];
};

export type PembayaranView = {
  statusDraft: StatusDraft | null;
  baris: BarisPembayaran[];
  batch: Batch[];
  catatanDana: { oleh: string; pada: string; catatan: string }[];
  jumlah: { dibayar: number; gagal: number; belum: number };
};

export function getPembayaran(sesi: SesiPenggajian, periodeId: string): PembayaranView | null {
  const akses = aksesPembayaran(sesi);
  const draft = cariDraft(periodeId);
  if (!akses.membaca) return null;
  const bayar = cariPembayaran(periodeId);
  const baris: BarisPembayaran[] = (draft?.baris ?? []).map((b) => {
    const rekening = cariKaryawan(b.karyawanId)?.rekening;
    const transfer = bayar?.transfer.find((t) => t.karyawanId === b.karyawanId);
    const masalah = masalahRekening(rekening);
    return {
      karyawanId: b.karyawanId,
      nama: b.nama,
      nik: b.nik,
      rekening: akses.rekening ? rekening : undefined,
      nominal: akses.nominal ? b.neto : undefined,
      status: transfer?.status ?? (masalah ? "DITUNDA" : "BELUM"),
      masalahRekening: masalah,
      percobaan: transfer?.percobaan ?? [],
    };
  });
  const hitung = (s: string) => baris.filter((b) => b.status === s).length;
  return {
    statusDraft: draft?.status ?? null,
    baris: akses.perKaryawan ? baris : [],
    batch: akses.nominal ? (bayar?.batch ?? []) : [],
    catatanDana: bayar?.catatanDana ?? [],
    jumlah: { dibayar: hitung("DIBAYAR"), gagal: hitung("GAGAL_TRANSFER"), belum: baris.length - hitung("DIBAYAR") - hitung("GAGAL_TRANSFER") },
  };
}
