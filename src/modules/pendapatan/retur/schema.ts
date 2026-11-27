import { z } from "zod";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuid(id: string | null | undefined): id is string {
  return typeof id === "string" && UUID_REGEX.test(id);
}

export const createReturItemSchema = z.object({
  fakturItemId: z.string().uuid("Baris faktur tidak valid."),
  qtyRetur: z
    .number({ message: "Jumlah retur harus berupa angka." })
    .positive("Jumlah retur harus lebih dari nol."),
});

export const createReturSchema = z.object({
  fakturId: z.string().uuid("Retur harus merujuk faktur penjualan."),
  tanggal: z.string().min(1, "Tanggal retur wajib diisi."),
  alasan: z.string().trim().min(1, "Alasan retur wajib diisi.").max(500),
  items: z
    .array(createReturItemSchema)
    .min(1, "Minimal satu barang harus diretur."),
});

export const qcReturItemSchema = z.object({
  itemId: z.string().uuid("Item retur tidak valid."),
  qtyLulus: z
    .number({ message: "Qty lulus QC harus berupa angka." })
    .min(0, "Qty lulus QC tidak boleh negatif."),
});

export const qcReturSchema = z.object({
  returId: z.string().uuid("ID retur tidak valid."),
  catatan: z.string().trim().max(500).optional().nullable(),
  items: z.array(qcReturItemSchema).min(1, "Item QC wajib diisi."),
});

export type CreateReturInput = z.infer<typeof createReturSchema>;
export type QcReturInput = z.infer<typeof qcReturSchema>;
