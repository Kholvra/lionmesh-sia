import type { SupabaseClient } from "@supabase/supabase-js";

import { isMoney } from "@/core/ledger/money";
import { fail, ok, type Result } from "@/lib/result";

import {
  PESAN_BATAS_BUKAN_ANGKA,
  PESAN_BATAS_NEGATIF,
  PESAN_BATAS_TANPA_IZIN,
  PESAN_NAMA_KOSONG,
  PESAN_SIMPAN_GAGAL,
  PESAN_STATUS_INVALID,
  PESAN_TERMIN_INVALID,
  PESAN_TIDAK_DITEMUKAN,
} from "./messages";
import {
  STATUS_PELANGGAN,
  type CreatePelangganInput,
  type Pelanggan,
  type PelangganAktor,
  type StatusPelanggan,
  type UpdateBatasKreditInput,
  type UpdatePelangganInput,
  type UpdateStatusPelangganInput,
} from "./types";

type Row = Record<string, unknown>;

export const KOLOM_RINGKAS =
  "id, kode_pelanggan, nama, termin_hari, batas_kredit, status, created_at, updated_at";
export const KOLOM_KONTAK = "npwp, alamat, telepon, email";

function asString(value: unknown): string {
  return typeof value === "string" ? value : String(value ?? "");
}

function asNumber(value: unknown): number {
  return typeof value === "number" ? value : Number(value);
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function mapPelanggan(row: Row): Pelanggan {
  return {
    id: asString(row.id),
    kodePelanggan: asString(row.kode_pelanggan),
    nama: asString(row.nama),
    terminHari: asNumber(row.termin_hari),
    batasKredit: asString(row.batas_kredit),
    status: asString(row.status) as StatusPelanggan,
    npwp: asNullableString(row.npwp),
    alamat: asNullableString(row.alamat),
    telepon: asNullableString(row.telepon),
    email: asNullableString(row.email),
    createdAt: asString(row.created_at),
    updatedAt: asString(row.updated_at),
  };
}

export function parseNama(value: unknown): Result<string> {
  const nama = typeof value === "string" ? value.trim() : "";
  return nama.length > 0 ? ok(nama) : fail(PESAN_NAMA_KOSONG);
}

/** Empty termin means the default of 30 days (PRE-02, POST-01). */
export function parseTermin(value: unknown): Result<number> {
  if (value === undefined || value === null) return ok(30);

  const teks = typeof value === "string" ? value.trim() : String(value);
  if (teks === "") return ok(30);
  if (!/^\d+$/.test(teks)) return fail(PESAN_TERMIN_INVALID);

  const termin = Number(teks);
  if (!Number.isInteger(termin) || termin < 0) {
    return fail(PESAN_TERMIN_INVALID);
  }

  return ok(termin);
}

/** Credit limit is a non-negative decimal string; empty means cash (0). */
export function parseBatasKredit(value: unknown): Result<string> {
  if (value === undefined || value === null) return ok("0");

  const teks = typeof value === "string" ? value.trim() : String(value);
  if (teks === "") return ok("0");
  if (teks.startsWith("-")) return fail(PESAN_BATAS_NEGATIF);
  if (!isMoney(teks)) return fail(PESAN_BATAS_BUKAN_ANGKA);

  return ok(teks);
}

export function optionalText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const teks = value.trim();
  return teks.length > 0 ? teks : null;
}

function parseStatus(value: unknown): Result<StatusPelanggan> {
  return typeof value === "string" &&
    (STATUS_PELANGGAN as readonly string[]).includes(value)
    ? ok(value as StatusPelanggan)
    : fail(PESAN_STATUS_INVALID);
}

/**
 * Creates a customer. Penjualan may set the initial credit limit; later changes
 * go through updateBatasKredit, which requires Manajemen (PRE-01).
 */
