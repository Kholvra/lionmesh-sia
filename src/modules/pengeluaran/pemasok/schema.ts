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
const PESAN_TERMIN_BULAT = "Termin pembayaran harus berupa angka bulat minimal 0";
const PESAN_PERSEN = "Toleransi persen harus antara 0 dan 100";
const PESAN_PERSEN_ANGKA = "Toleransi persen harus berupa angka";
const PESAN_NOMINAL = "Toleransi nominal tidak boleh negatif";
const PESAN_NOMINAL_ANGKA = "Toleransi nominal harus berupa angka";
const PESAN_DESIMAL = "Maksimal 2 angka desimal";

/** Reads a text field, keeping an empty input distinct from a missing one. */
function teks(formData: FormData, field: PemasokField): string {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
}

const pemasokFormSchema = z.object({
  nama: z.string().trim().min(1, PESAN_NAMA),
  alamat: z.string().trim(),
  npwp: z.string().trim(),
  kontak_perusahaan: z.string().trim(),
  kontak_pic_nama: z.string().trim(),
  kontak_pic_telepon: z.string().trim(),
  termin_hari: z.string(),
  toleransi_persen: z.string(),
  toleransi_nominal: z.string(),
});

type AngkaTerbaca = { nilai: number } | { pesan: string };

function bacaAngka(
  raw: string,
  pesanWajib: string,
  pesanBukanAngka: string,
  maksDesimal: number | null,
): AngkaTerbaca {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return { pesan: pesanWajib };

  // The form accepts the Indonesian decimal comma; anything else is a mistake.
  const normal = trimmed.replace(",", ".");
  const nilai = Number(normal);
  if (!Number.isFinite(nilai)) return { pesan: pesanBukanAngka };

  if (maksDesimal !== null) {
    const [, desimal = ""] = normal.split(".");
    if (desimal.length > maksDesimal) return { pesan: PESAN_DESIMAL };
  }

  return { nilai };
}

function kosongJadiNull(value: string): string | null {
  return value.length > 0 ? value : null;
}

export function parsePemasokForm(formData: FormData): {
  input: PemasokInput | null;
  fieldErrors: PemasokFieldErrors;
} {
  const mentah = {
    nama: teks(formData, "nama"),
    alamat: teks(formData, "alamat"),
    npwp: teks(formData, "npwp"),
    kontak_perusahaan: teks(formData, "kontak_perusahaan"),
    kontak_pic_nama: teks(formData, "kontak_pic_nama"),
    kontak_pic_telepon: teks(formData, "kontak_pic_telepon"),
    termin_hari: teks(formData, "termin_hari"),
    toleransi_persen: teks(formData, "toleransi_persen"),
    toleransi_nominal: teks(formData, "toleransi_nominal"),
  };

  const fieldErrors: PemasokFieldErrors = {};
  const parsed = pemasokFormSchema.safeParse(mentah);

  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !(key in fieldErrors)) {
        fieldErrors[key as PemasokField] = issue.message;
      }
    }
  }

  const termin = bacaAngka(mentah.termin_hari, PESAN_TERMIN, PESAN_TERMIN_ANGKA, null);
  // D-15: both tolerances default to zero when the field is left empty.
  const persen =
    mentah.toleransi_persen.trim().length === 0
      ? { nilai: 0 }
      : bacaAngka(mentah.toleransi_persen, PESAN_PERSEN, PESAN_PERSEN_ANGKA, 2);
  const nominal =
    mentah.toleransi_nominal.trim().length === 0
      ? { nilai: 0 }
      : bacaAngka(mentah.toleransi_nominal, PESAN_NOMINAL, PESAN_NOMINAL_ANGKA, 2);

  if ("pesan" in termin) {
    fieldErrors.termin_hari = termin.pesan;
  } else if (!Number.isInteger(termin.nilai) || termin.nilai < 0) {
    fieldErrors.termin_hari = PESAN_TERMIN_BULAT;
  }

  if ("pesan" in persen) {
    fieldErrors.toleransi_persen = persen.pesan;
  } else if (persen.nilai < 0 || persen.nilai > 100) {
    fieldErrors.toleransi_persen = PESAN_PERSEN;
  }

  if ("pesan" in nominal) {
    fieldErrors.toleransi_nominal = nominal.pesan;
  } else if (nominal.nilai < 0) {
    fieldErrors.toleransi_nominal = PESAN_NOMINAL;
  }

  if (Object.keys(fieldErrors).length > 0 || !parsed.success) {
    return { input: null, fieldErrors };
  }

  // Reaching here means every reading produced a number; narrow for TypeScript.
  if ("pesan" in termin || "pesan" in persen || "pesan" in nominal) {
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
      terminHari: termin.nilai,
      toleransiPersen: persen.nilai,
      toleransiNominal: nominal.nilai,
    },
    fieldErrors: {},
  };
}

const pemasokIdSchema = z.uuid();

export function isValidPemasokId(value: unknown): value is string {
  return pemasokIdSchema.safeParse(value).success;
}
