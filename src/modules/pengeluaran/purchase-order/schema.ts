import { z } from "zod";

const UUID = z.string().uuid("Data tidak valid");

const QTY = z
  .string()
  .transform((value) => value.trim().replace(",", "."))
  .refine((value) => /^\d+(\.\d{1,4})?$/.test(value), {
    message: "Qty harus lebih dari 0",
  })
  .refine((value) => !/^0(\.0{1,4})?$/.test(value), {
    message: "Qty harus lebih dari 0",
  });

const TANGGAL = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal PO wajib diisi");

const VERSI = z
  .string()
  .regex(/^\d+$/, "Data dokumen tidak valid")
  .transform((value) => Number(value))
  .refine((value) => Number.isSafeInteger(value), "Data dokumen tidak valid");

const terbitkanSchema = z.object({
  permintaanId: UUID,
  versi: VERSI,
  tanggal: TANGGAL,
});

const pembatalanSchema = z.object({
  dokumenId: UUID,
  versi: VERSI,
  alasan: z.string().trim().min(1, "Alasan pembatalan wajib diisi"),
});

const konfirmasiSchema = z.object({
  dokumenId: UUID,
  catatan: z.string().trim().min(1, "Catatan konfirmasi wajib diisi"),
});

export interface TerbitkanPoInput {
  permintaanId: string;
  versi: number;
  tanggal: string;
  baris: { itemId: string; qty: string }[];
}

export interface PembatalanPoInput {
  dokumenId: string;
  versi: number;
  alasan: string;
}

export interface KonfirmasiPoInput {
  dokumenId: string;
  catatan: string;
}

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function parseTerbitkanPo(formData: FormData): {
  input: TerbitkanPoInput | null;
  message: string | null;
} {
  const parsed = terbitkanSchema.safeParse({
    permintaanId: text(formData, "permintaan_id"),
    versi: text(formData, "versi"),
    tanggal: text(formData, "tanggal"),
  });
  if (!parsed.success) {
    return {
      input: null,
      message: parsed.error.issues[0]?.message ?? "Data purchase order tidak valid",
    };
  }

  const itemIds = formData.getAll("item_id").map(String);
  const qtys = formData.getAll("qty").map(String);
  if (itemIds.length === 0) {
    return { input: null, message: "PO harus memuat minimal satu barang" };
  }

  const baris: { itemId: string; qty: string }[] = [];
  for (let index = 0; index < itemIds.length; index += 1) {
    const itemId = itemIds[index] ?? "";
    const qty = QTY.safeParse(qtys[index] ?? "");
    if (!UUID.safeParse(itemId).success) {
      return { input: null, message: "Barang PO tidak valid" };
    }
    if (!qty.success) {
      return {
        input: null,
        message: qty.error.issues[0]?.message ?? "Qty harus lebih dari 0",
      };
    }
    baris.push({ itemId, qty: qty.data });
  }

  return {
    input: {
      permintaanId: parsed.data.permintaanId,
      versi: parsed.data.versi,
      tanggal: parsed.data.tanggal,
      baris,
    },
    message: null,
  };
}

export function parsePembatalanPo(formData: FormData): {
  input: PembatalanPoInput | null;
  message: string | null;
} {
  const parsed = pembatalanSchema.safeParse({
    dokumenId: text(formData, "id"),
    versi: text(formData, "versi"),
    alasan: text(formData, "alasan"),
  });
  if (!parsed.success) {
    return {
      input: null,
      message: parsed.error.issues[0]?.message ?? "Data pembatalan tidak valid",
    };
  }
  return { input: parsed.data, message: null };
}

export function parseKonfirmasiPo(formData: FormData): {
  input: KonfirmasiPoInput | null;
  message: string | null;
} {
  const parsed = konfirmasiSchema.safeParse({
    dokumenId: text(formData, "id"),
    catatan: text(formData, "catatan"),
  });
  if (!parsed.success) {
    return {
      input: null,
      message: parsed.error.issues[0]?.message ?? "Data konfirmasi tidak valid",
    };
  }
  return { input: parsed.data, message: null };
}
