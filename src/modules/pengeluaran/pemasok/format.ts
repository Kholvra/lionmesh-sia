import type { StatusOption } from "@/components/ui";

export const STATUS_PEMASOK: readonly StatusOption[] = [
  { value: "aktif", label: "Aktif", tone: "success" },
  { value: "nonaktif", label: "Nonaktif", tone: "neutral" },
];

export function statusPemasok(aktif: boolean): "aktif" | "nonaktif" {
  return aktif ? "aktif" : "nonaktif";
}

export function formatRupiah(value: string | number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value));
}

export function formatPersen(value: string | number): string {
  return `${new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value))}%`;
}

export function formatTanggal(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

const LABEL_AKSI: Record<string, string> = {
  BUAT: "Pemasok dibuat",
  AKTIFKAN: "Pemasok diaktifkan",
  NONAKTIFKAN: "Pemasok dinonaktifkan",
};

export function labelAksi(aksi: string): string {
  return LABEL_AKSI[aksi] ?? aksi;
}
