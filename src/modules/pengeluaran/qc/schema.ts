import { z } from "zod";

const UUID = z.string().uuid("Data tidak valid");

const QTY = z
  .string()
  .transform((value) => value.trim().replace(",", "."))
  .refine((value) => /^\d+(\.\d{1,4})?$/.test(value), {
    message: "Qty tidak boleh negatif dan maksimal 4 desimal",
  });

const VERSI = z
  .string()
  .regex(/^\d+$/, "Data dokumen tidak valid")
  .transform((value) => Number(value))
  .refine((value) => Number.isSafeInteger(value), "Data dokumen tidak valid");

const qcSchema = z.object({
  penerimaanId: UUID,
  versi: VERSI,
});

const lokasiSchema = z.object({
  penerimaanItemId: UUID,
  lokasi: z.string().trim().min(1, "Lokasi pemisahan wajib diisi"),
});

const returSchema = z.object({
  penerimaanId: UUID,
  alasan: z.string().trim().max(500, "Alasan maksimal 500 karakter"),
});

const putusanSchema = z.object({
  dokumenId: UUID,
  versi: VERSI,
  setuju: z.enum(["true", "false"]),
  alasan: z.string().trim().max(500, "Alasan maksimal 500 karakter"),
});

const batalReturSchema = z.object({
  dokumenId: UUID,
  versi: VERSI,
  alasan: z.string().trim().min(1, "Alasan pembatalan wajib diisi"),
});

export interface QcInput {
  penerimaanId: string;
  versi: number;
  baris: { penerimaanItemId: string; qtyLulus: string }[];
}

export interface LokasiInput {
  penerimaanItemId: string;
  lokasi: string;
}

export interface ReturInput {
  penerimaanId: string;
  alasan: string | null;
  baris: { penerimaanItemId: string; qty: string }[];
}

export interface PutusanInput {
  dokumenId: string;
  versi: number;
  setuju: boolean;
  alasan: string | null;
}

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function parseQc(formData: FormData): {
  input: QcInput | null;
  message: string | null;
} {
  const parsed = qcSchema.safeParse({
    penerimaanId: text(formData, "penerimaan_id"),
    versi: text(formData, "versi"),
  });
  if (!parsed.success) {
    return {
      input: null,
      message: parsed.error.issues[0]?.message ?? "Data QC tidak valid",
    };
  }

  const itemIds = formData.getAll("penerimaan_item_id").map(String);
  const qtys = formData.getAll("qty_lulus").map(String);
  if (itemIds.length === 0) {
    return { input: null, message: "QC harus memuat minimal satu baris" };
  }

  const baris: { penerimaanItemId: string; qtyLulus: string }[] = [];
  for (let index = 0; index < itemIds.length; index += 1) {
    const penerimaanItemId = itemIds[index] ?? "";
    const qty = QTY.safeParse(qtys[index] ?? "");
    if (!UUID.safeParse(penerimaanItemId).success) {
      return { input: null, message: "Baris QC tidak valid" };
    }
    if (!qty.success) {
      return {
        input: null,
        message: qty.error.issues[0]?.message ?? "Qty lulus tidak valid",
      };
    }
    baris.push({ penerimaanItemId, qtyLulus: qty.data });
  }

  return {
    input: { penerimaanId: parsed.data.penerimaanId, versi: parsed.data.versi, baris },
    message: null,
  };
}

export function parseLokasi(formData: FormData): {
  input: LokasiInput | null;
  message: string | null;
} {
  const parsed = lokasiSchema.safeParse({
    penerimaanItemId: text(formData, "penerimaan_item_id"),
    lokasi: text(formData, "lokasi"),
  });
  if (!parsed.success) {
    return {
      input: null,
      message: parsed.error.issues[0]?.message ?? "Data lokasi tidak valid",
    };
  }
  return { input: parsed.data, message: null };
}

export function parseRetur(formData: FormData): {
  input: ReturInput | null;
  message: string | null;
} {
  const parsed = returSchema.safeParse({
    penerimaanId: text(formData, "penerimaan_id"),
    alasan: text(formData, "alasan"),
  });
  if (!parsed.success) {
    return {
      input: null,
      message: parsed.error.issues[0]?.message ?? "Data retur tidak valid",
    };
  }

  const itemIds = formData.getAll("penerimaan_item_id").map(String);
  const qtys = formData.getAll("qty").map(String);
  const baris: { penerimaanItemId: string; qty: string }[] = [];
  for (let index = 0; index < itemIds.length; index += 1) {
    const qtyRaw = (qtys[index] ?? "").trim();
    if (qtyRaw === "") continue;
    const qty = QTY.safeParse(qtyRaw);
    if (!UUID.safeParse(itemIds[index] ?? "").success) {
      return { input: null, message: "Baris retur tidak valid" };
    }
    if (!qty.success) {
      return {
        input: null,
        message: qty.error.issues[0]?.message ?? "Qty retur tidak valid",
      };
    }
    if (/^0(\.0{1,4})?$/.test(qty.data)) continue;
    baris.push({ penerimaanItemId: itemIds[index] ?? "", qty: qty.data });
  }

  if (baris.length === 0) {
    return { input: null, message: "Retur harus merujuk minimal satu baris penerimaan" };
  }

  const alasan = parsed.data.alasan;
  return {
    input: {
      penerimaanId: parsed.data.penerimaanId,
      alasan: alasan.length > 0 ? alasan : null,
      baris,
    },
    message: null,
  };
}

export function parsePutusan(formData: FormData): {
  input: PutusanInput | null;
  message: string | null;
} {
  const parsed = putusanSchema.safeParse({
    dokumenId: text(formData, "id"),
    versi: text(formData, "versi"),
    setuju: text(formData, "setuju"),
    alasan: text(formData, "alasan"),
  });
  if (!parsed.success) {
    return {
      input: null,
      message: parsed.error.issues[0]?.message ?? "Data keputusan tidak valid",
    };
  }

  const setuju = parsed.data.setuju === "true";
  if (!setuju && parsed.data.alasan.length === 0) {
    return { input: null, message: "Alasan penolakan wajib diisi" };
  }

  return {
    input: {
      dokumenId: parsed.data.dokumenId,
      versi: parsed.data.versi,
      setuju,
      alasan: parsed.data.alasan.length > 0 ? parsed.data.alasan : null,
    },
    message: null,
  };
}

export function parseBatalRetur(formData: FormData): {
  input: { dokumenId: string; versi: number; alasan: string } | null;
  message: string | null;
} {
  const parsed = batalReturSchema.safeParse({
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
