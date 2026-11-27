import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import type { OtorisasiKoreksi, PeriodeGaji, StatusPeriode } from "@/modules/penggajian/periode/types";
import type { RiwayatStatus } from "@/modules/penggajian/shared/riwayat";

/*
 * Periods come from periode_gaji_status (migration 0017); status lives in core
 * dokumen and its history in riwayat_penggajian. Authorizations are visible to
 * HR and Manajemen only; other roles get an empty list from the database.
 */

type BarisPeriode = {
  id: string;
  dokumen_id: string;
  nama: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  status: StatusPeriode;
};

type BarisRiwayat = { id: string; dokumen_id: string; dari: string | null; ke: string; oleh: string; pada: string; alasan: string | null };

type BarisOtorisasi = {
  id: string;
  periode_gaji_id: string;
  alasan: string;
  created_by_nama: string;
  created_at: string;
  dipakai_at: string | null;
};

export function gagalBaca(error: { message: string } | null): never {
  throw new Error(`Data penggajian gagal dimuat: ${error?.message ?? "tanpa keterangan"}`);
}

export function keRiwayat(row: BarisRiwayat): RiwayatStatus {
  return { id: row.id, dari: row.dari, ke: row.ke, oleh: row.oleh, pada: row.pada, ...(row.alasan ? { alasan: row.alasan } : {}) };
}

/** History rows for the given documents, oldest first, keyed by dokumen_id. */
export async function riwayatDokumen(client: SupabaseClient, dokumenIds: string[]): Promise<Map<string, RiwayatStatus[]>> {
  const peta = new Map<string, RiwayatStatus[]>();
  if (dokumenIds.length === 0) return peta;
  const { data, error } = await client
    .from("riwayat_penggajian")
    .select("id, dokumen_id, dari, ke, oleh, pada, alasan")
    .in("dokumen_id", dokumenIds)
    .order("pada")
    .returns<BarisRiwayat[]>();
  if (error) gagalBaca(error);
  for (const row of data) peta.set(row.dokumen_id, [...(peta.get(row.dokumen_id) ?? []), keRiwayat(row)]);
  return peta;
}

/** All periods, oldest first. */
export async function semuaPeriode(client?: SupabaseClient): Promise<PeriodeGaji[]> {
  const supabase = client ?? (await createClient());
  const [p, o] = await Promise.all([
    supabase
      .from("periode_gaji_status")
      .select("id, dokumen_id, nama, tanggal_mulai, tanggal_selesai, status")
      .order("tanggal_mulai")
      .returns<BarisPeriode[]>(),
    supabase
      .from("otorisasi_koreksi_aman")
      .select("id, periode_gaji_id, alasan, created_by_nama, created_at, dipakai_at")
      .order("created_at")
      .returns<BarisOtorisasi[]>(),
  ]);
  if (p.error || o.error) gagalBaca(p.error ?? o.error);
  const riwayat = await riwayatDokumen(supabase, p.data.map((row) => row.dokumen_id));
  return p.data.map((row) => ({
    id: row.id,
    nama: row.nama,
    mulai: row.tanggal_mulai,
    selesai: row.tanggal_selesai,
    status: row.status,
    riwayat: riwayat.get(row.dokumen_id) ?? [],
    otorisasi: o.data
      .filter((x) => x.periode_gaji_id === row.id)
      .map((x): OtorisasiKoreksi => ({ id: x.id, alasan: x.alasan, oleh: x.created_by_nama, pada: x.created_at, dipakaiPada: x.dipakai_at })),
  }));
}

export async function listPeriodeTerbaru(client?: SupabaseClient): Promise<PeriodeGaji[]> {
  return (await semuaPeriode(client)).reverse();
}

export function periodeUntukTanggal(periode: readonly PeriodeGaji[], tanggal: string): PeriodeGaji | undefined {
  return periode.find((row) => tanggal >= row.mulai && tanggal <= row.selesai);
}
