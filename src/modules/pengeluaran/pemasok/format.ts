import type { StatusOption } from "@/components/ui";

export const STATUS_PEMASOK: readonly StatusOption[] = [
  { value: "aktif", label: "Aktif", tone: "success" },
  { value: "nonaktif", label: "Nonaktif", tone: "neutral" },
];

export function statusPemasok(aktif: boolean): "aktif" | "nonaktif" {
  return aktif ? "aktif" : "nonaktif";
}

const POLA_RUPIAH = /^-?\d+(?:\.\d+)?$/;

/** Converts whole-rupiah IDR to integer cents for the canonical formatter. */
export function rupiahKeCents(value: string | number): bigint {
  const teks = typeof value === "number" ? String(value) : value;
  if (!POLA_RUPIAH.test(teks)) {
    throw new Error(`Nilai rupiah tidak valid: ${teks}`);
  }
  const negatif = teks.startsWith("-");
  const [bulatRaw, desimalRaw = ""] = (negatif ? teks.slice(1) : teks).split(".");
  if (/[1-9]/.test(desimalRaw)) {
    throw new Error(`Nominal harus bulat tanpa sen: ${teks}`);
  }
  const nilai = BigInt(bulatRaw) * BigInt(100);
  return negatif ? -nilai : nilai;
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