export async function createPelanggan(
  supabase: SupabaseClient,
  input: CreatePelangganInput,
  aktor: PelangganAktor,
): Promise<Result<Pelanggan>> {
  const nama = parseNama(input.nama);
  if (!nama.ok) return nama;

  const termin = parseTermin(input.terminHari);
  if (!termin.ok) return termin;

  const batasKredit = parseBatasKredit(input.batasKredit);
  if (!batasKredit.ok) return batasKredit;

  const { data, error } = await supabase
    .from("pelanggan")
    .insert({
      nama: nama.data,
      termin_hari: termin.data,
      batas_kredit: batasKredit.data,
      npwp: optionalText(input.npwp),
      alamat: optionalText(input.alamat),
      telepon: optionalText(input.telepon),
      email: optionalText(input.email),
      created_by: aktor.id,
      updated_by: aktor.id,
    })
    .select(`${KOLOM_RINGKAS}, ${KOLOM_KONTAK}`)
    .single();

  if (error || !data) return fail(PESAN_SIMPAN_GAGAL);

  return ok(mapPelanggan(data as Row));
}

/** Updates master fields and term. The credit limit has its own action. */
export async function updatePelanggan(
  supabase: SupabaseClient,
  input: UpdatePelangganInput,
  aktor: PelangganAktor,
): Promise<Result<Pelanggan>> {
  const nama = parseNama(input.nama);
  if (!nama.ok) return nama;

  const termin = parseTermin(input.terminHari);
  if (!termin.ok) return termin;

  const { data, error } = await supabase
    .from("pelanggan")
    .update({
      nama: nama.data,
      termin_hari: termin.data,
      npwp: optionalText(input.npwp),
      alamat: optionalText(input.alamat),
      telepon: optionalText(input.telepon),
      email: optionalText(input.email),
      updated_by: aktor.id,
    })
    .eq("id", input.id)
    .select(`${KOLOM_RINGKAS}, ${KOLOM_KONTAK}`)
    .maybeSingle();

  if (error) return fail(PESAN_SIMPAN_GAGAL);
  if (!data) return fail(PESAN_TIDAK_DITEMUKAN);

  return ok(mapPelanggan(data as Row));
}

/** PRE-01 / INV-03: only Manajemen may change an existing credit limit. */
export async function updateBatasKredit(
  supabase: SupabaseClient,
  input: UpdateBatasKreditInput,
  aktor: PelangganAktor,
): Promise<Result<Pelanggan>> {
  if (aktor.peran !== "Manajemen") return fail(PESAN_BATAS_TANPA_IZIN);

  const batasKredit = parseBatasKredit(input.batasKredit);
  if (!batasKredit.ok) return batasKredit;

  const { data, error } = await supabase
    .from("pelanggan")
    .update({
      batas_kredit: batasKredit.data,
      updated_by: aktor.id,
    })
    .eq("id", input.id)
    .select(`${KOLOM_RINGKAS}, ${KOLOM_KONTAK}`)
    .maybeSingle();

  if (error) return fail(PESAN_SIMPAN_GAGAL);
  if (!data) return fail(PESAN_TIDAK_DITEMUKAN);

  return ok(mapPelanggan(data as Row));
}

/** D-50: activation changes the status; the row is never deleted. */
export async function updateStatusPelanggan(
  supabase: SupabaseClient,
  input: UpdateStatusPelangganInput,
  aktor: PelangganAktor,
): Promise<Result<Pelanggan>> {
  const status = parseStatus(input.status);
  if (!status.ok) return status;

  const { data, error } = await supabase
    .from("pelanggan")
    .update({
      status: status.data,
      updated_by: aktor.id,
    })
    .eq("id", input.id)
    .select(`${KOLOM_RINGKAS}, ${KOLOM_KONTAK}`)
    .maybeSingle();

  if (error) return fail(PESAN_SIMPAN_GAGAL);
  if (!data) return fail(PESAN_TIDAK_DITEMUKAN);

  return ok(mapPelanggan(data as Row));
}
