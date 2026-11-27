import type { StatusOption } from "@/components/ui";

export const STATUS_INVOICE: readonly StatusOption[] = [
  { value: "COCOK", label: "Cocok", tone: "success" },
  { value: "SELISIH", label: "Selisih", tone: "warning" },
  { value: "TERCATAT", label: "Utang tercatat", tone: "info" },
  { value: "DIBAYAR_SEBAGIAN", label: "Dibayar sebagian", tone: "warning" },
  { value: "LUNAS", label: "Lunas", tone: "success" },
  { value: "DIBATALKAN", label: "Dibatalkan", tone: "neutral" },
];

export {
  formatQty,
  formatTanggal,
  formatTanggalSingkat,
  labelAksi,
} from "../permintaan/format";
