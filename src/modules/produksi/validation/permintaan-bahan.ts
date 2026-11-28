import { z } from "zod";

import type { AjukanPRInput } from "../../../core/pengadaan/index.ts";

import {
  desimalSchema,
  fieldErrors,
  idSchema,
  tanggalSchema,
  teksOpsionalSchema,
} from "./common.ts";

export const PESAN_WO_WAJIB = "Referensi perintah produksi wajib diisi";
export const PESAN_BARIS_KOSONG = "Permintaan harus memuat minimal satu barang";

const barisSchema = z.object({
  produkId: idSchema("Produk"),
  satuanId: idSchema("Satuan"),
  qty: desimalSchema({ label: "Qty", min: "positif" }),
});

/** PR-bahan input; the schema mirrors ajukanPR so no direct PR write is needed. */
export const permintaanBahanSchema = z.object({
  woId: idSchema("Referensi perintah produksi", PESAN_WO_WAJIB),
  gudangId: idSchema("Gudang"),
  tanggalButuh: tanggalSchema("Tanggal butuh"),
  keterangan: teksOpsionalSchema("Keterangan"),
  baris: z.array(barisSchema).min(1, PESAN_BARIS_KOSONG),
});

export type PermintaanBahanInput = z.infer<typeof permintaanBahanSchema>;

export function parsePermintaanBahanForm(formData: FormData): {
  input: PermintaanBahanInput | null;
  fieldErrors: Record<string, string>;
} {
  const teks = (nilai: FormDataEntryValue | null): string | null =>
    typeof nilai === "string" ? nilai : null;
  const produk = formData.getAll("produk_id").map(teks);
  const satuan = formData.getAll("satuan_id").map(teks);
  const qty = formData.getAll("qty").map(teks);
  const baris: {
    produkId: string | null;
    satuanId: string | null;
    qty: string | null;
  }[] = [];

  for (let index = 0; index < Math.max(produk.length, satuan.length, qty.length); index += 1) {
    const barisForm = {
      produkId: produk[index] ?? null,
      satuanId: satuan[index] ?? null,
      qty: qty[index] ?? null,
    };
    if (Object.values(barisForm).every((nilai) => nilai === null || nilai.trim() === "")) {
      continue;
    }
    baris.push(barisForm);
  }

  const hasil = permintaanBahanSchema.safeParse({
    woId: formData.get("wo_id"),
    gudangId: formData.get("gudang_id"),
    tanggalButuh: formData.get("tanggal_butuh"),
    keterangan: formData.get("keterangan"),
    baris,
  });

  if (hasil.success) return { input: hasil.data, fieldErrors: {} };
  return { input: null, fieldErrors: fieldErrors(hasil.error) };
}

/** actorId comes from the session; it is never accepted from the form. */
export function keAjukanPRInput(
  input: PermintaanBahanInput,
  actorId: string,
): AjukanPRInput {
  return {
    woId: input.woId,
    gudangId: input.gudangId,
    tanggalButuh: input.tanggalButuh,
    keterangan: input.keterangan,
    baris: input.baris,
    actorId,
  };
}
