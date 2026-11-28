import { z } from "zod";

import { isMoney } from "../../../core/ledger/money.ts";

const POLA_TANGGAL = /^\d{4}-\d{2}-\d{2}$/;
const POLA_WAKTU =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/;
const POLA_PECAHAN_LEBIH = /^-?(?:0|[1-9]\d*)\.\d{5,}$/;
const POLA_DESIMAL = /^-?(?:0|[1-9]\d*)(?:\.\d{1,4})?$/;
const POLA_BULAT = /^(?:0|[1-9]\d*)$/;
const POLA_ANGKA = /^-?\d+(?:\.\d+)?$/;
const MAKS_DIGIT_DESIMAL = 14;
const MAKS_DIGIT_UANG = 16;
const MAKS_BILANGAN_BULAT = 32767;

interface OpsiDesimal {
  readonly label: string;
  readonly min: "positif" | "nol";
  readonly batasAtas?: number;
  readonly pesanBatasAtas?: string;
  readonly pesanMin?: string;
}

function teksMentah(nilai: unknown): string {
  return typeof nilai === "string" ? nilai.trim() : "";
}

/** UUID input with separate missing and malformed messages. */
export function idSchema(label: string, pesanKosong?: string) {
  return z.unknown().transform((raw, ctx) => {
    const nilai = teksMentah(raw);
    if (nilai.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: pesanKosong ?? `${label} wajib dipilih`,
      });
      return z.NEVER;
    }
    if (!z.uuid().safeParse(nilai).success) {
      ctx.addIssue({ code: "custom", message: `${label} tidak valid` });
      return z.NEVER;
    }
    return nilai;
  });
}

/**
 * numeric(18,4) stays a decimal string end to end. The pattern rejects
 * exponent notation, thousands separators, and excess precision before the
 * value can become a surprising JavaScript number.
 */
export function desimalSchema(opsi: OpsiDesimal) {
  return z.unknown().transform((raw, ctx) => {
    if (raw === undefined || raw === null) {
      ctx.addIssue({ code: "custom", message: `${opsi.label} wajib diisi` });
      return z.NEVER;
    }
    if (typeof raw !== "string") {
      ctx.addIssue({
        code: "custom",
        message: `${opsi.label} harus berupa angka`,
      });
      return z.NEVER;
    }

    const nilai = raw.trim().replace(",", ".");
    if (nilai.length === 0) {
      ctx.addIssue({ code: "custom", message: `${opsi.label} wajib diisi` });
      return z.NEVER;
    }
    if (POLA_PECAHAN_LEBIH.test(nilai)) {
      ctx.addIssue({
        code: "custom",
        message: `${opsi.label} maksimal 4 angka desimal`,
      });
      return z.NEVER;
    }
    if (!POLA_DESIMAL.test(nilai)) {
      ctx.addIssue({
        code: "custom",
        message: `${opsi.label} harus berupa angka`,
      });
      return z.NEVER;
    }

    const bulat = nilai.split(".")[0]?.replace("-", "") ?? "";
    if (bulat.length > MAKS_DIGIT_DESIMAL) {
      ctx.addIssue({ code: "custom", message: `${opsi.label} terlalu besar` });
      return z.NEVER;
    }
    if (nilai.startsWith("-")) {
      ctx.addIssue({
        code: "custom",
        message:
          opsi.pesanMin ??
          (opsi.min === "positif"
            ? `${opsi.label} harus lebih dari nol`
            : `${opsi.label} tidak boleh negatif.`),
      });
      return z.NEVER;
    }
    if (Number(nilai) === 0 && opsi.min === "positif") {
      ctx.addIssue({
        code: "custom",
        message: opsi.pesanMin ?? `${opsi.label} harus lebih dari nol`,
      });
      return z.NEVER;
    }
    if (
      opsi.batasAtas !== undefined &&
      Number(nilai) >= opsi.batasAtas
    ) {
      ctx.addIssue({
        code: "custom",
        message: opsi.pesanBatasAtas ?? `${opsi.label} di luar rentang`,
      });
      return z.NEVER;
    }
    return nilai;
  });
}

