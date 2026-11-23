import { z } from "zod";

import type { PemasokInput } from "@/core/pemasok";

import type {
  PemasokActionState,
  PemasokField,
  PemasokFieldErrors,
} from "./form-state";

export type { PemasokActionState, PemasokField, PemasokFieldErrors };

const PESAN_NAMA = "Nama pemasok wajib diisi";
const PESAN_TERMIN = "Termin pembayaran wajib diisi";
const PESAN_TERMIN_ANGKA = "Termin pembayaran harus berupa angka";
const PESAN_TERMIN_RENTANG = "Termin pembayaran harus berupa angka bulat minimal 0";
const PESAN_TERMIN_BESAR = "Termin pembayaran terlalu besar";
const PESAN_NOMINAL_BESAR = "Toleransi nominal terlalu besar";
const PESAN_PERSEN_ANGKA = "Toleransi persen harus berupa angka";
const PESAN_PERSEN_RENTANG = "Toleransi persen harus antara 0 dan 100";
const PESAN_PERSEN_DESIMAL = "Toleransi persen maksimal 2 angka desimal";
const PESAN_NOMINAL_ANGKA = "Toleransi nominal harus berupa angka";
const PESAN_NOMINAL_RENTANG = "Toleransi nominal tidak boleh negatif";
const PESAN_NOMINAL_DESIMAL = "Toleransi nominal maksimal 2 angka desimal";

/** Reads a text field, keeping an empty input distinct from a missing one. */
function teks(formData: FormData, field: PemasokField): string {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
}

type AturanAngka = {
  pesanWajib: string;
  pesanBukanAngka: string;
  pesanDesimal: string;
  pesanRentang: string;
  min: number;
  max?: number;
  pesanMaks?: string;
  bulat?: boolean;
  maksDesimal?: number;
  /** Value used when the field is blank; omit to make the field required. */
  kosongJadi?: number;
};

// Only digits, an optional sign, and the Indonesian decimal comma. This rejects
// "1e3", "0x10", ".5" and "30." before they can become a surprising number.
const POLA_ANGKA = /^-?\d+(\.\d+)?$/;

function angka(aturan: AturanAngka) {
  return z.string().transform((raw, ctx) => {
    const trimmed = raw.trim();

    if (trimmed.length === 0) {
      if (aturan.kosongJadi !== undefined) return aturan.kosongJadi;
      ctx.addIssue({ code: "custom", message: aturan.pesanWajib });
      return z.NEVER;
    }

    const normal = trimmed.replace(",", ".");
    if (!POLA_ANGKA.test(normal)) {
      ctx.addIssue({ code: "custom", message: aturan.pesanBukanAngka });
      return z.NEVER;
    }

    const nilai = Number(normal);
    const desimal = normal.split(".")[1] ?? "";
    if (aturan.maksDesimal !== undefined && desimal.length > aturan.maksDesimal) {
      ctx.addIssue({ code: "custom", message: aturan.pesanDesimal });
      return z.NEVER;
    }

    if (aturan.max !== undefined && nilai > aturan.max && aturan.pesanMaks) {
      ctx.addIssue({ code: "custom", message: aturan.pesanMaks });
      return z.NEVER;
    }

    const diLuarRentang =
      (aturan.bulat === true && !Number.isInteger(nilai)) ||
      nilai < aturan.min ||
      (aturan.max !== undefined && nilai > aturan.max);

    if (diLuarRentang) {
      ctx.addIssue({ code: "custom", message: aturan.pesanRentang });
      return z.NEVER;
    }

    return nilai;
  });
}

// numeric(18,2) must not become a JS number: 9007199254740993 would arrive as
// 9007199254740992. Keep it a string all the way to the RPC, like core/ledger.
const MAKS_DIGIT_BULAT_UANG = 16;

