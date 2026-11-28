import { formatTanggal } from "@/modules/penggajian/karyawan/format";
import type { FieldErrors } from "@/modules/penggajian/karyawan/rules";
import { cekPeriodeTerbuka } from "@/modules/penggajian/periode/rules";
import type { PeriodeGaji } from "@/modules/penggajian/periode/types";
import { formatDurasi, menitDariJam } from "@/modules/penggajian/shared/waktu";
import { KEHADIRAN } from "@/modules/penggajian/presensi/types";
import type { KaryawanRingkas, Kehadiran, Lembur } from "@/modules/penggajian/presensi/types";

const TANGGAL_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/*
 * Versioned overtime cap (D-51). Value from PP 35/2021 Pasal 26 ayat (1):
 * overtime is at most 4 hours a day. The weekly 18-hour cap is not enforced
 * yet; it needs the week boundary rule, which is not written down.
 */
export const BATAS_LEMBUR: readonly { berlakuMulai: string; menitPerHari: number; sumber: string }[] = [
  { berlakuMulai: "2021-02-02", menitPerHari: 240, sumber: "PP 35/2021 Pasal 26 ayat (1)" },
];

export function batasLemburUntuk(tanggal: string) {
  return [...BATAS_LEMBUR].reverse().find((versi) => versi.berlakuMulai <= tanggal) ?? null;
}

/** `2`, `2,5`, `1.75`, or `2:30` → whole minutes (P-04: per minute, no rounding to hours). */
export function parseDurasi(nilai: string): number | null {
  const jamMenit = /^(\d{1,2}):([0-5]\d)$/.exec(nilai);
  if (jamMenit) return Number(jamMenit[1]) * 60 + Number(jamMenit[2]);
  const angka = Number(nilai.replace(",", "."));
  if (!nilai || !Number.isFinite(angka)) return null;
  const menit = angka * 60;
  return Number.isInteger(menit) ? menit : null;
}

function cekKaryawan(karyawan: KaryawanRingkas | undefined, errors: FieldErrors) {
  if (!karyawan) errors.karyawanId = "Pilih karyawan.";
  else if (karyawan.status !== "AKTIF") errors.karyawanId = `Karyawan dengan NIK ${karyawan.nik} nonaktif.`;
}

function cekTanggal(tanggal: string, periode: PeriodeGaji | undefined, errors: FieldErrors) {
  if (!TANGGAL_PATTERN.test(tanggal)) {
    errors.tanggal = "Tanggal wajib diisi.";
    return;
  }
  const masalah = cekPeriodeTerbuka(tanggal, periode);
  if (masalah) errors.tanggal = masalah;
}

export type PresensiInput = {
  karyawan: KaryawanRingkas | undefined;
  tanggal: string;
  kehadiran: string;
  jamMasuk: string;
  jamPulang: string;
};

/** Clock-in saves a Hadir row before the employee clocks out, so it skips the jam pulang rule. */
export function validatePresensi(
  input: PresensiInput,
  periode: PeriodeGaji | undefined,
  sudahAda: boolean,
  wajibJamPulang = true,
): FieldErrors {
  const errors: FieldErrors = {};
  cekKaryawan(input.karyawan, errors);
  cekTanggal(input.tanggal, periode, errors);
  if (!KEHADIRAN.includes(input.kehadiran as Kehadiran)) errors.kehadiran = "Pilih kehadiran.";
  if (input.kehadiran === "HADIR") {
    if (menitDariJam(input.jamMasuk) === null) errors.jamMasuk = "Jam masuk wajib diisi untuk Hadir.";
    if (wajibJamPulang && menitDariJam(input.jamPulang) === null) errors.jamPulang = "Jam pulang wajib diisi untuk Hadir.";
  }
  if (!errors.karyawanId && !errors.tanggal && sudahAda && input.karyawan) {
    errors.tanggal = `Presensi NIK ${input.karyawan.nik} tanggal ${formatTanggal(input.tanggal)} sudah ada.`;
  }
  return errors;
}

export type LemburInput = {
  karyawan: KaryawanRingkas | undefined;
  tanggal: string;
  durasi: string;
  nomorSpl: string;
};

export function validateLembur(
  input: LemburInput,
  periode: PeriodeGaji | undefined,
  lemburHariItu: readonly Lembur[],
): FieldErrors {
  const errors: FieldErrors = {};
  cekKaryawan(input.karyawan, errors);
  cekTanggal(input.tanggal, periode, errors);
  if (!input.nomorSpl) errors.nomorSpl = "Nomor SPL wajib diisi.";
  const menit = parseDurasi(input.durasi);
  if (menit === null || menit <= 0) {
    errors.durasi = "Isi jumlah jam lembur, misalnya 2 atau 1:30.";
  } else if (!errors.tanggal) {
    const batas = batasLemburUntuk(input.tanggal);
    const terpakai = lemburHariItu.filter((row) => row.status !== "DIBATALKAN").reduce((jumlah, row) => jumlah + row.menit, 0);
    if (batas && menit + terpakai > batas.menitPerHari) {
      const sisa = terpakai > 0 ? ` Sudah tercatat ${formatDurasi(terpakai)} pada tanggal ini.` : "";
      errors.durasi = `Jam lembur melebihi batas yang berlaku: ${formatDurasi(batas.menitPerHari)} per hari.${sisa}`;
    }
  }
  return errors;
}

const LABEL_STATUS: Record<Lembur["status"], string> = {
  MENUNGGU_VALIDASI_SUPERVISOR: "Menunggu validasi Supervisor",
  TERVALIDASI: "Tervalidasi",
  DIBATALKAN: "Dibatalkan",
};

/** PRE-05: same requester, still waiting for validation, reason given. */
export function validatePembatalan(lembur: Lembur, profileId: string, alasan: string): FieldErrors {
  if (lembur.pemohonProfileId !== profileId) {
    return { alasan: "Hanya pemohon yang bisa membatalkan pengajuan ini." };
  }
  if (lembur.status !== "MENUNGGU_VALIDASI_SUPERVISOR") {
    return { alasan: `Pembatalan ditolak: pengajuan berstatus ${LABEL_STATUS[lembur.status]}. Untuk koreksi, hubungi HR.` };
  }
  return alasan ? {} : { alasan: "Alasan pembatalan wajib diisi." };
}
