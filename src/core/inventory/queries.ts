import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AlokasiStok,
  GudangRingkas,
  KetersediaanProdukGudang,
  MutasiStok,
  SaldoStok,
} from "./types";
import { fail, ok, type Result } from "@/lib/result";

export async function getSaldoStok(
  supabase: SupabaseClient,
  produkId: string,
  gudangId: string,
): Promise<Result<SaldoStok | null>> {
  const { data, error } = await supabase
    .from("saldo_stok")
    .select("*,qty::text,nilai::text,harga_rata::text")
    .eq("produk_id", produkId)
    .eq("gudang_id", gudangId)
    .maybeSingle();

  if (error) {
    return fail(error.message);
  }

  if (!data) {
    return ok(null);
  }

  return ok({
    produk_id: data.produk_id,
    gudang_id: data.gudang_id,
    qty: data.qty,
    nilai: data.nilai,
    harga_rata: data.harga_rata,
    created_by: data.created_by,
    created_at: data.created_at,
    updated_by: data.updated_by,
    updated_at: data.updated_at,
  });
}

export async function listSaldoStok(
  supabase: SupabaseClient,
  filters?: {
    produkId?: string;
    gudangId?: string;
  },
): Promise<Result<SaldoStok[]>> {
  let query = supabase.from("saldo_stok").select("*,qty::text,nilai::text,harga_rata::text");

  if (filters?.produkId) {
    query = query.eq("produk_id", filters.produkId);
  }
  if (filters?.gudangId) {
    query = query.eq("gudang_id", filters.gudangId);
  }

  const { data, error } = await query;
  if (error) {
    return fail(error.message);
  }

  return ok(
    (data ?? []).map((row) => ({
      produk_id: row.produk_id,
      gudang_id: row.gudang_id,
      qty: row.qty,
      nilai: row.nilai,
      harga_rata: row.harga_rata,
      created_by: row.created_by,
      created_at: row.created_at,
      updated_by: row.updated_by,
      updated_at: row.updated_at,
    })),
  );
}

export async function listMutasiStok(
  supabase: SupabaseClient,
  filters?: {
    produkId?: string;
    gudangId?: string;
    limit?: number;
  },
): Promise<Result<MutasiStok[]>> {
  let query = supabase
    .from("mutasi_stok")
    .select("*,qty::text,nilai::text,harga_satuan::text")
    .order("tanggal", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters?.produkId) {
    query = query.eq("produk_id", filters.produkId);
  }
  if (filters?.gudangId) {
    query = query.eq("gudang_id", filters.gudangId);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) {
    return fail(error.message);
  }

  return ok(
    (data ?? []).map((row) => ({
      id: row.id,
      produk_id: row.produk_id,
      gudang_id: row.gudang_id,
      tanggal: row.tanggal,
      tipe: row.tipe,
      qty: row.qty,
      harga_satuan: row.harga_satuan,
      nilai: row.nilai,
      sumber_tipe: row.sumber_tipe,
      sumber_id: row.sumber_id,
      alasan: row.alasan,
      created_by: row.created_by,
      created_at: row.created_at,
      updated_by: row.updated_by,
      updated_at: row.updated_at,
    })),
  );
}

export async function listGudangAktif(
  supabase: SupabaseClient,
): Promise<Result<GudangRingkas[]>> {
  const { data, error } = await supabase
    .from("gudang")
    .select("id, kode, nama")
    .eq("aktif", true)
    .order("nama", { ascending: true });

  if (error) return fail(error.message);
  return ok(
    (data ?? []).map((g) => ({
      id: String(g.id),
      kode: String(g.kode),
      nama: String(g.nama),
    })),
  );
}

export async function getKetersediaanProdukGudang(
  supabase: SupabaseClient,
  produkId: string,
  gudangId: string,
): Promise<Result<KetersediaanProdukGudang>> {
  const [saldoRes, alokasiRes] = await Promise.all([
    supabase
      .from("saldo_stok")
      .select("qty::text")
      .eq("produk_id", produkId)
      .eq("gudang_id", gudangId)
      .maybeSingle(),
    supabase
      .from("alokasi_stok")
      .select("qty::text")
      .eq("produk_id", produkId)
      .eq("gudang_id", gudangId)
      .eq("status", "teralokasi"),
  ]);

  if (saldoRes.error) return fail(saldoRes.error.message);
  if (alokasiRes.error) return fail(alokasiRes.error.message);

  const saldoQty = saldoRes.data ? Number(saldoRes.data.qty ?? 0) : 0;
  let alokasiAktifQty = 0;
  for (const row of alokasiRes.data ?? []) {
    alokasiAktifQty += Number(row.qty ?? 0);
  }

  const tersediaQty = Math.max(
    0,
    Math.round((saldoQty - alokasiAktifQty + Number.EPSILON) * 10000) / 10000,
  );

  return ok({
    produkId,
    gudangId,
    saldoQty,
    alokasiAktifQty,
    tersediaQty,
  });
}

export async function listAlokasiPesanan(
  supabase: SupabaseClient,
  pesananId: string,
): Promise<Result<AlokasiStok[]>> {
  const { data, error } = await supabase
    .from("alokasi_stok")
    .select("id, pesanan_id, pesanan_item_id, produk_id, gudang_id, qty::text, status, created_by, created_at, updated_by, updated_at")
    .eq("pesanan_id", pesananId)
    .order("created_at", { ascending: true });

  if (error) return fail(error.message);

  return ok(
    (data ?? []).map((row) => ({
      id: String(row.id),
      pesanan_id: String(row.pesanan_id),
      pesanan_item_id: String(row.pesanan_item_id),
      produk_id: String(row.produk_id),
      gudang_id: String(row.gudang_id),
      qty: String(row.qty),
      status: row.status as AlokasiStok["status"],
      created_by: row.created_by ? String(row.created_by) : null,
      created_at: String(row.created_at),
      updated_by: row.updated_by ? String(row.updated_by) : null,
      updated_at: String(row.updated_at),
    })),
  );
}
