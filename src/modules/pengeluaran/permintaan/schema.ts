import { z } from "zod";

import type { BarisPermintaan } from "@/core/pengadaan";

const UUID = z.string().uuid("ID tidak valid");
const DATE = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal butuh wajib diisi");
const QTY = z
  .string()
  .regex(/^\d+(\.\d{1,4})?$/, "Qty harus lebih dari 0 dan maksimal 4 angka desimal")
  .refine((value) => Number(value) > 0, "Qty harus lebih dari 0");

const barisSchema = z.object({
  produkId: UUID,
  satuanId: UUID,
  qty: QTY,
});

const VERSI = z
  .string()
  .regex(/^\d+$/, "Data permintaan tidak valid")
  .transform((value) => Number(value))
  .refine((value) => Number.isSafeInteger(value), "Data permintaan tidak valid");

/**
 * Purchasing may leave the estimate blank (Q-07): a blank field is read as
 * zero, not as "no value", so the single seed ladder still applies.
 */
const ESTIMASI = z
  .string()
  .transform((value) => value.trim().replace(",", "."))
  .transform((value) => (value.length === 0 ? "0" : value))
  .refine((value) => /^\d+(\.\d{1,2})?$/.test(value), {
    message: "Estimasi nilai harus angka positif dengan maksimal 2 desimal",
  });

const keputusanApprovalSchema = z.object({
  dokumenId: UUID,
  versi: VERSI,
});

const penolakanSchema = keputusanApprovalSchema.extend({
  alasan: z.string().trim().min(1, "Alasan penolakan wajib diisi"),
});

export interface KeputusanApprovalInput {
  dokumenId: string;
  versi: number;
}

export interface PenolakanInput extends KeputusanApprovalInput {
  alasan: string;
}

export interface PermintaanFormInput {
  gudangId: string;
  woId: string | null;
  keterangan: string | null;
  tanggalButuh: string;
  baris: BarisPermintaan[];
}

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function parsePermintaanForm(formData: FormData): {
  input: PermintaanFormInput | null;
  fieldErrors: Record<string, string>;
} {
  const fieldErrors: Record<string, string> = {};

  const gudangId = text(formData, "gudang_id");
  if (!UUID.safeParse(gudangId).success) {
    fieldErrors.gudang_id = "Pilih gudang tujuan";
  }

  const tanggalButuh = text(formData, "tanggal_butuh");
  if (!DATE.safeParse(tanggalButuh).success) {
    fieldErrors.tanggal_butuh = "Tanggal butuh wajib diisi";
  }

  const woId = text(formData, "wo_id");
  if (woId.length > 0 && !UUID.safeParse(woId).success) {
    fieldErrors.wo_id = "Referensi perintah produksi tidak valid";
  }

  const produkIds = formData.getAll("produk_id").map(String);
  const satuanIds = formData.getAll("satuan_id").map(String);
  const qtys = formData.getAll("qty").map(String);
  const baris: BarisPermintaan[] = [];

  const rowCount = Math.max(produkIds.length, satuanIds.length, qtys.length);
  for (let index = 0; index < rowCount; index += 1) {
    const produkId = (produkIds[index] ?? "").trim();
    const satuanId = (satuanIds[index] ?? "").trim();
    const qty = (qtys[index] ?? "").trim();

    if (!produkId && !satuanId && !qty) continue;

    const parsed = barisSchema.safeParse({ produkId, satuanId, qty });
    if (!parsed.success) {
      fieldErrors[`baris_${index}`] =
        parsed.error.issues[0]?.message ?? "Baris permintaan tidak valid";
      continue;
    }
    baris.push(parsed.data);
  }

  if (baris.length === 0 && !fieldErrors.baris_0) {
    fieldErrors.baris = "Permintaan harus memuat minimal satu barang";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { input: null, fieldErrors };
  }

  return {
    input: {
      gudangId,
      woId: woId.length > 0 ? woId : null,
      keterangan: text(formData, "keterangan") || null,
      tanggalButuh,
      baris,
    },
    fieldErrors,
  };
}

export function parseEstimasiNilai(formData: FormData): {
  nilai: string | null;
  message: string | null;
} {
  const parsed = ESTIMASI.safeParse(text(formData, "nilai"));
  if (!parsed.success) {
    return {
      nilai: null,
      message: parsed.error.issues[0]?.message ?? "Estimasi nilai tidak valid",
    };
  }
  return { nilai: parsed.data, message: null };
}

export function parseKeputusanApproval(formData: FormData): {
  input: KeputusanApprovalInput | null;
  message: string | null;
} {
  const parsed = keputusanApprovalSchema.safeParse({
    dokumenId: text(formData, "id"),
    versi: text(formData, "versi"),
  });
  if (!parsed.success) {
    return {
      input: null,
      message: parsed.error.issues[0]?.message ?? "Data permintaan tidak valid",
    };
  }
  return { input: parsed.data, message: null };
}

export function parsePenolakan(formData: FormData): {
  input: PenolakanInput | null;
  message: string | null;
} {
  const parsed = penolakanSchema.safeParse({
    dokumenId: text(formData, "id"),
    versi: text(formData, "versi"),
    alasan: text(formData, "alasan"),
  });
  if (!parsed.success) {
    return {
      input: null,
      message: parsed.error.issues[0]?.message ?? "Data penolakan tidak valid",
    };
  }
  return { input: parsed.data, message: null };
}
