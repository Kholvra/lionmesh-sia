import { z } from "zod";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuid(id: string | null | undefined): id is string {
  return typeof id === "string" && UUID_REGEX.test(id);
}

/** AC-16: Nominal memakai paling banyak dua desimal */
export function isMaxTwoDecimals(val: string): boolean {
  const normalized = val.trim().replace(",", ".");
  return /^\d+(\.\d{1,2})?$/.test(normalized);
}

export const pembayaranFormSchema = z.object({
  pelangganId: z.string().uuid("Pelanggan wajib dipilih."),
  tanggal: z.string().min(1, "Tanggal pembayaran wajib diisi."),
  nominalStr: z
    .string()
    .trim()
    .min(1, "Nominal pembayaran harus lebih dari nol.")
    .refine(
      (val) => {
        const num = Number(val.replace(",", "."));
        return !Number.isNaN(num) && num > 0;
      },
      { message: "Nominal pembayaran harus lebih dari nol." },
    )
    .refine(
      (val) => isMaxTwoDecimals(val),
      {
        message:
          "Nominal pembayaran harus memakai paling banyak dua desimal.",
      },
    ),
  metode: z
    .string()
    .refine((val) => val === "Transfer" || val === "Giro", {
      message: "Metode pembayaran hanya Transfer atau Giro pada versi ini.",
    }),
  nomorReferensi: z.string().trim().max(100).optional().nullable(),
});

export type PembayaranFormInput = z.infer<typeof pembayaranFormSchema>;
