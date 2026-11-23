import type { StatusOption } from "@/components/ui";
import { DAFTAR_TIPE_PRODUK, type TipeProduk } from "@/core/master/types";

export const STATUS_MASTER: readonly StatusOption[] = [
  { value: "aktif", label: "Aktif", tone: "success" },
  { value: "nonaktif", label: "Nonaktif", tone: "neutral" },
];

export function statusMaster(aktif: boolean): "aktif" | "nonaktif" {
  return aktif ? "aktif" : "nonaktif";
}

export const PILIHAN_TIPE_PRODUK = DAFTAR_TIPE_PRODUK;

export function labelTipe(tipe: TipeProduk): string {
  return DAFTAR_TIPE_PRODUK.find((item) => item.value === tipe)?.label ?? tipe;
}

const LABEL_AKSI: Record<string, string> = {
  BUAT: "Dibuat",
  AKTIFKAN: "Diaktifkan",
  NONAKTIFKAN: "Dinonaktifkan",
};

export function labelAksiMaster(aksi: string): string {
  return LABEL_AKSI[aksi] ?? aksi;
}

export function labelStatus(status: string | null): string {
  if (status === "aktif") return "aktif";
  if (status === "nonaktif") return "nonaktif";
  return "—";
}
