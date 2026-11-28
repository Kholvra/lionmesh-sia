import type { StatusOption } from "@/components/ui";

export const STATUS_TRANSFER: readonly StatusOption[] = [
  { value: "BELUM", label: "Belum dibayar", tone: "neutral" },
  { value: "DITUNDA", label: "Ditunda: rekening bermasalah", tone: "warning" },
  { value: "DIBAYAR", label: "Dibayar", tone: "success" },
  { value: "GAGAL_TRANSFER", label: "Gagal transfer", tone: "danger" },
];

export const HASIL_TRANSFER = [
  { value: "DIBAYAR", label: "Berhasil" },
  { value: "GAGAL_TRANSFER", label: "Gagal" },
] as const;
