import { formatTanggal } from "@/modules/penggajian/karyawan/format";
import { labelStatusPeriode } from "@/modules/penggajian/periode/rules";
import type { PeriodeGaji } from "@/modules/penggajian/periode/types";
import type { RekapDepartemen } from "@/modules/penggajian/rekap/queries";

/** AC-08: no automatic Alpha; every active employee needs an entry, every Hadir a clock-out. */
export function validateSimpanRekap(periode: PeriodeGaji, rekap: readonly RekapDepartemen[]): string | null {
  if (periode.status !== "TERBUKA") {
    return `Rekap ${periode.nama} tidak bisa disimpan: periode berstatus ${labelStatusPeriode(periode.status)}.`;
  }
  const semua = rekap.flatMap((dep) => dep.karyawan);
  const kosong = semua.filter((k) => k.tanpaEntri);
  if (kosong.length > 0) {
    const daftar = kosong.map((k) => `${k.nama} (NIK ${k.nik})`).join(", ");
    return `Rekap ditolak: ${daftar} belum punya entri presensi. Nilai kehadiran wajib diisi; tidak ada Alpha yang dibuat otomatis.`;
  }
  const belum = semua.filter((k) => k.belumLengkap.length > 0);
  if (belum.length > 0) {
    const daftar = belum.map((k) => `${k.nama} (${k.belumLengkap.map(formatTanggal).join(", ")})`).join("; ");
    return `Rekap ditolak: presensi Hadir tanpa jam pulang untuk ${daftar}.`;
  }
  return null;
}

/** AC-04, AC-09: only that department's Supervisor, never the person who recorded its rows. */
export function validateValidasi(
  periode: PeriodeGaji,
  departemen: RekapDepartemen | undefined,
  profileId: string,
): string | null {
  if (periode.status !== "REKAP") {
    return `Validasi hanya untuk periode berstatus Rekap; ${periode.nama} berstatus ${labelStatusPeriode(periode.status)}.`;
  }
  if (!departemen) return "Hanya Supervisor Lapangan departemen ini yang berwenang memvalidasi rekapnya.";
  if (departemen.validasi) return `Rekap ${departemen.nama} sudah divalidasi.`;
  const dicatatSendiri = departemen.karyawan.some((k) =>
    [...k.presensi, ...k.lembur].some((row) => row.pencatatProfileId === profileId),
  );
  if (dicatatSendiri) return "Validasi ditolak: pencatat presensi tidak boleh memvalidasi presensi yang dicatatnya sendiri.";
  return null;
}
