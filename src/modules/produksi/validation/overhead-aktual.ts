import { z } from "zod";

import {
  fieldErrors,
  idSchema,
  tanggalSchema,
  teksOpsionalSchema,
  uangSchema,
} from "./common.ts";

export const PESAN_PERIODE =
  "Periode harus tanggal 1 pada bulan yang dimaksud.";

/** Actual overhead pool; HPP uses the predetermined rate, not this value. */
export const overheadAktualSchema = z
  .object({
    periode: tanggalSchema("Periode"),
    akunId: idSchema("Akun"),
    nilai: uangSchema("Nilai"),
    keterangan: teksOpsionalSchema("Keterangan"),
  })
  .superRefine((input, ctx) => {
    if (typeof input.periode === "string" && !input.periode.endsWith("-01")) {
      ctx.addIssue({
        code: "custom",
        path: ["periode"],
        message: PESAN_PERIODE,
      });
    }
  });

export type OverheadAktualInput = z.infer<typeof overheadAktualSchema>;

export function parseOverheadAktualForm(formData: FormData): {
  input: OverheadAktualInput | null;
  fieldErrors: Record<string, string>;
} {
  const hasil = overheadAktualSchema.safeParse({
    periode: formData.get("periode"),
    akunId: formData.get("akun_id"),
    nilai: formData.get("nilai"),
    keterangan: formData.get("keterangan"),
  });

  if (hasil.success) return { input: hasil.data, fieldErrors: {} };
  return { input: null, fieldErrors: fieldErrors(hasil.error) };
}
