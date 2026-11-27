import type { StatusOption } from "@/components/ui";

export const STATUS_ENTRI: readonly StatusOption[] = [
  { value: "MENUNGGU_VALIDASI_SUPERVISOR", label: "Menunggu validasi Supervisor", tone: "warning" },
  { value: "TERVALIDASI", label: "Tervalidasi", tone: "success" },
  { value: "DIBATALKAN", label: "Dibatalkan", tone: "neutral" },
];

export const LABEL_KEHADIRAN: Record<string, string> = {
  HADIR: "Hadir",
  IZIN: "Izin",
  SAKIT: "Sakit",
  ALPHA: "Alpha",
  CUTI: "Cuti",
};

export const LABEL_SUMBER: Record<string, string> = {
  MANDIRI: "Karyawan",
  HR: "HR atas nama karyawan",
  IMPOR: "Impor mesin",
};
