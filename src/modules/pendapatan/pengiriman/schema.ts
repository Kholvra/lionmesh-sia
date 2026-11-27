import { z } from "zod";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuid(id: string | null | undefined): id is string {
  return typeof id === "string" && UUID_REGEX.test(id);
}

export const pengirimanItemSchema = z.object({
  pesananItemId: z.string().uuid("Baris pesanan tidak valid."),
  produkId: z.string().uuid("Produk tidak valid."),
  gudangId: z.string().uuid("Gudang wajib dipilih."),
  qty: z
    .number({ error: "Jumlah kirim harus berupa angka." })
    .positive("Jumlah kirim harus lebih dari nol."),
});

export const pengirimanFormSchema = z.object({
  pesananId: z.string().uuid("Pesanan penjualan wajib dipilih."),
  tanggalPengiriman: z.string().min(1, "Tanggal pengiriman wajib diisi."),
  keterangan: z.string().max(500).optional().nullable(),
  items: z
    .array(pengirimanItemSchema)
    .min(1, "Minimal satu barang harus dimasukkan ke pengiriman."),
});

export type PengirimanFormInput = z.infer<typeof pengirimanFormSchema>;

export const buktiTerimaSchema = z.object({
  tanggalTerima: z.string().trim().min(1, "Tanggal terima dan nama penerima wajib diisi."),
  namaPenerima: z.string().trim().min(1, "Tanggal terima dan nama penerima wajib diisi."),
});
