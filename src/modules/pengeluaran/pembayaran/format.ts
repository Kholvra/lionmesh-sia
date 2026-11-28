import type { StatusOption } from "@/components/ui";

export const STATUS_BAYAR: readonly StatusOption[] = [
  { value: "DIAJUKAN", label: "Menunggu verifikasi/hasil", tone: "warning" },
  { value: "DIPOSTING", label: "Transfer berhasil", tone: "success" },
  { value: "GAGAL_TRANSFER", label: "Transfer gagal", tone: "danger" },
  { value: "DIBATALKAN", label: "Dibatalkan", tone: "neutral" },
];

export {
  formatTanggal,
  formatTanggalSingkat,
  labelAksi,
} from "../permintaan/format";
