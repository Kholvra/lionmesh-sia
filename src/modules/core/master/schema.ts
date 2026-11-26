import { z } from "zod";

import type {
  GudangInput,
  KategoriProdukInput,
  KonversiSatuanInput,
  KursInput,
  MataUangInput,
  ProdukInput,
  SatuanInput,
  TipeProduk,
} from "@/core/master";

const MAKS_KODE = 32;
const MAKS_NAMA = 120;
const TIPE_PRODUK = ["bahan", "barang_dalam_proses", "barang_jadi"] as const;

/** Reads a text field, keeping an empty input distinct from a missing one. */
function teks(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
}

function kodeMaster(label: string) {
  return z
    .string()
    .trim()
    .min(1, `Kode ${label} wajib diisi`)
    .max(MAKS_KODE, `Kode ${label} maksimal ${MAKS_KODE} karakter`);
}

function namaMaster(label: string) {
  return z
    .string()
    .trim()
    .min(1, `Nama ${label} wajib diisi`)
    .max(MAKS_NAMA, `Nama ${label} maksimal ${MAKS_NAMA} karakter`);
}

// Only digits and one decimal separator (Indonesian comma or dot). This
// rejects "1e3", "0x10", ".5", and thousands separators before they can
// become a surprising number.
const POLA_DESIMAL = /^\d+(\.\d+)?$/;
const MAKS_DIGIT_BULAT_DESIMAL = 12;

type AturanDesimal = {
  pesanWajib: string;
  pesanBukanAngka: string;
  pesanDesimal: string;
  pesanBesar: string;
  pesanNol: string;
  maksDesimal: number;
};

/**
 * Keeps the value a decimal string: numeric(18,6) must not pass through a JS
 * number, the same rule as core/ledger and core/pemasok.
 */
function desimal(aturan: AturanDesimal) {
  return z.string().transform((raw, ctx) => {
    const trimmed = raw.trim();

    if (trimmed.length === 0) {
      ctx.addIssue({ code: "custom", message: aturan.pesanWajib });
      return z.NEVER;
    }

    const normal = trimmed.replace(",", ".");
    if (!POLA_DESIMAL.test(normal)) {
      ctx.addIssue({ code: "custom", message: aturan.pesanBukanAngka });
      return z.NEVER;
    }

    const [bulat, pecahan = ""] = normal.split(".");
    if (pecahan.length > aturan.maksDesimal) {
      ctx.addIssue({ code: "custom", message: aturan.pesanDesimal });
      return z.NEVER;
    }

    if (bulat.replace(/^0+/, "").length > MAKS_DIGIT_BULAT_DESIMAL) {
      ctx.addIssue({ code: "custom", message: aturan.pesanBesar });
      return z.NEVER;
    }

    if (Number(normal) <= 0) {
      ctx.addIssue({ code: "custom", message: aturan.pesanNol });
      return z.NEVER;
    }

    return normal;
  });
}

function kosongJadiNull(value: string): string | null {
  return value.length > 0 ? value : null;
}

function ambilFieldErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in fieldErrors)) {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
}

const produkSchema = z.object({
  kode: kodeMaster("produk"),
  nama: namaMaster("produk"),
  tipe: z
    .string()
    .trim()
    .refine(
      (value): value is TipeProduk =>
        (TIPE_PRODUK as readonly string[]).includes(value),
      "Tipe produk harus bahan, barang dalam proses, atau barang jadi",
    ),
  satuan_dasar: z
    .string()
    .trim()
    .min(1, "Satuan dasar wajib dipilih")
    .pipe(z.uuid("Satuan dasar tidak valid")),
  kategori: z.union([z.literal(""), z.uuid("Kategori tidak valid")]),
});

export function parseProdukForm(formData: FormData): {
  input: ProdukInput | null;
  fieldErrors: Record<string, string>;
} {
  const parsed = produkSchema.safeParse({
    kode: teks(formData, "kode"),
    nama: teks(formData, "nama"),
    tipe: teks(formData, "tipe"),
    satuan_dasar: teks(formData, "satuan_dasar"),
    kategori: teks(formData, "kategori"),
  });

  if (!parsed.success) {
    return { input: null, fieldErrors: ambilFieldErrors(parsed.error) };
  }

  return {
    input: {
      kode: parsed.data.kode,
      nama: parsed.data.nama,
      tipe: parsed.data.tipe,
      satuanDasarId: parsed.data.satuan_dasar,
      kategoriId: kosongJadiNull(parsed.data.kategori),
    },
    fieldErrors: {},
  };
}

const gudangSchema = z.object({
  kode: kodeMaster("gudang"),
  nama: namaMaster("gudang"),
});

export function parseGudangForm(formData: FormData): {
  input: GudangInput | null;
  fieldErrors: Record<string, string>;
} {
  const parsed = gudangSchema.safeParse({
    kode: teks(formData, "kode"),
    nama: teks(formData, "nama"),
  });

  if (!parsed.success) {
    return { input: null, fieldErrors: ambilFieldErrors(parsed.error) };
  }

  return { input: parsed.data, fieldErrors: {} };
}

const satuanSchema = z.object({
  kode: kodeMaster("satuan"),
  nama: namaMaster("satuan"),
});

