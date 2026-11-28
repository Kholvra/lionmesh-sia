import { z } from "zod";

import {
  desimalSchema,
  fieldErrors,
  idSchema,
  tanggalSchema,
  teksOpsionalSchema,
} from "./common.ts";

export const PESAN_TARGET = "Target jumlah harus lebih dari nol.";
export const PESAN_TANGGAL_TARGET =
  "Tanggal target selesai tidak boleh sebelum tanggal perintah dibuat.";

/** Input for PR-002 WO creation; number and status are owned by core/dokumen. */
export const spkCreateSchema = z
  .object({
    produkId: idSchema("Produk"),
    bomVersiId: idSchema("Versi BOM"),
    gudangId: idSchema("Gudang"),
    tanggalPerintah: tanggalSchema("Tanggal perintah"),
    tglTargetSelesai: tanggalSchema("Tanggal target selesai"),
    targetQty: desimalSchema({
      label: "Target jumlah",
      min: "positif",
      pesanMin: PESAN_TARGET,
    }),
    keterangan: teksOpsionalSchema("Keterangan"),
  })
  .superRefine((input, ctx) => {
    if (input.tglTargetSelesai < input.tanggalPerintah) {
      ctx.addIssue({
        code: "custom",
        path: ["tglTargetSelesai"],
        message: PESAN_TANGGAL_TARGET,
      });
    }
  });

export type SpkCreateInput = z.infer<typeof spkCreateSchema>;

export function parseSpkCreateForm(formData: FormData): {
  input: SpkCreateInput | null;
  fieldErrors: Record<string, string>;
} {
  const hasil = spkCreateSchema.safeParse({
    produkId: formData.get("produk_id"),
    bomVersiId: formData.get("bom_versi_id"),
    gudangId: formData.get("gudang_id"),
    tanggalPerintah: formData.get("tanggal_perintah"),
    tglTargetSelesai: formData.get("tgl_target_selesai"),
    targetQty: formData.get("target_qty"),
    keterangan: formData.get("keterangan"),
  });

  if (hasil.success) return { input: hasil.data, fieldErrors: {} };
  return { input: null, fieldErrors: fieldErrors(hasil.error) };
}
