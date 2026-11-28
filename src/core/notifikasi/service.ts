import type { SupabaseClient } from "@supabase/supabase-js";

import { fail, ok, type Result } from "@/lib/result";
import type { JenisNotifikasi } from "./kejadian";
import { asString } from "./worker";

export { prosesAntreanEmail } from "./worker";
export type { HasilProsesAntrean, OpsiProsesAntrean } from "./worker";

export interface InputKirimNotifikasi {
  jenis: JenisNotifikasi;
  penerimaIds: readonly string[];
  nomorDokumen?: string | null;
  tautan?: string | null;
}

/**
 * B-01/PRE-01: modul menitipkan kejadian ke core. Judul dan kanal email berasal
 * dari public.jenis_notifikasi_sah, bukan dari pemanggil.
 */
export async function kirimNotifikasi(
  client: SupabaseClient,
  input: InputKirimNotifikasi,
): Promise<Result<{ notifikasiIds: string[] }>> {
  const penerimaIds = [...new Set(input.penerimaIds)];

  if (penerimaIds.length === 0) {
    return fail("Penerima notifikasi wajib diisi.");
  }

  const { data, error } = await client.rpc("buat_notifikasi", {
    p_jenis: input.jenis,
    p_nomor_dokumen: input.nomorDokumen ?? null,
    p_penerima_ids: penerimaIds,
    p_tautan: input.tautan ?? null,
  });

  if (error) return fail(error.message);

  const ids =
    typeof data === "object" && data !== null && Array.isArray(
      (data as { notifikasi_ids?: unknown }).notifikasi_ids,
    )
      ? ((data as { notifikasi_ids: unknown[] }).notifikasi_ids).map(asString)
      : null;

  if (!ids) return fail("Respons layanan notifikasi tidak valid.");

  return ok({ notifikasiIds: ids });
}

/** AC-07/B-02: hanya penerima yang sah yang bisa menandai baca. */
export async function tandaiNotifikasiDibaca(
  client: SupabaseClient,
  notifikasiId: string,
): Promise<Result<string>> {
  if (!notifikasiId.trim()) return fail("Notifikasi tidak ditemukan.");

  const { data, error } = await client.rpc("tandai_notifikasi_dibaca", {
    p_notifikasi_id: notifikasiId,
  });

  if (error) return fail(error.message);
  if (typeof data !== "string") {
    return fail("Respons layanan notifikasi tidak valid.");
  }

  return ok(data);
}
