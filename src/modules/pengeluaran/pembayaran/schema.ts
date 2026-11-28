import { z } from "zod";

const UUID = z.string().uuid("Data tidak valid");

const NOMINAL = z
  .string()
  .trim()
  .min(1, "Nominal pembayaran wajib diisi")
  .regex(/^\d+$/, "Nominal pembayaran harus bilangan bulat rupiah lebih dari nol")
  .transform((value) => value.replace(/^0+(?=\d)/, ""))
  .refine((value) => BigInt(value) > BigInt(0), {
    message: "Nominal pembayaran harus bilangan bulat rupiah lebih dari nol",
  });

const TANGGAL = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal pembayaran wajib diisi");

const VERSI = z
  .string()
  .regex(/^\d+$/, "Data dokumen tidak valid")
  .transform((value) => Number(value))
  .refine((value) => Number.isSafeInteger(value), "Data dokumen tidak valid");

const catatSchema = z.object({
  pemasokId: UUID,
  rekeningBankId: UUID,
  nominal: NOMINAL,
  tanggal: TANGGAL,
});

const verifikasiSchema = z.object({ dokumenId: UUID });

const hasilSchema = z.object({
  dokumenId: UUID,
  versi: VERSI,
  berhasil: z.enum(["true", "false"]),
  alasan: z.string().trim().max(500, "Alasan maksimal 500 karakter"),
});

const batalSchema = z.object({
  dokumenId: UUID,
  versi: VERSI,
  alasan: z.string().trim().min(1, "Alasan pembatalan wajib diisi"),
});

export interface CatatPembayaranForm {
  pemasokId: string;
  rekeningBankId: string;
  nominal: string;
  tanggal: string;
}

export interface HasilTransferForm {
  dokumenId: string;
  versi: number;
  berhasil: boolean;
  alasan: string | null;
}

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function parseCatatPembayaran(formData: FormData): {
  input: CatatPembayaranForm | null;
  message: string | null;
} {
  const parsed = catatSchema.safeParse({
    pemasokId: text(formData, "pemasok_id"),
    rekeningBankId: text(formData, "rekening_bank_id"),
    nominal: text(formData, "nominal"),
    tanggal: text(formData, "tanggal"),
  });
  if (!parsed.success) {
    return {
      input: null,
      message: parsed.error.issues[0]?.message ?? "Data pembayaran tidak valid",
    };
  }
  return { input: parsed.data, message: null };
}

export function parseVerifikasi(formData: FormData): {
  input: { dokumenId: string } | null;
  message: string | null;
} {
  const parsed = verifikasiSchema.safeParse({ dokumenId: text(formData, "id") });
  if (!parsed.success) {
    return {
      input: null,
      message: parsed.error.issues[0]?.message ?? "Data verifikasi tidak valid",
    };
  }
  return { input: parsed.data, message: null };
}

export function parseHasilTransfer(formData: FormData): {
  input: HasilTransferForm | null;
  message: string | null;
} {
  const parsed = hasilSchema.safeParse({
    dokumenId: text(formData, "id"),
    versi: text(formData, "versi"),
    berhasil: text(formData, "berhasil"),
    alasan: text(formData, "alasan"),
  });
  if (!parsed.success) {
    return {
      input: null,
      message: parsed.error.issues[0]?.message ?? "Data hasil transfer tidak valid",
    };
  }

  const berhasil = parsed.data.berhasil === "true";
  if (!berhasil && parsed.data.alasan.length === 0) {
    return { input: null, message: "Alasan kegagalan transfer wajib diisi" };
  }

  return {
    input: {
      dokumenId: parsed.data.dokumenId,
      versi: parsed.data.versi,
      berhasil,
      alasan: parsed.data.alasan.length > 0 ? parsed.data.alasan : null,
    },
    message: null,
  };
}

export function parseBatalPembayaran(formData: FormData): {
  input: { dokumenId: string; versi: number; alasan: string } | null;
  message: string | null;
} {
  const parsed = batalSchema.safeParse({
    dokumenId: text(formData, "id"),
    versi: text(formData, "versi"),
    alasan: text(formData, "alasan"),
  });
  if (!parsed.success) {
    return {
      input: null,
      message: parsed.error.issues[0]?.message ?? "Data pembatalan tidak valid",
    };
  }
  return { input: parsed.data, message: null };
}
