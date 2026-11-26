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
