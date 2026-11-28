import type { StatusOption } from "@/components/ui/status-badge";

export const STATUS_PERIODE: readonly StatusOption[] = [
  { value: "buka", label: "Terbuka", tone: "warning" },
  { value: "kunci", label: "Terkunci", tone: "success" },
  { value: "belum_ada", label: "Belum ada", tone: "neutral" },
];

export const STATUS_TAHUN_BUKU: readonly StatusOption[] = [
  { value: "terbuka", label: "Terbuka", tone: "warning" },
  { value: "ditutup", label: "Ditutup", tone: "success" },
];
