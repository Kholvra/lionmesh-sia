import type { StatusOption } from "@/components/ui";

export const STATUS_PEMASOK: readonly StatusOption[] = [
  { value: "aktif", label: "Aktif", tone: "success" },
  { value: "nonaktif", label: "Nonaktif", tone: "neutral" },
];

export function statusPemasok(aktif: boolean): "aktif" | "nonaktif" {
  return aktif ? "aktif" : "nonaktif";
}

export function formatRupiah(value: string | number): string {
  // Format from the decimal string so a value beyond Number.MAX_SAFE_INTEGER
  // still displays exactly what the database holds.
  const teks = typeof value === "number" ? String(value) : value;
  const [bulatRaw = "0", desimalRaw = ""] = teks.split(".");
  const bulat = BigInt(bulatRaw === "" ? "0" : bulatRaw);
  const desimal = desimalRaw.padEnd(2, "0").slice(0, 2);
  const grup = new Intl.NumberFormat("id-ID").format(bulat);
  return `Rp ${grup},${desimal}`;
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
