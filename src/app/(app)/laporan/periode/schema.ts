import { z } from "zod";

export const tutupPeriodeSchema = z.object({
  periode: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Pilih periode yang valid."),
});

export const tutupTahunSchema = z.object({
  tahun: z.coerce
    .number()
    .int("Tahun harus bilangan bulat.")
    .min(2000, "Tahun di luar rentang yang didukung.")
    .max(9999, "Tahun di luar rentang yang didukung."),
});
