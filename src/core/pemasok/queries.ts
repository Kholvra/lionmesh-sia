import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  Pemasok,
  PemasokListOptions,
  RiwayatStatusPemasok,
} from "./types";

const KOLOM_PEMASOK = [
  "id",
  "nama",
  "alamat",
  "npwp",
  "kontak_perusahaan",
  "kontak_pic_nama",
  "kontak_pic_telepon",
  "termin_hari",
  "toleransi_persen",
  "toleransi_nominal",
  "aktif",
  "created_at",
  "updated_at",
].join(", ");

export async function listPemasok(
  client: SupabaseClient,
  options: PemasokListOptions = {},
): Promise<{ data: Pemasok[]; error: string | null }> {
  let query = client
    .from("pemasok_aman")
    .select(KOLOM_PEMASOK)
    .order("nama", { ascending: true });

  if (options.aktif !== undefined) {
    query = query.eq("aktif", options.aktif);
  }

  const { data, error } = await query;

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: (data ?? []) as unknown as Pemasok[], error: null };
}

export async function getPemasok(
  client: SupabaseClient,
  id: string,
): Promise<{ data: Pemasok | null; error: string | null }> {
  const { data, error } = await client
    .from("pemasok_aman")
    .select(KOLOM_PEMASOK)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: (data as unknown as Pemasok | null) ?? null, error: null };
}

export async function listRiwayatStatusPemasok(
  client: SupabaseClient,
  pemasokId: string,
): Promise<{ data: RiwayatStatusPemasok[]; error: string | null }> {
  const { data, error } = await client
    .from("pemasok_riwayat")
    .select("id, aksi, status_lama, status_baru, actor_id, actor_nama, created_at")
    .eq("pemasok_id", pemasokId)
    .order("created_at", { ascending: true });

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: (data ?? []) as unknown as RiwayatStatusPemasok[], error: null };
}
