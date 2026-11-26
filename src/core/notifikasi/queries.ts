import type { SupabaseClient } from "@supabase/supabase-js";

import type { Notifikasi, PengirimanEmail, StatusPengirimanEmail } from "./types";

const KOLOM_NOTIFIKASI =
  "id,penerima_id,jenis,judul,nomor_dokumen,tautan,kanal_email,dibaca_at,created_at";

const KOLOM_PENGIRIMAN =
  "id,notifikasi_id,alamat,status,percobaan,alasan,jadwal_berikutnya,terkirim_at,created_at";

const BATAS_DEFAULT = 50;

type Row = Record<string, unknown>;

function asString(value: unknown): string {
  return typeof value === "string" ? value : String(value ?? "");
}

function asNullableString(value: unknown): string | null {
  return value === null || value === undefined ? null : asString(value);
}

function asNumber(value: unknown): number {
  return typeof value === "number" ? value : Number(value);
}

export function mapNotifikasi(row: Row): Notifikasi {
  return {
    created_at: asString(row.created_at),
    dibaca_at: asNullableString(row.dibaca_at),
    id: asString(row.id),
    jenis: asString(row.jenis),
    judul: asString(row.judul),
    kanal_email: row.kanal_email === true,
    nomor_dokumen: asNullableString(row.nomor_dokumen),
    penerima_id: asString(row.penerima_id),
    pengiriman_email: null,
    tautan: asNullableString(row.tautan),
  };
}

export function mapPengirimanEmail(row: Row): PengirimanEmail {
  return {
    alamat: asNullableString(row.alamat) ?? "",
    alasan: asNullableString(row.alasan),
    created_at: asString(row.created_at),
    id: asString(row.id),
    jadwal_berikutnya: asNullableString(row.jadwal_berikutnya),
    notifikasi_id: asString(row.notifikasi_id),
    percobaan: asNumber(row.percobaan),
    status: asString(row.status) as StatusPengirimanEmail,
    terkirim_at: asNullableString(row.terkirim_at),
  };
}

export function hitungBelumDibaca(daftar: readonly Notifikasi[]): number {
  return daftar.filter((item) => item.dibaca_at === null).length;
}

/**
 * INV-01: daftar selalu disaring dua kali — RLS di database dan `penerima_id`
 * dari sesi di sini. Modul tidak boleh mengoper id penerima dari klien.
 */
export async function listNotifikasiPenerima(
  client: SupabaseClient,
  penerimaId: string,
  batas: number = BATAS_DEFAULT,
): Promise<{ data: Notifikasi[]; error: string | null }> {
  const { data, error } = await client
    .from("notifikasi")
    .select(KOLOM_NOTIFIKASI)
    .eq("penerima_id", penerimaId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(batas);

  if (error) return { data: [], error: error.message };

  const daftar = ((data ?? []) as unknown as Row[]).map(mapNotifikasi);
  const ids = daftar.map((item) => item.id);
  if (ids.length === 0) return { data: daftar, error: null };

  const pengiriman = await client
    .from("pengiriman_email")
    .select(KOLOM_PENGIRIMAN)
    .in("notifikasi_id", ids);

  if (pengiriman.error) {
    return { data: daftar, error: pengiriman.error.message };
  }

  const peta = new Map<string, PengirimanEmail>();
  for (const row of (pengiriman.data ?? []) as unknown as Row[]) {
    const item = mapPengirimanEmail(row);
    peta.set(item.notifikasi_id, item);
  }

  return {
    data: daftar.map((item) => ({
      ...item,
      pengiriman_email: peta.get(item.id) ?? null,
    })),
    error: null,
  };
}
