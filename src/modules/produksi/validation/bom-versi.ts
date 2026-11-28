import { z } from "zod";

import {
  bilanganBulatSchema,
  desimalSchema,
  fieldErrors,
  idSchema,
  tanggalSchema,
  teksOpsionalSchema,
} from "./common.ts";

export const PESAN_SCRAP =
  "Toleransi scrap harus antara 0 dan kurang dari 100 persen.";
export const PESAN_REJECT =
  "Toleransi reject harus antara 0 dan kurang dari 100 persen.";
export const PESAN_KOMPONEN_KOSONG =
  "Versi BOM harus memuat minimal satu komponen.";
export const PESAN_KOMPONEN_DUPLIKAT = "Komponen sudah ada di versi ini.";
export const PESAN_URUTAN_DUPLIKAT = "Urutan komponen tidak boleh sama.";

const komponenSchema = z.object({
  komponenProdukId: idSchema("Komponen"),
  satuanId: idSchema("Satuan komponen"),
  qtyPerUnit: desimalSchema({
    label: "Jumlah komponen",
    min: "positif",
    pesanMin: "Jumlah komponen harus lebih dari nol.",
  }),
  urutan: bilanganBulatSchema("Urutan komponen"),
});

/** The BOM version is append-only; tolerances and components are immutable after saving. */
export const bomVersiCreateSchema = z
  .object({
    produkId: idSchema("Produk"),
    berlakuDari: tanggalSchema("Tanggal berlaku"),
    toleransiScrap: desimalSchema({
      label: "Toleransi scrap",
      min: "nol",
      batasAtas: 100,
      pesanMin: PESAN_SCRAP,
      pesanBatasAtas: PESAN_SCRAP,
    }),
    toleransiReject: desimalSchema({
      label: "Toleransi reject",
      min: "nol",
      batasAtas: 100,
      pesanMin: PESAN_REJECT,
      pesanBatasAtas: PESAN_REJECT,
    }),
    komponen: z.array(komponenSchema).min(1, PESAN_KOMPONEN_KOSONG),
    keterangan: teksOpsionalSchema("Keterangan"),
  })
  .superRefine((input, ctx) => {
    const komponenDilihat = new Set<string>();
    const urutanDilihat = new Set<number>();
    input.komponen.forEach((baris, index) => {
      if (komponenDilihat.has(baris.komponenProdukId)) {
        ctx.addIssue({
          code: "custom",
          path: ["komponen", index, "komponenProdukId"],
          message: PESAN_KOMPONEN_DUPLIKAT,
        });
      } else {
        komponenDilihat.add(baris.komponenProdukId);
      }
      if (urutanDilihat.has(baris.urutan)) {
        ctx.addIssue({
          code: "custom",
          path: ["komponen", index, "urutan"],
          message: PESAN_URUTAN_DUPLIKAT,
        });
      } else {
        urutanDilihat.add(baris.urutan);
      }
    });
  });

export type BomVersiCreateInput = z.infer<typeof bomVersiCreateSchema>;

export function parseBomVersiCreateForm(formData: FormData): {
  input: BomVersiCreateInput | null;
  fieldErrors: Record<string, string>;
} {
  const teks = (nilai: FormDataEntryValue | null): string | null =>
    typeof nilai === "string" ? nilai : null;
  const produk = formData.getAll("komponen_produk_id").map(teks);
  const satuan = formData.getAll("satuan_id").map(teks);
  const qty = formData.getAll("qty_per_unit").map(teks);
  const urutan = formData.getAll("urutan").map(teks);
  const komponen: {
    komponenProdukId: string | null;
    satuanId: string | null;
    qtyPerUnit: string | null;
    urutan: string | null;
  }[] = [];

  for (let index = 0; index < Math.max(produk.length, satuan.length, qty.length, urutan.length); index += 1) {
    const baris = {
      komponenProdukId: produk[index] ?? null,
      satuanId: satuan[index] ?? null,
      qtyPerUnit: qty[index] ?? null,
      urutan: urutan[index] ?? null,
    };
    if (Object.values(baris).every((nilai) => nilai === null || nilai.trim() === "")) {
      continue;
    }
    komponen.push(baris);
  }

  const hasil = bomVersiCreateSchema.safeParse({
    produkId: formData.get("produk_id"),
    berlakuDari: formData.get("berlaku_dari"),
    toleransiScrap: formData.get("toleransi_scrap"),
    toleransiReject: formData.get("toleransi_reject"),
    komponen,
    keterangan: formData.get("keterangan"),
  });

  if (hasil.success) return { input: hasil.data, fieldErrors: {} };
  return { input: null, fieldErrors: fieldErrors(hasil.error) };
}
