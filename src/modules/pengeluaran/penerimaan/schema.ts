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

const VERSI = z
  .string()
  .regex(/^\d+$/, "Data dokumen tidak valid")
  .transform((value) => Number(value))
  .refine((value) => Number.isSafeInteger(value), "Data dokumen tidak valid");

const TANGGAL = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal penerimaan wajib diisi");

const terimaSchema = z.object({
  poId: UUID,
  versiPo: VERSI,
  gudangId: UUID,
  jenis: z.enum(["SEBAGIAN", "PENUH"], {
    message: "Jenis penerimaan harus sebagian atau penuh",
  }),
  tanggal: TANGGAL,
});

const pembatalanSchema = z.object({
  dokumenId: UUID,
  versi: VERSI,
  alasan: z.string().trim().min(1, "Alasan pembatalan wajib diisi"),
});

const tutupExceptionSchema = z.object({
  exceptionId: UUID,
  alasan: z.string().trim().min(1, "Alasan penutupan wajib diisi"),
});

export interface TerimaInput {
  poId: string;
  versiPo: number;
  gudangId: string;
  jenis: "SEBAGIAN" | "PENUH";
  tanggal: string;
  baris: { poItemId: string; qty: string }[];
}

export interface PembatalanPenerimaanInput {
  dokumenId: string;
  versi: number;
  alasan: string;
}

export interface TutupExceptionFormInput {
  exceptionId: string;
  alasan: string;
}

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function parseTerimaPenerimaan(formData: FormData): {
  input: TerimaInput | null;
  message: string | null;
} {
  const parsed = terimaSchema.safeParse({
    poId: text(formData, "po_id"),
    versiPo: text(formData, "versi_po"),
    gudangId: text(formData, "gudang_id"),
    jenis: text(formData, "jenis"),
    tanggal: text(formData, "tanggal"),
  });
  if (!parsed.success) {
    return {
      input: null,
      message: parsed.error.issues[0]?.message ?? "Data penerimaan tidak valid",
    };
  }

  const itemIds = formData.getAll("po_item_id").map(String);
  const qtys = formData.getAll("qty").map(String);
  if (itemIds.length === 0) {
    return { input: null, message: "Penerimaan harus memuat minimal satu baris" };
  }

  const baris: { poItemId: string; qty: string }[] = [];
  for (let index = 0; index < itemIds.length; index += 1) {
    const poItemId = itemIds[index] ?? "";
    const qty = QTY.safeParse(qtys[index] ?? "");
    if (!UUID.safeParse(poItemId).success) {
      return { input: null, message: "Baris penerimaan tidak valid" };
    }
    if (!qty.success) {
      return {
        input: null,
        message: qty.error.issues[0]?.message ?? "Qty harus lebih dari 0",
      };
    }
    baris.push({ poItemId, qty: qty.data });
  }

  return {
    input: {
      poId: parsed.data.poId,
      versiPo: parsed.data.versiPo,
      gudangId: parsed.data.gudangId,
      jenis: parsed.data.jenis,
      tanggal: parsed.data.tanggal,
      baris,
    },
    message: null,
  };
}

export function parsePembatalanPenerimaan(formData: FormData): {
  input: PembatalanPenerimaanInput | null;
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

export function parseTutupException(formData: FormData): {
  input: TutupExceptionFormInput | null;
  message: string | null;
} {
  const parsed = tutupExceptionSchema.safeParse({
    exceptionId: text(formData, "exception_id"),
    alasan: text(formData, "alasan"),
  });
  if (!parsed.success) {
    return {
      input: null,
      message: parsed.error.issues[0]?.message ?? "Data penutupan tidak valid",
    };
  }
  return { input: parsed.data, message: null };
}