export function parseSatuanForm(formData: FormData): {
  input: SatuanInput | null;
  fieldErrors: Record<string, string>;
} {
  const parsed = satuanSchema.safeParse({
    kode: teks(formData, "kode"),
    nama: teks(formData, "nama"),
  });

  if (!parsed.success) {
    return { input: null, fieldErrors: ambilFieldErrors(parsed.error) };
  }

  return { input: parsed.data, fieldErrors: {} };
}

const kategoriProdukSchema = z.object({
  kode: kodeMaster("kategori"),
  nama: namaMaster("kategori"),
});

export function parseKategoriProdukForm(formData: FormData): {
  input: KategoriProdukInput | null;
  fieldErrors: Record<string, string>;
} {
  const parsed = kategoriProdukSchema.safeParse({
    kode: teks(formData, "kode"),
    nama: teks(formData, "nama"),
  });

  if (!parsed.success) {
    return { input: null, fieldErrors: ambilFieldErrors(parsed.error) };
  }

  return { input: parsed.data, fieldErrors: {} };
}

const konversiSatuanSchema = z
  .object({
    satuan_dari: z
      .string()
      .trim()
      .min(1, "Satuan asal wajib dipilih")
      .pipe(z.uuid("Satuan asal tidak valid")),
    satuan_ke: z
      .string()
      .trim()
      .min(1, "Satuan tujuan wajib dipilih")
      .pipe(z.uuid("Satuan tujuan tidak valid")),
    faktor: desimal({
      pesanWajib: "Faktor konversi wajib diisi",
      pesanBukanAngka: "Faktor konversi harus berupa angka",
      pesanDesimal: "Faktor konversi maksimal 6 angka desimal",
      pesanBesar: "Faktor konversi terlalu besar",
      pesanNol: "Faktor konversi harus lebih dari nol",
      maksDesimal: 6,
    }),
  })
  .refine((value) => value.satuan_dari !== value.satuan_ke, {
    message: "Satuan asal dan satuan tujuan harus berbeda",
    path: ["satuan_ke"],
  });

export function parseKonversiSatuanForm(formData: FormData): {
  input: KonversiSatuanInput | null;
  fieldErrors: Record<string, string>;
} {
  const parsed = konversiSatuanSchema.safeParse({
    satuan_dari: teks(formData, "satuan_dari"),
    satuan_ke: teks(formData, "satuan_ke"),
    faktor: teks(formData, "faktor"),
  });

  if (!parsed.success) {
    return { input: null, fieldErrors: ambilFieldErrors(parsed.error) };
  }

  return {
    input: {
      satuanDariId: parsed.data.satuan_dari,
      satuanKeId: parsed.data.satuan_ke,
      faktor: parsed.data.faktor,
    },
    fieldErrors: {},
  };
}

const mataUangSchema = z.object({
  kode: z
    .string()
    .transform((value) => value.trim().toUpperCase())
    .refine((value) => value.length > 0, "Kode mata uang wajib diisi")
    .refine(
      (value) => /^[A-Z]{3}$/.test(value),
      "Kode mata uang harus 3 huruf, contoh USD",
    ),
  nama: namaMaster("mata uang"),
  simbol: z.string().trim().max(8, "Simbol mata uang maksimal 8 karakter"),
});

export function parseMataUangForm(formData: FormData): {
  input: MataUangInput | null;
  fieldErrors: Record<string, string>;
} {
  const parsed = mataUangSchema.safeParse({
    kode: teks(formData, "kode"),
    nama: teks(formData, "nama"),
    simbol: teks(formData, "simbol"),
  });

  if (!parsed.success) {
    return { input: null, fieldErrors: ambilFieldErrors(parsed.error) };
  }

  return {
    input: {
      kode: parsed.data.kode,
      nama: parsed.data.nama,
      simbol: kosongJadiNull(parsed.data.simbol),
    },
    fieldErrors: {},
  };
}

const kursSchema = z.object({
  mata_uang: z
    .string()
    .trim()
    .min(1, "Mata uang wajib dipilih")
    .pipe(z.uuid("Mata uang tidak valid")),
  tanggal: z
    .string()
    .trim()
    .min(1, "Tanggal kurs wajib diisi")
    .refine(
      (value) => /^\d{4}-\d{2}-\d{2}$/.test(value),
      "Tanggal kurs tidak valid",
    ),
  nilai: desimal({
    pesanWajib: "Nilai kurs wajib diisi",
    pesanBukanAngka: "Nilai kurs harus berupa angka",
    pesanDesimal: "Nilai kurs maksimal 6 angka desimal",
    pesanBesar: "Nilai kurs terlalu besar",
    pesanNol: "Nilai kurs harus lebih dari nol",
    maksDesimal: 6,
  }),
});

export function parseKursForm(formData: FormData): {
  input: KursInput | null;
  fieldErrors: Record<string, string>;
} {
  const parsed = kursSchema.safeParse({
    mata_uang: teks(formData, "mata_uang"),
    tanggal: teks(formData, "tanggal"),
    nilai: teks(formData, "nilai"),
  });

  if (!parsed.success) {
    return { input: null, fieldErrors: ambilFieldErrors(parsed.error) };
  }

  return {
    input: {
      mataUangId: parsed.data.mata_uang,
      tanggal: parsed.data.tanggal,
      nilai: parsed.data.nilai,
    },
    fieldErrors: {},
  };
}

const masterIdSchema = z.uuid();

export function isValidMasterId(value: unknown): value is string {
  return masterIdSchema.safeParse(value).success;
}
