import { createClient } from "@/lib/supabase/server";
import type { BarisDilewati, FormatTanggal, HasilImpor, PemetaanId, ProfilPemetaan } from "@/modules/penggajian/impor/types";
import { gagalBaca } from "@/modules/penggajian/periode/queries";

/* HR-only reads from migration 0022. */

export async function profil(): Promise<ProfilPemetaan> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("profil_impor_aman").select("*").single();
  if (error) gagalBaca(error);
  return {
    pemisah: data.pemisah as ProfilPemetaan["pemisah"],
    formatTanggal: data.format_tanggal as FormatTanggal,
    kolomIdMesin: data.kolom_id_mesin,
    kolomTanggal: data.kolom_tanggal,
    kolomJamMasuk: data.kolom_jam_masuk,
    kolomJamPulang: data.kolom_jam_pulang,
    diubahOleh: data.diubah_oleh,
    diubahPada: data.diubah_pada,
  };
}

export async function semuaPemetaan(): Promise<PemetaanId[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("pemetaan_id_mesin_aman").select("*").order("id_mesin");
  if (error) gagalBaca(error);
  return (data ?? []).map((m) => ({ idMesin: m.id_mesin, karyawanId: m.karyawan_id, nama: m.nama, nik: m.nik, oleh: m.oleh, pada: m.created_at }));
}

export async function semuaHasil(): Promise<HasilImpor[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("impor_presensi_aman").select("*").order("created_at");
  if (error) gagalBaca(error);
  return (data ?? []).map((h) => ({
    id: h.id,
    periodeId: h.periode_gaji_id,
    namaBerkas: h.nama_berkas,
    hash: h.sha256,
    oleh: h.oleh,
    pada: h.created_at,
    tersimpan: h.tersimpan,
    dilewati: h.dilewati as BarisDilewati[],
  }));
}
