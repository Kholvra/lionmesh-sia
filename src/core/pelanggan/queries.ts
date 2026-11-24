import type { SupabaseClient } from "@supabase/supabase-js";

import { fail, ok, type Result } from "@/lib/result";

import {
  PESAN_BACA_GAGAL,
  PESAN_KONTAK_TANPA_IZIN,
  PESAN_TIDAK_DITEMUKAN,
} from "./messages";
import { KOLOM_KONTAK, KOLOM_RINGKAS, mapPelanggan } from "./service";
import type {
  ListPelangganInput,
  ListPelangganResult,
  Pelanggan,
  PelangganAktor,
} from "./types";
import { PERAN_BACA_KONTAK } from "./types";

type Row = Record<string, unknown>;

const URUT_KOLOM = {
  nama: "nama",
  kode: "kode_pelanggan",
  termin: "termin_hari",
  batas: "batas_kredit",
  status: "status",
} as const;

function bersihkanCari(value: string | undefined): string | null {
  const teks = value?.trim();
  if (!teks) return null;
  return teks.replace(/[%_,()\\]/g, " ").replace(/\s+/g, " ").trim() || null;
}

export function canReadKontak(aktor: PelangganAktor): boolean {
  return (
    aktor.peran !== null &&
    (PERAN_BACA_KONTAK as readonly string[]).includes(aktor.peran)
  );
}

export async function listPelanggan(
  supabase: SupabaseClient,
  input: ListPelangganInput,
): Promise<Result<ListPelangganResult>> {
  const urut = URUT_KOLOM[input.urutkan ?? "nama"];
  const ascending = (input.arah ?? "ascending") === "ascending";
  const cari = bersihkanCari(input.cari);

  let query = supabase
    .from("pelanggan")
    .select(KOLOM_RINGKAS, { count: "exact" });

  if (cari) query = query.ilike("nama", `%${cari}%`);
  if (input.status) query = query.eq("status", input.status);

  const { data, count, error } = await query
    .order(urut, { ascending })
    .order("id", { ascending: true })
    .range(input.offset, input.offset + input.limit - 1);

  if (error) return fail(PESAN_BACA_GAGAL);

  return ok({
    baris: (data ?? []).map((row) => mapPelanggan(row as Row)),
    total: count ?? 0,
  });
}

/** Reads the master row without contact data. */
export async function getPelanggan(
  supabase: SupabaseClient,
  id: string,
): Promise<Result<Pelanggan>> {
  const { data, error } = await supabase
    .from("pelanggan")
    .select(KOLOM_RINGKAS)
    .eq("id", id)
    .maybeSingle();

  if (error) return fail(PESAN_BACA_GAGAL);
  if (!data) return fail(PESAN_TIDAK_DITEMUKAN);

  return ok(mapPelanggan(data as Row));
}

/** PRE-04: contact data is selected only for authorised roles. */
export async function getPelangganDenganKontak(
  supabase: SupabaseClient,
  id: string,
  aktor: PelangganAktor,
): Promise<Result<Pelanggan>> {
  if (!canReadKontak(aktor)) return fail(PESAN_KONTAK_TANPA_IZIN);

  const { data, error } = await supabase
    .from("pelanggan")
    .select(`${KOLOM_RINGKAS}, ${KOLOM_KONTAK}`)
    .eq("id", id)
    .maybeSingle();

  if (error) return fail(PESAN_BACA_GAGAL);
  if (!data) return fail(PESAN_TIDAK_DITEMUKAN);

  return ok(mapPelanggan(data as Row));
}
