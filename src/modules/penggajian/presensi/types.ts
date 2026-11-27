import type { RiwayatStatus } from "@/modules/penggajian/shared/riwayat";

export const KEHADIRAN = ["HADIR", "IZIN", "SAKIT", "ALPHA", "CUTI"] as const;
export type Kehadiran = (typeof KEHADIRAN)[number];

/** The employee fields presensi screens and rules need (karyawan_aman / karyawan_saya). */
export type KaryawanRingkas = {
  id: string;
  nik: string;
  nama: string;
  status: "AKTIF" | "NONAKTIF";
  departemen: string;
  jabatan: string;
};

export type StatusEntri = "MENUNGGU_VALIDASI_SUPERVISOR" | "TERVALIDASI" | "DIBATALKAN";

/** Who created the row (POST-04, D-53): the employee, HR on their behalf, or a machine import. */
export type SumberEntri = "MANDIRI" | "HR" | "IMPOR";

type JejakEntri = {
  sumber: SumberEntri;
  /** Profile that created the row; that person may not validate it (D-48, GJ-003 AC-09). */
  pencatatProfileId: string;
  dicatatOleh: string;
  dicatatPada: string;
  riwayat: RiwayatStatus[];
};

export type Presensi = JejakEntri & {
  id: string;
  karyawanId: string;
  tanggal: string;
  kehadiran: Kehadiran;
  jamMasuk: string | null;
  jamPulang: string | null;
  keterangan?: string;
  status: Exclude<StatusEntri, "DIBATALKAN">;
};

export type Lembur = JejakEntri & {
  id: string;
  karyawanId: string;
  tanggal: string;
  menit: number;
  nomorSpl: string;
  keterangan: string;
  status: StatusEntri;
  /** Profile that submitted it; only this requester may cancel (PRE-05). */
  pemohonProfileId: string;
};
