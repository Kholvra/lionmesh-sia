import type { SupabaseClient } from "@supabase/supabase-js";

import { fail, ok, type Result } from "@/lib/result";
import { isRecord } from "@/lib/validation";
import type { MutasiKartu } from "./report";

const UKURAN_HALAMAN = 1000;

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

function ambilTeks(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function petakanMutasi(value: unknown): MutasiKartu | null {
  if (!isRecord(value)) return null;

  const id = ambilTeks(value.id);
  const tanggal = ambilTeks(value.tanggal);
  const tipe = ambilTeks(value.tipe);
  const qty = ambilTeks(value.qty);
  const nilai = ambilTeks(value.nilai);
  const hargaSatuan = ambilTeks(value.harga_satuan);
  const sumberTipe = ambilTeks(value.sumber_tipe);
  const sumberId = ambilTeks(value.sumber_id);
  const alasan = value.alasan === null ? null : ambilTeks(value.alasan);

  if (
    !id ||
    !tanggal ||
    !tipe ||
    !qty ||
    !nilai ||
    !hargaSatuan ||
    !sumberTipe ||
    !sumberId
  ) {
    return null;
  }

  return {
    id,
    tanggal,
    tipe,
    qty,
    nilai,
    hargaSatuan,
    sumberTipe,
    sumberId,
    alasan,
  };
}

export async function listMutasiKartu(
  supabase: SupabaseClient,
  filter: FilterMutasiKartu,
): Promise<Result<MutasiKartu[]>> {
  const hasil: MutasiKartu[] = [];

  for (let offset = 0; ; offset += UKURAN_HALAMAN) {
    let query = supabase
      .from("mutasi_stok")
      .select(
        "id, tanggal, tipe, qty::text, nilai::text, harga_satuan::text, sumber_tipe, sumber_id, alasan",
      )
      .eq("produk_id", filter.produkId)
      .eq("gudang_id", filter.gudangId)
      .order("tanggal", { ascending: true })
      .order("id", { ascending: true })
      .range(offset, offset + UKURAN_HALAMAN - 1);

    if (filter.mulai) query = query.gte("tanggal", filter.mulai);
    if (filter.selesai) query = query.lt("tanggal", filter.selesai);

    const { data, error } = await query;
    if (error) {
      return fail(`Gagal membaca mutasi stok: ${error.message}`);
    }
    if (!Array.isArray(data)) {
      return fail("Respons mutasi stok tidak valid.");
    }

    for (const item of data) {
      const mutasi = petakanMutasi(item);
      if (!mutasi) return fail("Data mutasi stok tidak lengkap.");
      hasil.push(mutasi);
    }

    if (data.length < UKURAN_HALAMAN) break;
  }

  return ok(hasil);
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
  const hasil: MutasiKartu[] = [];

  for (let offset = 0; ; offset += UKURAN_HALAMAN) {
    let query = supabase
      .from("mutasi_stok")
      .select(
        "id, tanggal, tipe, qty::text, nilai::text, harga_satuan::text, sumber_tipe, sumber_id, alasan",
      )
      .order("tanggal", { ascending: true })
      .order("id", { ascending: true })
      .range(offset, offset + UKURAN_HALAMAN - 1);

    if (filter.mulai) query = query.gte("tanggal", filter.mulai);
    if (filter.selesai) query = query.lt("tanggal", filter.selesai);

    const { data, error } = await query;
    if (error) {
      return fail(`Gagal membaca mutasi stok: ${error.message}`);
    }
    if (!Array.isArray(data)) {
      return fail("Respons mutasi stok tidak valid.");
    }

    for (const item of data) {
      const mutasi = petakanMutasi(item);
      if (!mutasi) return fail("Data mutasi stok tidak lengkap.");
      hasil.push(mutasi);
    }

    if (data.length < UKURAN_HALAMAN) break;
  }

  return ok(hasil);
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
    if (!isRecord(item)) return fail("Data produk tidak lengkap.");
    const id = ambilTeks(item.id);
    const kode = ambilTeks(item.kode);
    const nama = ambilTeks(item.nama);
    if (!id || !kode || !nama) return fail("Data produk tidak lengkap.");
    hasil.push({ id, kode, nama });
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
    if (!isRecord(item)) return fail("Data gudang tidak lengkap.");
    const id = ambilTeks(item.id);
    const kode = ambilTeks(item.kode);
    const nama = ambilTeks(item.nama);
    if (!id || !kode || !nama) return fail("Data gudang tidak lengkap.");
    hasil.push({ id, kode, nama });
  }

  return ok(hasil);
}
