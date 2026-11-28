import type { StatusOption } from "@/components/ui";

export const STATUS_PERIODE: readonly StatusOption[] = [
  { value: "TERBUKA", label: "Terbuka", tone: "info" },
  { value: "REKAP", label: "Rekap", tone: "warning" },
  { value: "TERVALIDASI", label: "Tervalidasi", tone: "success" },
  { value: "DRAFT_TERHITUNG", label: "Draft terhitung", tone: "info" },
  { value: "DIPERIKSA", label: "Diperiksa Accounting", tone: "warning" },
  { value: "REVISI", label: "Revisi", tone: "danger" },
  { value: "DISETUJUI", label: "Disetujui Direksi", tone: "success" },
  { value: "DIBAYAR", label: "Dibayar", tone: "success" },
  { value: "GAGAL_TRANSFER", label: "Gagal transfer", tone: "danger" },
  { value: "DIPOSTING", label: "Diposting", tone: "success" },
];
