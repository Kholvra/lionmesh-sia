import type { StatusOption } from "@/components/ui";

export const STATUS_PERIODE: readonly StatusOption[] = [
  { value: "TERBUKA", label: "Terbuka", tone: "info" },
  { value: "REKAP", label: "Rekap", tone: "warning" },
  { value: "TERVALIDASI", label: "Tervalidasi", tone: "success" },
];
