import type { PemasokInput } from "@/core/pemasok";

export type PemasokField =
  | "nama"
  | "alamat"
  | "npwp"
  | "kontak_perusahaan"
  | "kontak_pic_nama"
  | "kontak_pic_telepon"
  | "termin_hari"
  | "toleransi_persen"
  | "toleransi_nominal";

export type PemasokFieldErrors = Partial<Record<PemasokField, string>>;

export type PemasokActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: PemasokFieldErrors;
};

export const INITIAL_PEMASOK_ACTION_STATE: PemasokActionState = {
  status: "idle",
};

function textValue(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(value: FormDataEntryValue | null): string | null {
  const text = textValue(value);
  return text.length > 0 ? text : null;
}

function parseNumber(value: FormDataEntryValue | null, fallback: number): number {
  const text = textValue(value);
  if (text.length === 0) return fallback;
  return Number(text.replace(",", "."));
}

export function parsePemasokForm(formData: FormData): {
  input: PemasokInput | null;
  fieldErrors: PemasokFieldErrors;
} {
  const fieldErrors: PemasokFieldErrors = {};

  const nama = textValue(formData.get("nama"));
  if (nama.length === 0) {
    fieldErrors.nama = "Nama pemasok wajib diisi";
  }

  const terminText = textValue(formData.get("termin_hari"));
  const terminHari = Number(terminText);
  if (terminText.length === 0) {
    fieldErrors.termin_hari = "Termin pembayaran wajib diisi";
  } else if (!Number.isInteger(terminHari) || terminHari < 0) {
    fieldErrors.termin_hari = "Termin pembayaran harus berupa angka bulat minimal 0";
  }

  const toleransiPersen = parseNumber(formData.get("toleransi_persen"), 0);
  if (
    !Number.isFinite(toleransiPersen) ||
    toleransiPersen < 0 ||
    toleransiPersen > 100
  ) {
    fieldErrors.toleransi_persen = "Toleransi persen harus antara 0 dan 100";
  }

  const toleransiNominal = parseNumber(formData.get("toleransi_nominal"), 0);
  if (!Number.isFinite(toleransiNominal) || toleransiNominal < 0) {
    fieldErrors.toleransi_nominal = "Toleransi nominal tidak boleh negatif";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { input: null, fieldErrors };
  }

  return {
    input: {
      nama,
      alamat: optionalText(formData.get("alamat")),
      npwp: optionalText(formData.get("npwp")),
      kontakPerusahaan: optionalText(formData.get("kontak_perusahaan")),
      kontakPicNama: optionalText(formData.get("kontak_pic_nama")),
      kontakPicTelepon: optionalText(formData.get("kontak_pic_telepon")),
      terminHari,
      toleransiPersen,
      toleransiNominal,
    },
    fieldErrors,
  };
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidPemasokId(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}
