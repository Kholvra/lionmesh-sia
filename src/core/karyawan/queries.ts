import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Read model karyawan ringkas untuk keperluan lintas siklus (ARCH-08).
 * Hanya id, nama, dan NIK karyawan aktif yang dibaca; bukan data kepegawaian
 * lain seperti gaji, rekening, atau riwayat.
 */
export interface KaryawanRingkas {
  id: string;
  nama: string;
  nik: string;
}

const KOLOM_KARYAWAN_RINGKAS = "id, nama, nik";

/**
 * Service-role read: caller MUST pass the admin client obtained from
 * `withAdminAction` (see `getProduksiExecutionContext`). Column-level RLS in
 * migration 0016 hides NIK from ordinary sessions, so a user-session client
 * must never be used here. This function never writes.
 */
export async function listKaryawanRingkas(
  client: SupabaseClient,
): Promise<{ data: KaryawanRingkas[]; error: string | null }> {
  const { data, error } = await client
    .from("karyawan")
    .select(KOLOM_KARYAWAN_RINGKAS)
    .eq("status", "AKTIF")
    .order("nama", { ascending: true });

  if (error) return { data: [], error: error.message };

  return { data: (data ?? []) as unknown as KaryawanRingkas[], error: null };
}
