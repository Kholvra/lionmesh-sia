import { z } from "zod";

const UUID = z.string().uuid("Data tidak valid");

const DESIMAL = (label: string) =>
  z
    .string()
    .transform((value) => value.trim().replace(",", "."))
    .refine((value) => /^\d+(\.\d{1,4})?$/.test(value), {
      message: `${label} harus angka dan maksimal 4 desimal`,
    });

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
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal invoice wajib diisi");

const TERMIN = z
  .string()
  .trim()
  .min(1, "Termin invoice wajib diisi")
  .regex(/^\d+$/, "Termin invoice harus angka hari")
  .transform((value) => Number(value))
  .refine((value) => Number.isSafeInteger(value), "Termin invoice harus angka hari");

const VERSI = z
  .string()
  .regex(/^\d+$/, "Data dokumen tidak valid")
  .transform((value) => Number(value))
  .refine((value) => Number.isSafeInteger(value), "Data dokumen tidak valid");

const catatSchema = z.object({
  penerimaanId: UUID,
  nomorInvoice: z.string().trim().min(1, "Nomor invoice wajib diisi"),
  tanggal: TANGGAL,
  terminHari: TERMIN,
  nomorFakturPajak: z.string().trim().max(50, "Nomor faktur pajak terlalu panjang"),
  ppnNilai: DESIMAL("PPN"),
});

const koreksiSchema = z.object({
  dokumenId: UUID,
  versi: VERSI,
  ppnNilai: DESIMAL("PPN"),
});

const sahkanSchema = z.object({
  dokumenId: UUID,
  versi: VERSI,
});

const batalSchema = z.object({
  dokumenId: UUID,
  versi: VERSI,
  alasan: z.string().trim().min(1, "Alasan pembatalan wajib diisi"),
});

export interface BarisInvoiceForm {
  penerimaanItemId: string;
  qty: string;
  hargaSatuanDpp: string;
}

export interface CatatInvoiceForm {
  penerimaanId: string;
  nomorInvoice: string;
  tanggal: string;
  terminHari: number;
  nomorFakturPajak: string | null;
  ppnNilai: string;
  baris: BarisInvoiceForm[];
}

export interface KoreksiInvoiceForm {
  dokumenId: string;
  versi: number;
  ppnNilai: string;
  baris: BarisInvoiceForm[];
}

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function ambilBaris(formData: FormData): {
  baris: BarisInvoiceForm[];
  message: string | null;
} {
  const itemIds = formData.getAll("penerimaan_item_id").map(String);
  const qtys = formData.getAll("qty").map(String);
  const hargas = formData.getAll("harga_satuan_dpp").map(String);

  if (itemIds.length === 0) {
    return { baris: [], message: "Invoice harus memuat minimal satu baris" };
  }

  const baris: BarisInvoiceForm[] = [];
  for (let index = 0; index < itemIds.length; index += 1) {
    const penerimaanItemId = itemIds[index] ?? "";
    const qty = QTY.safeParse(qtys[index] ?? "");
    const harga = DESIMAL("Harga DPP").safeParse(hargas[index] ?? "");

    if (!UUID.safeParse(penerimaanItemId).success) {
      return { baris: [], message: "Baris invoice tidak valid" };
    }
    if (!qty.success) {
      return { baris: [], message: qty.error.issues[0]?.message ?? "Qty tidak valid" };
    }
    if (!harga.success) {
      return { baris: [], message: harga.error.issues[0]?.message ?? "Harga tidak valid" };
    }
    baris.push({ penerimaanItemId, qty: qty.data, hargaSatuanDpp: harga.data });
  }

  return { baris, message: null };
}

export function parseCatatInvoice(formData: FormData): {
  input: CatatInvoiceForm | null;
  message: string | null;
} {
  const parsed = catatSchema.safeParse({
    penerimaanId: text(formData, "penerimaan_id"),
    nomorInvoice: text(formData, "nomor_invoice"),
    tanggal: text(formData, "tanggal"),
    terminHari: text(formData, "termin_hari"),
    nomorFakturPajak: text(formData, "nomor_faktur_pajak"),
    ppnNilai: text(formData, "ppn_nilai"),
  });
  if (!parsed.success) {
    return {
      input: null,
      message: parsed.error.issues[0]?.message ?? "Data invoice tidak valid",
    };
  }

  const { baris, message } = ambilBaris(formData);
  if (message) return { input: null, message };

  return {
    input: {
      penerimaanId: parsed.data.penerimaanId,
      nomorInvoice: parsed.data.nomorInvoice,
      tanggal: parsed.data.tanggal,
      terminHari: parsed.data.terminHari,
      nomorFakturPajak:
        parsed.data.nomorFakturPajak.length > 0 ? parsed.data.nomorFakturPajak : null,
      ppnNilai: parsed.data.ppnNilai,
      baris,
    },
    message: null,
  };
}

export function parseKoreksiInvoice(formData: FormData): {
  input: KoreksiInvoiceForm | null;
  message: string | null;
} {
  const parsed = koreksiSchema.safeParse({
    dokumenId: text(formData, "id"),
    versi: text(formData, "versi"),
    ppnNilai: text(formData, "ppn_nilai"),
  });
  if (!parsed.success) {
    return {
      input: null,
      message: parsed.error.issues[0]?.message ?? "Data koreksi tidak valid",
    };
  }

  const { baris, message } = ambilBaris(formData);
  if (message) return { input: null, message };

  return {
    input: {
      dokumenId: parsed.data.dokumenId,
      versi: parsed.data.versi,
      ppnNilai: parsed.data.ppnNilai,
      baris,
    },
    message: null,
  };
}

export function parseSahkanInvoice(formData: FormData): {
  input: { dokumenId: string; versi: number } | null;
  message: string | null;
} {
  const parsed = sahkanSchema.safeParse({
    dokumenId: text(formData, "id"),
    versi: text(formData, "versi"),
  });
  if (!parsed.success) {
    return {
      input: null,
      message: parsed.error.issues[0]?.message ?? "Data pengesahan tidak valid",
    };
  }
  return { input: parsed.data, message: null };
}

export function parseBatalInvoice(formData: FormData): {
  input: { dokumenId: string; versi: number; alasan: string } | null;
  message: string | null;
} {
  const parsed = batalSchema.safeParse({
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
