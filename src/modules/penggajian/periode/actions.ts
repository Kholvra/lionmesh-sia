"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { assertIzin, getSesiUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { AksiState } from "@/modules/penggajian/karyawan/actions";
import { semuaPeriode } from "@/modules/penggajian/periode/queries";
import { teks } from "@/modules/penggajian/shared/form";

/*
 * P-07: Manajemen gives the special authorization; HR then uses it in the
 * closed-period correction (presensi/koreksi-actions.ts). HR alone is refused,
 * here and in beri_otorisasi_koreksi.
 */
export async function authorizeKoreksi(_state: AksiState, formData: FormData): Promise<AksiState> {
  const sesi = await getSesiUser();
  if (!sesi || sesi.profile.peran !== "Manajemen") {
    return { ok: false, message: "Hanya Manajemen yang memberi otorisasi koreksi periode." };
  }
  const periode = (await semuaPeriode()).find((p) => p.id === teks(formData, "periodeId"));
  const alasan = teks(formData, "alasan");
  if (!periode || periode.status === "TERBUKA") {
    const pesan = "Pilih periode berstatus Rekap atau Tervalidasi.";
    return { ok: false, message: pesan, fieldErrors: { periodeId: pesan } };
  }
  if (!alasan) return { ok: false, message: "Alasan otorisasi wajib diisi.", fieldErrors: { alasan: "Alasan otorisasi wajib diisi." } };
  const supabase = await createClient();
  const { error } = await supabase.rpc("beri_otorisasi_koreksi", { p_periode_gaji_id: periode.id, p_alasan: alasan });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/penggajian/periode");
  redirect("/penggajian/periode?pesan=diotorisasi");
}

/** HR reopens a Tervalidasi period with Manajemen's authorization (P-07, GJ-003 AC-07). */
export async function reopenPeriode(_state: AksiState, formData: FormData): Promise<AksiState> {
  const hasil = await assertIzin("rekap_presensi");
  if (!hasil.ok) return hasil;
  const periode = (await semuaPeriode()).find((p) => p.id === teks(formData, "periodeId"));
  const alasan = teks(formData, "alasan");
  if (!periode || periode.status !== "TERVALIDASI") {
    return { ok: false, message: "Buka ulang hanya untuk periode berstatus Tervalidasi." };
  }
  const dipilih = teks(formData, "otorisasiId");
  const otorisasi = periode.otorisasi.find((row) => row.dipakaiPada === null && (!dipilih || row.id === dipilih));
  if (!otorisasi) {
    const pesan = `Buka ulang ${periode.nama} ditolak: perlu otorisasi khusus dari Manajemen.`;
    return { ok: false, message: pesan, fieldErrors: { otorisasiId: pesan } };
  }
  if (!alasan) return { ok: false, message: "Alasan koreksi wajib diisi.", fieldErrors: { alasan: "Alasan koreksi wajib diisi." } };
  const supabase = await createClient();
  const { error } = await supabase.rpc("buka_ulang_periode", { p_periode_gaji_id: periode.id, p_otorisasi_id: otorisasi.id, p_alasan: alasan });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/penggajian/periode");
  revalidatePath("/penggajian/rekap");
  redirect(`/penggajian/rekap?periode=${periode.id}&pesan=dibuka`);
}
