import { z } from "zod";

import {
  desimalSchema,
  fieldErrors,
  idSchema,
  tanggalSchema,
  teksOpsionalSchema,
  uangSchema,
} from "./common.ts";

export const PESAN_JAM_KERJA = "Jam kerja harus lebih dari nol.";

/** Time-card entry for PR-006 TKL; payroll tables are never read from here. */
export const kartuJamKerjaSchema = z.object({
  woId: idSchema(
    "Referensi perintah produksi",
    "Referensi perintah produksi wajib diisi",
  ),
  karyawanId: idSchema("Karyawan"),
  tanggal: tanggalSchema("Tanggal jam kerja"),
  jamKerja: desimalSchema({
    label: "Jam kerja",
    min: "positif",
    pesanMin: PESAN_JAM_KERJA,
  }),
  tarifPerJam: uangSchema("Tarif per jam"),
  keterangan: teksOpsionalSchema("Keterangan"),
});

export type KartuJamKerjaInput = z.infer<typeof kartuJamKerjaSchema>;

export function parseKartuJamKerjaForm(formData: FormData): {
  input: KartuJamKerjaInput | null;
  fieldErrors: Record<string, string>;
} {
  const hasil = kartuJamKerjaSchema.safeParse({
    woId: formData.get("wo_id"),
    karyawanId: formData.get("karyawan_id"),
    tanggal: formData.get("tanggal"),
    jamKerja: formData.get("jam_kerja"),
    tarifPerJam: formData.get("tarif_per_jam"),
    keterangan: formData.get("keterangan"),
  });

  if (hasil.success) return { input: hasil.data, fieldErrors: {} };
  return { input: null, fieldErrors: fieldErrors(hasil.error) };
}
