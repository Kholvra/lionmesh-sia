import type { StatusOption } from "@/components/ui";

export const STATUS_PO: readonly StatusOption[] = [
  { value: "DITERBITKAN", label: "Diterbitkan", tone: "info" },
  { value: "DITERIMA_SEBAGIAN", label: "Diterima sebagian", tone: "warning" },
  { value: "DITERIMA", label: "Diterima", tone: "success" },
  { value: "DIBATALKAN", label: "Dibatalkan", tone: "neutral" },
];

export {
  formatQty,
  formatTanggal,
  formatTanggalSingkat,
  labelAksi,
} from "../permintaan/format";
