import { z } from "zod";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuid(id: string | null | undefined): id is string {
  return typeof id === "string" && UUID_REGEX.test(id);
}

export const fakturFormSchema = z.object({
  pengirimanId: z.string().uuid("Pengiriman wajib dipilih."),
  tanggalFaktur: z.string().min(1, "Tanggal faktur wajib diisi."),
  terminHari: z
    .number({ error: "Termin pembayaran wajib diisi." })
    .int("Termin pembayaran harus berupa jumlah hari, minimal 0.")
    .min(0, "Termin pembayaran harus berupa jumlah hari, minimal 0."),
  nomorFakturPajak: z.string().trim().optional().nullable(),
});

export type FakturFormInput = z.infer<typeof fakturFormSchema>;
