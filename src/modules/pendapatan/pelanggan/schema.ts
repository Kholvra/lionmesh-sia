import { z } from "zod";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidPelangganId(id: string | null | undefined): id is string {
  return typeof id === "string" && UUID_REGEX.test(id);
}

export const pelangganFormSchema = z.object({
  nama: z
    .string()
    .trim()
    .min(1, "Nama pelanggan wajib diisi.")
    .max(255, "Nama pelanggan terlalu panjang."),
  terminHari: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => {
        if (!val || val === "") return true;
        return /^\d+$/.test(val);
      },
      { message: "Termin pembayaran harus berupa jumlah hari, minimal 0." }
    ),
  batasKredit: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => {
        if (!val || val === "") return true;
        if (val.startsWith("-")) return false;
        return /^\d+(\.\d{1,2})?$/.test(val);
      },
      {
        message:
          "Batas kredit harus berupa angka dan tidak boleh negatif.",
      }
    ),
  npwp: z
    .string()
    .trim()
    .max(50, "NPWP terlalu panjang.")
    .optional()
    .nullable(),
  alamat: z
    .string()
    .trim()
    .max(500, "Alamat terlalu panjang.")
    .optional()
    .nullable(),
  telepon: z
    .string()
    .trim()
    .max(50, "Nomor telepon terlalu panjang.")
    .optional()
    .nullable(),
  email: z
    .string()
    .trim()
    .max(100, "Email terlalu panjang.")
    .optional()
    .nullable(),
});

export type PelangganFormData = z.infer<typeof pelangganFormSchema>;

export const batasKreditSchema = z.object({
  id: z.string().uuid("ID pelanggan tidak valid."),
  batasKredit: z
    .string()
    .trim()
    .min(1, "Batas kredit wajib diisi.")
    .refine(
      (val) => {
        if (val.startsWith("-")) return false;
        return /^\d+(\.\d{1,2})?$/.test(val);
      },
      {
        message:
          "Batas kredit harus berupa angka dan tidak boleh negatif.",
      }
    ),
});

export type BatasKreditFormData = z.infer<typeof batasKreditSchema>;
