import type { StatusOption } from "@/components/ui";

export const STATUS_PENERIMAAN: readonly StatusOption[] = [
  { value: "DITERIMA", label: "Dicatat, menunggu QC", tone: "warning" },
  { value: "QC_LULUS", label: "QC lulus", tone: "success" },
  { value: "QC_GAGAL", label: "QC gagal", tone: "danger" },
  { value: "DIBATALKAN", label: "Dibatalkan", tone: "neutral" },
];

export {
  formatQty,
  formatTanggal,
  formatTanggalSingkat,
  labelAksi,
} from "../permintaan/format";
