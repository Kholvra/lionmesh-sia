import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  EntitasMaster,
  Gudang,
  KategoriProduk,
  KonversiSatuan,
  Kurs,
  MataUang,
  MasterListOptions,
  Produk,
  RiwayatStatusMaster,
  Satuan,
} from "./types";

const KOLOM_SATUAN = "id, kode, nama, aktif, created_at, updated_at";

const KOLOM_PRODUK = [
  "id",
  "kode",
  "nama",
  "tipe",
  "satuan_dasar_id",
  "satuan_dasar_kode",
  "satuan_dasar_nama",
  "kategori_id",
  "kategori_kode",
  "kategori_nama",
  "aktif",
  "created_at",
  "updated_at",
].join(", ");

const KOLOM_KONVERSI = [
  "id",
  "satuan_dari_id",
  "satuan_dari_kode",
  "satuan_ke_id",
  "satuan_ke_kode",
  "faktor",
  "created_at",
  "updated_at",
].join(", ");

const KOLOM_KURS = [
  "id",
  "mata_uang_id",
  "mata_uang_kode",
  "tanggal",
  "nilai",
  "created_at",
  "updated_at",
].join(", ");

export async function listSatuan(
  client: SupabaseClient,
  options: MasterListOptions = {},
): Promise<{ data: Satuan[]; error: string | null }> {
  const query = client.from("satuan").select(KOLOM_SATUAN);
  // Entri nonaktif tetap terbaca untuk dokumen lama; picker dokumen baru
  // meminta `{ aktif: true }` (AC-04).
  const filtered =
    options.aktif === undefined ? query : query.eq("aktif", options.aktif);
  const { data, error } = await filtered.order("kode", { ascending: true });

  if (error) return { data: [], error: error.message };

  return { data: (data ?? []) as unknown as Satuan[], error: null };
}

export async function listGudang(
  client: SupabaseClient,
  options: MasterListOptions = {},
): Promise<{ data: Gudang[]; error: string | null }> {
  const query = client.from("gudang").select(KOLOM_SATUAN);
  const filtered =
    options.aktif === undefined ? query : query.eq("aktif", options.aktif);
  const { data, error } = await filtered.order("kode", { ascending: true });

  if (error) return { data: [], error: error.message };

  return { data: (data ?? []) as unknown as Gudang[], error: null };
}

export async function listKategoriProduk(
  client: SupabaseClient,
  options: MasterListOptions = {},
): Promise<{ data: KategoriProduk[]; error: string | null }> {
  const query = client.from("kategori_produk").select(KOLOM_SATUAN);
  const filtered =
    options.aktif === undefined ? query : query.eq("aktif", options.aktif);
  const { data, error } = await filtered.order("kode", { ascending: true });

  if (error) return { data: [], error: error.message };

  return { data: (data ?? []) as unknown as KategoriProduk[], error: null };
}

export async function listMataUang(
  client: SupabaseClient,
  options: MasterListOptions = {},
): Promise<{ data: MataUang[]; error: string | null }> {
  const query = client
    .from("mata_uang")
    .select("id, kode, nama, simbol, aktif, created_at, updated_at");
  const filtered =
    options.aktif === undefined ? query : query.eq("aktif", options.aktif);
  const { data, error } = await filtered.order("kode", { ascending: true });

  if (error) return { data: [], error: error.message };

  return { data: (data ?? []) as unknown as MataUang[], error: null };
}

export async function listProduk(
  client: SupabaseClient,
  options: MasterListOptions = {},
): Promise<{ data: Produk[]; error: string | null }> {
  const query = client.from("produk_master").select(KOLOM_PRODUK);
  const filtered =
    options.aktif === undefined ? query : query.eq("aktif", options.aktif);
  const { data, error } = await filtered.order("kode", { ascending: true });

  if (error) return { data: [], error: error.message };

  return { data: (data ?? []) as unknown as Produk[], error: null };
}

export async function getProduk(
  client: SupabaseClient,
  id: string,
): Promise<{ data: Produk | null; error: string | null }> {
  const { data, error } = await client
    .from("produk_master")
    .select(KOLOM_PRODUK)
    .eq("id", id)
    .maybeSingle();

  if (error) return { data: null, error: error.message };

  return { data: (data as unknown as Produk | null) ?? null, error: null };
}

export async function listKonversiSatuan(
  client: SupabaseClient,
): Promise<{ data: KonversiSatuan[]; error: string | null }> {
  const { data, error } = await client
    .from("konversi_satuan_master")
    .select(KOLOM_KONVERSI)
    .order("satuan_dari_kode", { ascending: true })
    .order("satuan_ke_kode", { ascending: true });

  if (error) return { data: [], error: error.message };

  return { data: (data ?? []) as unknown as KonversiSatuan[], error: null };
}

export async function listKurs(
  client: SupabaseClient,
): Promise<{ data: Kurs[]; error: string | null }> {
  const { data, error } = await client
    .from("kurs_master")
    .select(KOLOM_KURS)
    .order("tanggal", { ascending: false });

  if (error) return { data: [], error: error.message };

  return { data: (data ?? []) as unknown as Kurs[], error: null };
}

export async function listRiwayatMaster(
  client: SupabaseClient,
  entitas: EntitasMaster,
  entitasId: string,
): Promise<{ data: RiwayatStatusMaster[]; error: string | null }> {
  const { data, error } = await client
    .from("master_riwayat")
    .select(
      "id, entitas, entitas_id, aksi, status_lama, status_baru, actor_id, actor_nama, created_at",
    )
    .eq("entitas", entitas)
    .eq("entitas_id", entitasId)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });

  if (error) return { data: [], error: error.message };

  return { data: (data ?? []) as unknown as RiwayatStatusMaster[], error: null };
}
