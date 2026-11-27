import type { SesiPenggajian } from "@/modules/penggajian/akun/akun";
import { daftarAktif, semuaKaryawan } from "@/modules/penggajian/karyawan/store";
import type { Karyawan } from "@/modules/penggajian/karyawan/types";
import type { PeriodeGaji, ValidasiDepartemen } from "@/modules/penggajian/periode/types";
import { semuaLembur, semuaPresensi } from "@/modules/penggajian/presensi/store";
import type { Kehadiran, Lembur, Presensi } from "@/modules/penggajian/presensi/types";

export type RekapKaryawan = {
  id: string;
  nama: string;
  nik: string;
  departemenId: string;
  jumlah: Record<Kehadiran, number>;
  lemburMenit: number;
  nomorSpl: string[];
  /** Hadir rows without a clock-out: the recap cannot be saved with them. */
  belumLengkap: string[];
  tanpaEntri: boolean;
  presensi: Presensi[];
  lembur: Lembur[];
};

export type RekapDepartemen = {
  id: string;
  nama: string;
  karyawan: RekapKaryawan[];
  validasi: ValidasiDepartemen | undefined;
};

export type AksesRekap = { bolehMembaca: boolean; hr: boolean; departemenIds: readonly string[] };

export function aksesRekap(sesi: SesiPenggajian): AksesRekap {
  const hr = sesi.peran === "HR";
  const departemenIds = sesi.peran === "Supervisor Lapangan" ? sesi.departemenIds : [];
  return { bolehMembaca: hr || departemenIds.length > 0, hr, departemenIds };
}

/** Active at any point of the period: joined before it ends and left after it starts. */
export function aktifDalamPeriode(karyawan: Karyawan, periode: PeriodeGaji): boolean {
  if (karyawan.tanggalMasuk > periode.selesai) return false;
  if (karyawan.tanggalKeluar && karyawan.tanggalKeluar < periode.mulai) return false;
  return karyawan.status === "AKTIF" || Boolean(karyawan.tanggalKeluar);
}

function rekapKaryawan(karyawan: Karyawan, periode: PeriodeGaji): RekapKaryawan {
  const dalam = (row: { karyawanId: string; tanggal: string }) =>
    row.karyawanId === karyawan.id && row.tanggal >= periode.mulai && row.tanggal <= periode.selesai;
  const presensi = semuaPresensi().filter(dalam).sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  const lembur = semuaLembur().filter((row) => dalam(row) && row.status !== "DIBATALKAN");
  const jumlah = { HADIR: 0, IZIN: 0, SAKIT: 0, ALPHA: 0, CUTI: 0 };
  for (const row of presensi) jumlah[row.kehadiran] += 1;
  return {
    id: karyawan.id,
    nama: karyawan.nama,
    nik: karyawan.nik,
    departemenId: karyawan.departemenId,
    jumlah,
    lemburMenit: lembur.reduce((total, row) => total + row.menit, 0),
    nomorSpl: lembur.map((row) => row.nomorSpl),
    belumLengkap: presensi.filter((row) => row.kehadiran === "HADIR" && !row.jamPulang).map((row) => row.tanggal),
    tanpaEntri: presensi.length === 0,
    presensi,
    lembur,
  };
}

/** Departments that have at least one active employee in the period (AC-11). */
export function rekapPeriode(periode: PeriodeGaji): RekapDepartemen[] {
  const karyawan = semuaKaryawan().filter((k) => aktifDalamPeriode(k, periode));
  return daftarAktif()
    .departemen.map((dep) => ({
      id: dep.id,
      nama: dep.nama,
      karyawan: karyawan.filter((k) => k.departemenId === dep.id).map((k) => rekapKaryawan(k, periode)),
      validasi: periode.validasi.find((v) => v.departemenId === dep.id),
    }))
    .filter((dep) => dep.karyawan.length > 0);
}

export function getRekap(sesi: SesiPenggajian, periode: PeriodeGaji): RekapDepartemen[] {
  const akses = aksesRekap(sesi);
  if (!akses.bolehMembaca) return [];
  const semua = rekapPeriode(periode);
  return akses.hr ? semua : semua.filter((dep) => akses.departemenIds.includes(dep.id));
}

export function getRekapKaryawan(sesi: SesiPenggajian, periode: PeriodeGaji, karyawanId: string) {
  for (const dep of getRekap(sesi, periode)) {
    const row = dep.karyawan.find((k) => k.id === karyawanId);
    if (row) return { departemen: dep, karyawan: row };
  }
  return null;
}
