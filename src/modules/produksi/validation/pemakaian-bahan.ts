import { z } from "zod";

import {
  desimalSchema,
  fieldErrors,
  idSchema,
  satuan4,
  tanggalWaktuSchema,
  teksOpsionalSchema,
} from "./common.ts";

export const PESAN_JUMLAH_KELUAR = "Jumlah keluar harus lebih dari nol.";
export const PESAN_JUMLAH_PEMAKAIAN =
  "Jumlah terpakai, sisa, dan scrap harus sama dengan jumlah keluar.";

/** Warehouse issue recorded for a WO; valuation and stock stay in core. */
export const materialIssueSchema = z.object({
  woId: idSchema(
    "Referensi perintah produksi",
    "Referensi perintah produksi wajib diisi",
  ),
  produkId: idSchema("Bahan"),
  satuanId: idSchema("Satuan"),
  gudangId: idSchema("Gudang"),
  qtyKeluar: desimalSchema({
    label: "Jumlah keluar",
    min: "positif",
    pesanMin: PESAN_JUMLAH_KELUAR,
  }),
  tanggal: tanggalWaktuSchema("Tanggal mutasi"),
  keterangan: teksOpsionalSchema("Keterangan"),
});

export type MaterialIssueInput = z.infer<typeof materialIssueSchema>;

/** Production confirmation; qtyKeluar is supplied by the server from the persisted issue. */
export const materialReturnSchema = z
  .object({
    woId: idSchema(
      "Referensi perintah produksi",
      "Referensi perintah produksi wajib diisi",
    ),
    pengeluaranId: idSchema("Pengeluaran bahan"),
    qtyKeluar: desimalSchema({ label: "Jumlah keluar", min: "positif" }),
    qtyTerpakai: desimalSchema({ label: "Jumlah terpakai", min: "nol" }),
    qtySisa: desimalSchema({ label: "Jumlah sisa", min: "nol" }),
    qtyScrap: desimalSchema({ label: "Jumlah scrap", min: "nol" }),
    keterangan: teksOpsionalSchema("Keterangan"),
  })
  .superRefine((input, ctx) => {
    if (
      typeof input.qtyTerpakai !== "string" ||
      typeof input.qtySisa !== "string" ||
      typeof input.qtyScrap !== "string" ||
      typeof input.qtyKeluar !== "string"
    ) {
      return;
    }
    const jumlah =
      satuan4(input.qtyTerpakai) +
      satuan4(input.qtySisa) +
      satuan4(input.qtyScrap);
    if (jumlah !== satuan4(input.qtyKeluar)) {
      ctx.addIssue({
        code: "custom",
        path: ["qtyTerpakai"],
        message: PESAN_JUMLAH_PEMAKAIAN,
      });
    }
  });

export type MaterialReturnInput = z.infer<typeof materialReturnSchema>;

export function parseMaterialIssueForm(formData: FormData): {
  input: MaterialIssueInput | null;
  fieldErrors: Record<string, string>;
} {
  const hasil = materialIssueSchema.safeParse({
    woId: formData.get("wo_id"),
    produkId: formData.get("produk_id"),
    satuanId: formData.get("satuan_id"),
    gudangId: formData.get("gudang_id"),
    qtyKeluar: formData.get("qty_keluar"),
    tanggal: formData.get("tanggal"),
    keterangan: formData.get("keterangan"),
  });

  if (hasil.success) return { input: hasil.data, fieldErrors: {} };
  return { input: null, fieldErrors: fieldErrors(hasil.error) };
}

export function parseMaterialReturnForm(
  formData: FormData,
  qtyKeluar: string,
): {
  input: MaterialReturnInput | null;
  fieldErrors: Record<string, string>;
} {
  const hasil = materialReturnSchema.safeParse({
    woId: formData.get("wo_id"),
    pengeluaranId: formData.get("pengeluaran_id"),
    qtyKeluar,
    qtyTerpakai: formData.get("qty_terpakai"),
    qtySisa: formData.get("qty_sisa"),
    qtyScrap: formData.get("qty_scrap"),
    keterangan: formData.get("keterangan"),
  });

  if (hasil.success) return { input: hasil.data, fieldErrors: {} };
  return { input: null, fieldErrors: fieldErrors(hasil.error) };
}
