import { z } from "zod";

import {
  bilanganBulatSchema,
  desimalSchema,
  fieldErrors,
  idSchema,
  satuan4,
  tanggalWaktuSchema,
  teksOpsionalSchema,
} from "./common.ts";

export const PESAN_JUMLAH_QC =
  "Lulus, rework, dan reject harus sama dengan jumlah diproses.";
export const PESAN_KEPUTUSAN_QC =
  "Keputusan QC tidak sesuai dengan pembagian hasil.";
export const PESAN_PEMISAHAN_QC =
  "Pencatat hasil tidak boleh menentukan QC atas hasilnya sendiri.";
export const PESAN_JUMLAH_NEGATIF = (label: string): string =>
  `Jumlah ${label} tidak boleh negatif.`;

/** PR-005 result recorder: one attempt per WO, with four-decimal precision. */
export const hasilProduksiSchema = z.object({
  woId: idSchema(
    "Referensi perintah produksi",
    "Referensi perintah produksi wajib diisi",
  ),
  percobaan: bilanganBulatSchema("Percobaan"),
  qtyDiproses: desimalSchema({ label: "Jumlah diproses", min: "positif" }),
  tanggal: z.preprocess(
    (nilai) => (nilai === undefined || nilai === null || nilai === "" ? undefined : nilai),
    tanggalWaktuSchema("Tanggal hasil").optional(),
  ),
  keterangan: teksOpsionalSchema("Keterangan"),
});

export type HasilProduksiInput = z.infer<typeof hasilProduksiSchema>;

const KEPUTUSAN_QC = ["QC_PASSED", "REWORK", "REJECTED"] as const;

export type KeputusanQc = (typeof KEPUTUSAN_QC)[number];

const keputusanSchema = z.unknown().transform((raw, ctx) => {
  const nilai = typeof raw === "string" ? raw.trim() : "";
  if (!KEPUTUSAN_QC.includes(nilai as KeputusanQc)) {
    ctx.addIssue({
      code: "custom",
      message: "Keputusan QC wajib diisi dengan nilai yang sah",
    });
    return z.NEVER;
  }
  return nilai as KeputusanQc;
});

/**
 * QC verdict: actor and persisted result metadata arrive from the server,
 * never from the form, so the recorder/decider separation can be enforced here.
 */
export const qcVerdictSchema = z
  .object({
    hasilProduksiId: idSchema("Hasil produksi"),
    woId: idSchema(
      "Referensi perintah produksi",
      "Referensi perintah produksi wajib diisi",
    ),
    qtyDiproses: desimalSchema({ label: "Jumlah diproses", min: "positif" }),
    qtyLulus: desimalSchema({
      label: "Jumlah lulus",
      min: "nol",
      pesanMin: PESAN_JUMLAH_NEGATIF("lulus"),
    }),
    qtyRework: desimalSchema({
      label: "Jumlah rework",
      min: "nol",
      pesanMin: PESAN_JUMLAH_NEGATIF("rework"),
    }),
    qtyReject: desimalSchema({
      label: "Jumlah reject",
      min: "nol",
      pesanMin: PESAN_JUMLAH_NEGATIF("reject"),
    }),
    keputusan: keputusanSchema,
    catatan: teksOpsionalSchema("Catatan QC"),
    actorId: idSchema("ID aktor QC"),
    hasilCreatedBy: idSchema("Pencatat hasil"),
  })
  .superRefine((input, ctx) => {
    if (
      typeof input.qtyDiproses !== "string" ||
      typeof input.qtyLulus !== "string" ||
      typeof input.qtyRework !== "string" ||
      typeof input.qtyReject !== "string"
    ) {
      return;
    }

    const jumlah =
      satuan4(input.qtyLulus) +
      satuan4(input.qtyRework) +
      satuan4(input.qtyReject);
    if (jumlah !== satuan4(input.qtyDiproses)) {
      ctx.addIssue({
        code: "custom",
        path: ["qtyLulus"],
        message: PESAN_JUMLAH_QC,
      });
    }

    const rework = satuan4(input.qtyRework) > BigInt(0);
    const lulus = satuan4(input.qtyLulus) > BigInt(0);
    const turunan: KeputusanQc = rework
      ? "REWORK"
      : lulus
        ? "QC_PASSED"
        : "REJECTED";
    if (input.keputusan !== turunan) {
      ctx.addIssue({
        code: "custom",
        path: ["keputusan"],
        message: PESAN_KEPUTUSAN_QC,
      });
    }

    if (input.actorId === input.hasilCreatedBy) {
      ctx.addIssue({
        code: "custom",
        path: ["actorId"],
        message: PESAN_PEMISAHAN_QC,
      });
    }
  });

export type QcVerdictInput = z.infer<typeof qcVerdictSchema>;

export function parseHasilProduksiForm(formData: FormData): {
  input: HasilProduksiInput | null;
  fieldErrors: Record<string, string>;
} {
  const hasil = hasilProduksiSchema.safeParse({
    woId: formData.get("wo_id"),
    percobaan: formData.get("percobaan"),
    qtyDiproses: formData.get("qty_diproses"),
    tanggal: formData.get("tanggal"),
    keterangan: formData.get("keterangan"),
  });

  if (hasil.success) return { input: hasil.data, fieldErrors: {} };
  return { input: null, fieldErrors: fieldErrors(hasil.error) };
}

interface TrustedQcData {
  readonly qtyDiproses: string;
  readonly hasilCreatedBy: string;
  readonly actorId: string;
}

export function parseQcVerdictForm(
  formData: FormData,
  trusted: TrustedQcData,
): {
  input: QcVerdictInput | null;
  fieldErrors: Record<string, string>;
} {
  const hasil = qcVerdictSchema.safeParse({
    hasilProduksiId: formData.get("hasil_produksi_id"),
    woId: formData.get("wo_id"),
    qtyDiproses: trusted.qtyDiproses,
    qtyLulus: formData.get("qty_lulus"),
    qtyRework: formData.get("qty_rework"),
    qtyReject: formData.get("qty_reject"),
    keputusan: formData.get("keputusan"),
    catatan: formData.get("catatan"),
    actorId: trusted.actorId,
    hasilCreatedBy: trusted.hasilCreatedBy,
  });

  if (hasil.success) return { input: hasil.data, fieldErrors: {} };
  return { input: null, fieldErrors: fieldErrors(hasil.error) };
}