/** Whole-rupiah input: the ledger validator stays authoritative. */
export function uangSchema(label: string) {
  return z.unknown().transform((raw, ctx) => {
    if (raw === undefined || raw === null) {
      ctx.addIssue({ code: "custom", message: `${label} wajib diisi` });
      return z.NEVER;
    }
    if (typeof raw !== "string") {
      ctx.addIssue({ code: "custom", message: `${label} harus berupa angka` });
      return z.NEVER;
    }

    const nilai = raw.trim().replace(",", ".");
    if (nilai.length === 0) {
      ctx.addIssue({ code: "custom", message: `${label} wajib diisi` });
      return z.NEVER;
    }
    if (nilai.startsWith("-")) {
      ctx.addIssue({ code: "custom", message: `${label} tidak boleh negatif` });
      return z.NEVER;
    }
    if (!POLA_ANGKA.test(nilai)) {
      ctx.addIssue({ code: "custom", message: `${label} harus berupa angka` });
      return z.NEVER;
    }

    const bulat = nilai.split(".")[0] ?? "";
    if (bulat.length > MAKS_DIGIT_UANG) {
      ctx.addIssue({ code: "custom", message: `${label} terlalu besar` });
      return z.NEVER;
    }
    if (bulat.length > 1 && bulat.startsWith("0")) {
      ctx.addIssue({ code: "custom", message: `${label} harus berupa angka` });
      return z.NEVER;
    }
    if (!isMoney(nilai)) {
      ctx.addIssue({
        code: "custom",
        message: `${label} harus bulat tanpa sen.`,
      });
      return z.NEVER;
    }
    return nilai;
  });
}

export function bilanganBulatSchema(label: string) {
  return z.unknown().transform((raw, ctx) => {
    if (raw === undefined || raw === null) {
      ctx.addIssue({ code: "custom", message: `${label} wajib diisi` });
      return z.NEVER;
    }
    const nilai = typeof raw === "string" ? raw.trim() : "";
    if (nilai.length === 0) {
      ctx.addIssue({ code: "custom", message: `${label} wajib diisi` });
      return z.NEVER;
    }
    if (!POLA_BULAT.test(nilai)) {
      ctx.addIssue({
        code: "custom",
        message: `${label} harus berupa angka bulat`,
      });
      return z.NEVER;
    }
    const angka = Number(nilai);
    if (angka === 0) {
      ctx.addIssue({ code: "custom", message: `${label} harus lebih dari nol` });
      return z.NEVER;
    }
    if (angka > MAKS_BILANGAN_BULAT) {
      ctx.addIssue({ code: "custom", message: `${label} terlalu besar` });
      return z.NEVER;
    }
    return angka;
  });
}

export function tanggalSchema(label: string) {
  return z.unknown().transform((raw, ctx) => {
    const nilai = teksMentah(raw);
    if (nilai.length === 0) {
      ctx.addIssue({ code: "custom", message: `${label} wajib diisi` });
      return z.NEVER;
    }
    const detik = Date.parse(`${nilai}T00:00:00Z`);
    if (
      !POLA_TANGGAL.test(nilai) ||
      Number.isNaN(detik) ||
      new Date(detik).toISOString().slice(0, 10) !== nilai
    ) {
      ctx.addIssue({ code: "custom", message: `${label} tidak valid` });
      return z.NEVER;
    }
    return nilai;
  });
}

export function tanggalWaktuSchema(label: string) {
  return z.unknown().transform((raw, ctx) => {
    const nilai = teksMentah(raw);
    if (nilai.length === 0) {
      ctx.addIssue({ code: "custom", message: `${label} wajib diisi` });
      return z.NEVER;
    }
    const detik = Date.parse(nilai);
    const hari = nilai.slice(0, 10);
    const hariDetik = Date.parse(`${hari}T00:00:00Z`);
    const hariSah =
      !Number.isNaN(hariDetik) &&
      new Date(hariDetik).toISOString().slice(0, 10) === hari;
    if (!POLA_WAKTU.test(nilai) || Number.isNaN(detik) || !hariSah) {
      ctx.addIssue({ code: "custom", message: `${label} tidak valid` });
      return z.NEVER;
    }
    return nilai;
  });
}

export function teksOpsionalSchema(label: string, maks = 500) {
  return z.unknown().transform((raw, ctx) => {
    if (raw === undefined || raw === null || raw === "") return null;
    if (typeof raw !== "string") {
      ctx.addIssue({ code: "custom", message: `${label} tidak valid` });
      return z.NEVER;
    }
    const nilai = raw.trim();
    if (nilai.length === 0) return null;
    if (nilai.length > maks) {
      ctx.addIssue({
        code: "custom",
        message: `${label} maksimal ${maks} karakter`,
      });
      return z.NEVER;
    }
    return nilai;
  });
}

/** Exact decimal comparison for invariant checks; no float arithmetic. */
export function satuan4(nilai: string): bigint {
  const [bulat, pecahan = ""] = nilai.split(".");
  return (
    BigInt(bulat) * BigInt(10000) +
    BigInt(pecahan.padEnd(4, "0"))
  );
}

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const hasil: Record<string, string> = {};
  for (const issue of error.issues) {
    const kunci = issue.path.length > 0 ? issue.path.map(String).join(".") : "form";
    if (!(kunci in hasil)) hasil[kunci] = issue.message;
  }
  return hasil;
}

