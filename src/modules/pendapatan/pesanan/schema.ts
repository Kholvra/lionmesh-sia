import { z } from "zod";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuid(id: string | null | undefined): id is string {
  return typeof id === "string" && UUID_REGEX.test(id);
}

export const pesananItemSchema = z.object({
  produkId: z.string().uuid("Produk wajib dipilih."),
  qty: z
    .number({ error: "Jumlah harus berupa angka." })
    .positive("Jumlah harus lebih dari nol."),
  hargaSatuan: z
    .number({ error: "Harga harus berupa angka." })
    .min(0, "Harga tidak boleh negatif."),
  diskonPersen: z
    .number({ error: "Diskon harus berupa angka." })
    .min(0, "Diskon harus antara 0 dan 100 persen.")
    .max(100, "Diskon harus antara 0 dan 100 persen."),
});

export const pesananFormSchema = z.object({
  pelangganId: z.string().uuid("Pelanggan wajib dipilih."),
  tanggal: z.string().min(1, "Tanggal pesanan wajib diisi."),
  terminHari: z
    .number({ error: "Termin pembayaran wajib diisi." })
    .int("Termin pembayaran harus berupa jumlah hari, minimal 0.")
    .min(0, "Termin pembayaran harus berupa jumlah hari, minimal 0."),
  items: z.array(pesananItemSchema),
});

export type PesananFormInput = z.infer<typeof pesananFormSchema>;