function uang(aturan: {
  pesanBukanAngka: string;
  pesanDesimal: string;
  pesanBesar: string;
  pesanNegatif: string;
}) {
  return z.string().transform((raw, ctx) => {
    const trimmed = raw.trim();
    if (trimmed.length === 0) return "0";

    const normal = trimmed.replace(",", ".");

    if (normal.startsWith("-") && /^\d+(\.\d+)?$/.test(normal.slice(1))) {
      ctx.addIssue({ code: "custom", message: aturan.pesanNegatif });
      return z.NEVER;
    }

    if (!/^\d+(\.\d+)?$/.test(normal)) {
      ctx.addIssue({ code: "custom", message: aturan.pesanBukanAngka });
      return z.NEVER;
    }

    const [bulat, desimal = ""] = normal.split(".");
    if (desimal.length > 2) {
      ctx.addIssue({ code: "custom", message: aturan.pesanDesimal });
      return z.NEVER;
    }
    if (bulat.length > MAKS_DIGIT_BULAT_UANG) {
      ctx.addIssue({ code: "custom", message: aturan.pesanBesar });
      return z.NEVER;
    }

    return normal;
  });
}

const pemasokFormSchema = z.object({
  nama: z.string().trim().min(1, PESAN_NAMA),
  alamat: z.string().trim(),
  npwp: z.string().trim(),
  kontak_perusahaan: z.string().trim(),
  kontak_pic_nama: z.string().trim(),
  kontak_pic_telepon: z.string().trim(),
  termin_hari: angka({
    pesanWajib: PESAN_TERMIN,
    pesanBukanAngka: PESAN_TERMIN_ANGKA,
    pesanDesimal: PESAN_TERMIN_RENTANG,
    pesanRentang: PESAN_TERMIN_RENTANG,
    min: 0,
    max: 2_147_483_647,
    pesanMaks: PESAN_TERMIN_BESAR,
    bulat: true,
  }),
  toleransi_persen: angka({
    pesanWajib: PESAN_PERSEN_RENTANG,
    pesanBukanAngka: PESAN_PERSEN_ANGKA,
    pesanDesimal: PESAN_PERSEN_DESIMAL,
    pesanRentang: PESAN_PERSEN_RENTANG,
    min: 0,
    max: 100,
    maksDesimal: 2,
    kosongJadi: 0,
  }),
  toleransi_nominal: uang({
    pesanBukanAngka: PESAN_NOMINAL_ANGKA,
    pesanDesimal: PESAN_NOMINAL_DESIMAL,
    pesanBesar: PESAN_NOMINAL_BESAR,
    pesanNegatif: PESAN_NOMINAL_RENTANG,
  }),
});

function kosongJadiNull(value: string): string | null {
  return value.length > 0 ? value : null;
}

export function parsePemasokForm(formData: FormData): {
  input: PemasokInput | null;
  fieldErrors: PemasokFieldErrors;
} {
  const parsed = pemasokFormSchema.safeParse({
    nama: teks(formData, "nama"),
    alamat: teks(formData, "alamat"),
    npwp: teks(formData, "npwp"),
    kontak_perusahaan: teks(formData, "kontak_perusahaan"),
    kontak_pic_nama: teks(formData, "kontak_pic_nama"),
    kontak_pic_telepon: teks(formData, "kontak_pic_telepon"),
    termin_hari: teks(formData, "termin_hari"),
    toleransi_persen: teks(formData, "toleransi_persen"),
    toleransi_nominal: teks(formData, "toleransi_nominal"),
  });

  if (!parsed.success) {
    const fieldErrors: PemasokFieldErrors = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !(key in fieldErrors)) {
        fieldErrors[key as PemasokField] = issue.message;
      }
    }
    return { input: null, fieldErrors };
  }

  const nilai = parsed.data;

  return {
    input: {
      nama: nilai.nama,
      alamat: kosongJadiNull(nilai.alamat),
      npwp: kosongJadiNull(nilai.npwp),
      kontakPerusahaan: kosongJadiNull(nilai.kontak_perusahaan),
      kontakPicNama: kosongJadiNull(nilai.kontak_pic_nama),
      kontakPicTelepon: kosongJadiNull(nilai.kontak_pic_telepon),
      terminHari: nilai.termin_hari,
      toleransiPersen: nilai.toleransi_persen,
      toleransiNominal: nilai.toleransi_nominal,
    },
    fieldErrors: {},
  };
}

const pemasokIdSchema = z.uuid();

export function isValidPemasokId(value: unknown): value is string {
  return pemasokIdSchema.safeParse(value).success;
}
