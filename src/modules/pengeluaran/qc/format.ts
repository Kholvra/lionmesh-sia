import type { StatusOption } from "@/components/ui";

export const STATUS_QC: readonly StatusOption[] = [
  { value: "DITERIMA", label: "Menunggu QC", tone: "warning" },
  { value: "QC_LULUS", label: "QC lulus", tone: "success" },
  { value: "QC_GAGAL", label: "QC gagal", tone: "danger" },
  { value: "DIBATALKAN", label: "Dibatalkan", tone: "neutral" },
];

export const STATUS_RETUR: readonly StatusOption[] = [
  { value: "DIAJUKAN", label: "Diajukan", tone: "info" },
  { value: "DISETUJUI", label: "Disetujui", tone: "success" },
  { value: "DITOLAK", label: "Ditolak", tone: "danger" },
  { value: "DIBATALKAN", label: "Dibatalkan", tone: "neutral" },
];

export {
  formatQty,
  formatTanggal,
  formatTanggalSingkat,
  labelAksi,
} from "../permintaan/format";
