import { z } from "zod";

const UUID = z.string().uuid("Data tidak valid");

const HARGA = z
  .string()
  .transform((value) => value.trim().replace(",", "."))
  .refine((value) => /^\d+(\.\d{1,2})?$/.test(value), {
    message: "Harga harus lebih dari 0",
  })
  .refine((value) => value !== "0" && value !== "0.0" && value !== "0.00", {
    message: "Harga harus lebih dari 0",
  });

const TANGGAL = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal harga wajib diisi");

const VERSI = z
  .string()
  .regex(/^\d+$/, "Data permintaan tidak valid")
  .transform((value) => Number(value))
  .refine((value) => Number.isSafeInteger(value), "Data permintaan tidak valid");

const penawaranSchema = z.object({
  permintaanId: UUID,
  itemId: UUID,
  pemasokId: UUID,
  harga: HARGA,
  tanggal: TANGGAL,
});

const penetapanSchema = z.object({
  permintaanId: UUID,
  versi: VERSI,
  pemasokId: UUID,
  alasan: z.string().trim().max(500, "Alasan maksimal 500 karakter"),
});

export interface PenawaranInput {
  permintaanId: string;
  itemId: string;
  pemasokId: string;
  harga: string;
  tanggal: string;
}

export interface PenetapanInput {
  permintaanId: string;
  versi: number;
  pemasokId: string;
  alasan: string | null;
}

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function parsePenawaran(formData: FormData): {
  input: PenawaranInput | null;
  message: string | null;
} {
  const parsed = penawaranSchema.safeParse({
    permintaanId: text(formData, "permintaan_id"),
    itemId: text(formData, "item_id"),
    pemasokId: text(formData, "pemasok_id"),
    harga: text(formData, "harga"),
    tanggal: text(formData, "tanggal"),
  });
  if (!parsed.success) {
    return {
      input: null,
      message: parsed.error.issues[0]?.message ?? "Data harga pembanding tidak valid",
    };
  }
  return { input: parsed.data, message: null };
}

export function parsePenetapan(formData: FormData): {
  input: PenetapanInput | null;
  message: string | null;
} {
  const parsed = penetapanSchema.safeParse({
    permintaanId: text(formData, "permintaan_id"),
    versi: text(formData, "versi"),
    pemasokId: text(formData, "pemasok_id"),
    alasan: text(formData, "alasan"),
  });
  if (!parsed.success) {
    return {
      input: null,
      message: parsed.error.issues[0]?.message ?? "Data penetapan tidak valid",
    };
  }
  const { alasan, ...rest } = parsed.data;
  return { input: { ...rest, alasan: alasan.length > 0 ? alasan : null }, message: null };
}
