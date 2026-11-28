import { createClient } from "@/lib/supabase/server";
import { gagalBaca } from "@/modules/penggajian/periode/queries";
import type { Slip } from "@/modules/penggajian/slip/types";

/* Slips from slip_gaji_aman (migration 0021); HR only. */
export async function slipKaryawan(periodeId: string, karyawanId: string): Promise<Slip[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("slip_gaji_aman")
    .select("id, periode_gaji_id, karyawan_id, jenis, alasan, menggantikan_id, dibuat_oleh, created_at, cetakan")
    .eq("periode_gaji_id", periodeId)
    .eq("karyawan_id", karyawanId)
    .order("created_at");
  if (error) gagalBaca(error);
  return (data ?? []).map((s) => ({
    id: s.id,
    periodeId: s.periode_gaji_id,
    karyawanId: s.karyawan_id,
    jenis: s.jenis,
    ...(s.alasan ? { alasan: s.alasan } : {}),
    ...(s.menggantikan_id ? { menggantikanId: s.menggantikan_id } : {}),
    dibuatOleh: s.dibuat_oleh,
    dibuatPada: s.created_at,
    cetakan: s.cetakan as Slip["cetakan"],
  }));
}

/** Reference shown on the slip; numbering through core dokumen is not decided for slips yet. */
export function referensiSementara(slip: Slip): string {
  return `SLIP-${slip.id.slice(0, 8).toUpperCase()}`;
}
