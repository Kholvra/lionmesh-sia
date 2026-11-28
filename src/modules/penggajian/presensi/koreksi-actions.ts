"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { assertIzin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sesiDariProfil } from "@/modules/penggajian/akun/akun";
import type { AksiState } from "@/modules/penggajian/karyawan/actions";
import { labelStatusPeriode } from "@/modules/penggajian/periode/rules";
import { periodeUntukTanggal, semuaPeriode } from "@/modules/penggajian/periode/queries";
import { cariKaryawanTerlihat } from "@/modules/penggajian/presensi/queries";
import { KEHADIRAN } from "@/modules/penggajian/presensi/types";
import type { Kehadiran } from "@/modules/penggajian/presensi/types";
import { teks } from "@/modules/penggajian/shared/form";
import { menitDariJam } from "@/modules/penggajian/shared/waktu";

/*
 * P-07 / PRE-07: a correction in a closed (Rekap) period needs a Manajemen
 * authorization and a reason. koreksi_presensi reopens the period to Terbuka
 * (D-47 c) and keeps the old values in presensi_koreksi.
 */
export async function correctClosedPresensi(_state: AksiState, formData: FormData): Promise<AksiState> {
  const hasil = await assertIzin("rekap_presensi");
  if (!hasil.ok) return { ok: false, message: "Hanya HR yang mengajukan koreksi periode tertutup." };
  const sesi = sesiDariProfil(hasil.data);
  const karyawan = await cariKaryawanTerlihat(sesi, teks(formData, "karyawanId"));
  const tanggal = teks(formData, "tanggal");
  const kehadiran = teks(formData, "kehadiran");
  const alasan = teks(formData, "alasan");
  const jamMasuk = teks(formData, "jamMasuk");
  const jamPulang = teks(formData, "jamPulang");
  const periode = periodeUntukTanggal(await semuaPeriode(), tanggal);
  const errors: Record<string, string> = {};
  if (!karyawan) errors.karyawanId = "Pilih karyawan.";
  if (!periode) errors.tanggal = "Tanggal tidak masuk periode penggajian mana pun.";
  else if (periode.status !== "REKAP") {
    errors.tanggal = `Periode ${periode.nama} berstatus ${labelStatusPeriode(periode.status)}. Koreksi ini hanya untuk periode Rekap.`;
  }
  if (!KEHADIRAN.includes(kehadiran as Kehadiran)) errors.kehadiran = "Pilih status baru.";
  if (kehadiran === "HADIR" && (menitDariJam(jamMasuk) === null || menitDariJam(jamPulang) === null)) {
    errors.jamMasuk = "Jam masuk dan jam pulang wajib untuk Hadir.";
  }
  const otorisasi = periode?.otorisasi.find((o) => o.id === teks(formData, "otorisasiId") && o.dipakaiPada === null);
  if (!otorisasi) errors.otorisasiId = "Koreksi periode tertutup perlu otorisasi khusus dari Manajemen.";
  if (!alasan) errors.alasan = "Alasan koreksi wajib diisi.";
  if (Object.keys(errors).length > 0 || !karyawan || !periode || !otorisasi) {
    return { ok: false, message: errors.otorisasiId ?? "Koreksi belum bisa disimpan. Periksa isian yang ditandai.", fieldErrors: errors };
  }
  const hadir = kehadiran === "HADIR";
  const supabase = await createClient();
  const { error } = await supabase.rpc("koreksi_presensi", {
    p_otorisasi_id: otorisasi.id,
    p_karyawan_id: karyawan.id,
    p_tanggal: tanggal,
    p_kehadiran: kehadiran,
    p_jam_masuk: hadir ? jamMasuk : null,
    p_jam_pulang: hadir ? jamPulang : null,
    p_alasan: alasan,
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/penggajian/presensi");
  revalidatePath("/penggajian/periode");
  redirect(`/penggajian/presensi?periode=${periode.id}&pesan=dikoreksi`);
}
