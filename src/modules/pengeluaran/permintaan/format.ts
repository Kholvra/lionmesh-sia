import type { StatusOption } from "@/components/ui";

export const STATUS_PERMINTAAN: readonly StatusOption[] = [
  { value: "DIAJUKAN", label: "Diajukan", tone: "info" },
  { value: "REVISI", label: "Revisi", tone: "warning" },
  { value: "MENUNGGU_PERSETUJUAN", label: "Menunggu persetujuan", tone: "warning" },
  { value: "DISETUJUI", label: "Disetujui", tone: "success" },
  { value: "PEMASOK_DITETAPKAN", label: "Pemasok ditetapkan", tone: "success" },
  { value: "DITERBITKAN", label: "PO terbit", tone: "info" },
  { value: "DITOLAK", label: "Ditolak", tone: "danger" },
  { value: "DIBATALKAN", label: "Dibatalkan", tone: "neutral" },
];

export function formatTanggal(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatTanggalSingkat(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
  }).format(new Date(`${value}T00:00:00`));
}

export function formatQty(value: string): string {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 4,
  }).format(Number(value));
}

const LABEL_AKSI: Record<string, string> = {
  BUAT: "Permintaan dibuat",
  PERIKSA: "Diperiksa Purchasing",
  SETUJUI: "Disetujui",
  TOLAK: "Ditolak",
  REVISI: "Dikembalikan untuk revisi",
  REVISI_SELESAI: "Revisi selesai",
  AJUKAN: "Diajukan",
  BATAL: "Dibatalkan",
  PILIH_PEMASOK: "Pemasok ditetapkan",
  TERBITKAN: "PO diterbitkan",
};

export function labelAksi(aksi: string): string {
  return LABEL_AKSI[aksi] ?? aksi;
}
