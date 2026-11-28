import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { readAllPages } from "@/core/dashboard/pagination";
import { ambilTeks } from "@/lib/ambil-teks";
import { parseRpcResult } from "@/lib/parse-rpc-result";
import { fail, ok, type Result } from "@/lib/result";
import { isRecord } from "@/lib/validation";
import type { MutasiKartu } from "./report";

export interface ProdukRingkas {
  id: string;
  kode: string;
  nama: string;
}

export interface GudangRingkas {
  id: string;
  kode: string;
  nama: string;
}

export interface FilterMutasiKartu {
  produkId: string;
  gudangId: string;
  /** Batas bawah inklusif, ISO dengan offset. */
  mulai?: string;
  /** Batas atas eksklusif, ISO dengan offset. */
  selesai?: string;
}

const PILIHAN_TEKS = { coerceNumber: true, onlyFiniteNumbers: true } as const;

const teksWajib = z.preprocess(
  (value) => ambilTeks(value, PILIHAN_TEKS),
  z.string().min(1),
);

const teksBolehNull = z.preprocess(
  (value) => (value === null ? null : ambilTeks(value, PILIHAN_TEKS)),
  z.string().nullable(),
);

const mutasiSchema = z.object({
  id: teksWajib,
  tanggal: teksWajib,
  tipe: teksWajib,
  qty: teksWajib,
  nilai: teksWajib,
  harga_satuan: teksWajib,
  sumber_tipe: teksWajib,
  sumber_id: teksWajib,
  alasan: teksBolehNull,
});

const ringkasSchema = z.object({
  id: teksWajib,
  kode: teksWajib,
  nama: teksWajib,
});

type Ringkas = { id: string; kode: string; nama: string };

function petakanRingkas(value: unknown): Ringkas | null {
  if (!isRecord(value)) return null;
  return parseRpcResult(ringkasSchema, value);
}

function petakanMutasi(value: unknown): MutasiKartu | null {
  if (!isRecord(value)) return null;
  const data = parseRpcResult(mutasiSchema, value);
  if (!data) return null;
  return {
    id: data.id,
    tanggal: data.tanggal,
    tipe: data.tipe,
    qty: data.qty,
    nilai: data.nilai,
    hargaSatuan: data.harga_satuan,
    sumberTipe: data.sumber_tipe,
    sumberId: data.sumber_id,
    alasan: data.alasan,
  };
}

interface FilterBacaMutasi {
  produkId?: string;
  gudangId?: string;
  /** Batas bawah inklusif, ISO dengan offset. */
  mulai?: string;
  /** Batas atas eksklusif, ISO dengan offset. */
  selesai?: string;
}

async function bacaMutasi(
  supabase: SupabaseClient,
  filter: FilterBacaMutasi,
  denganFilterProdukGudang: boolean,
): Promise<Result<MutasiKartu[]>> {
  const state: { galat: string | null } = { galat: null };

  const { data, error } = await readAllPages(async (from, to) => {
    let query = supabase
      .from("mutasi_stok")
      .select(
        "id, tanggal, tipe, qty::text, nilai::text, harga_satuan::text, sumber_tipe, sumber_id, alasan",
      )
      .order("tanggal", { ascending: true })
      .order("id", { ascending: true })
      .range(from, to);

    if (denganFilterProdukGudang) {
      query = query
        .eq("produk_id", filter.produkId as string)
        .eq("gudang_id", filter.gudangId as string);
    }
    if (filter.mulai) query = query.gte("tanggal", filter.mulai);
    if (filter.selesai) query = query.lt("tanggal", filter.selesai);

    const result = await query;
    if (result.error) {
      state.galat = `Gagal membaca mutasi stok: ${result.error.message}`;
      return { data: [], error: result.error };
    }
    if (!Array.isArray(result.data)) {
      state.galat = "Respons mutasi stok tidak valid.";
      return { data: [], error: null };
    }

    const halaman: MutasiKartu[] = [];
    for (const item of result.data) {
      const mutasi = petakanMutasi(item);
      if (!mutasi) {
        state.galat = "Data mutasi stok tidak lengkap.";
        return { data: [], error: null };
      }
      halaman.push(mutasi);
    }
    return { data: halaman, error: null };
  });

  if (state.galat !== null) return fail(state.galat);
  if (error !== null) return fail(error);
  return ok(data as MutasiKartu[]);
}

export async function listMutasiKartu(
  supabase: SupabaseClient,
  filter: FilterMutasiKartu,
): Promise<Result<MutasiKartu[]>> {
  return bacaMutasi(supabase, filter, true);
}

export interface FilterMutasiPeriode {
  /** Batas bawah inklusif, ISO dengan offset. */
  mulai?: string;
  /** Batas atas eksklusif, ISO dengan offset. */
  selesai?: string;
}

/**
 * All stock movements in a period across products and warehouses. Used only
 * for the aggregate reconciliation control total; per-product cards keep
 * using `listMutasiKartu`.
 */
export async function listMutasiPeriode(
  supabase: SupabaseClient,
  filter: FilterMutasiPeriode = {},
): Promise<Result<MutasiKartu[]>> {
  return bacaMutasi(supabase, filter, false);
}

export async function listProdukRingkas(
  supabase: SupabaseClient,
): Promise<Result<ProdukRingkas[]>> {
  const { data, error } = await supabase
    .from("produk")
    .select("id, kode, nama")
    .order("kode", { ascending: true });

  if (error) return fail(`Gagal membaca produk: ${error.message}`);
  if (!Array.isArray(data)) return fail("Respons produk tidak valid.");

  const hasil: ProdukRingkas[] = [];
  for (const item of data) {
    const ringkas = petakanRingkas(item);
    if (!ringkas) return fail("Data produk tidak lengkap.");
    hasil.push(ringkas);
  }

  return ok(hasil);
}

export async function listGudangRingkas(
  supabase: SupabaseClient,
): Promise<Result<GudangRingkas[]>> {
  const { data, error } = await supabase
    .from("gudang")
    .select("id, kode, nama")
    .order("kode", { ascending: true });

  if (error) return fail(`Gagal membaca gudang: ${error.message}`);
  if (!Array.isArray(data)) return fail("Respons gudang tidak valid.");

  const hasil: GudangRingkas[] = [];
  for (const item of data) {
    const ringkas = petakanRingkas(item);
    if (!ringkas) return fail("Data gudang tidak lengkap.");
    hasil.push(ringkas);
  }

  return ok(hasil);
}
