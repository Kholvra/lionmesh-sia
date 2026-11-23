import type { StatusOption } from "@/components/ui";

export const STATUS_KARYAWAN: readonly StatusOption[] = [
  { value: "AKTIF", label: "Aktif", tone: "success" },
  { value: "NONAKTIF", label: "Nonaktif", tone: "neutral" },
];

export const KEADAAN_GAJI: readonly StatusOption[] = [
  { value: "berlaku", label: "Berlaku", tone: "success" },
  { value: "dijadwalkan", label: "Dijadwalkan", tone: "info" },
  { value: "digantikan", label: "Digantikan", tone: "neutral" },
];
