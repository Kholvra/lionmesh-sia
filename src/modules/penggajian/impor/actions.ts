"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { assertIzin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { AksiState } from "@/modules/penggajian/karyawan/actions";
import { parseCsv } from "@/modules/penggajian/impor/parse";
import { profil } from "@/modules/penggajian/impor/queries";
import { labelStatusPeriode } from "@/modules/penggajian/periode/rules";
import { semuaPeriode } from "@/modules/penggajian/periode/queries";
import { teks } from "@/modules/penggajian/shared/form";

const BASE = "/penggajian/impor";

/*
 * The matrix has no separate import permission; importing is HR's attendance
 * work (GJ-008 M-03), so it uses the HR-only recap permission. The database
 * functions from migration 0022 check HR again.
 */
async function hr() {
  const hasil = await assertIzin("rekap_presensi");
  return hasil.ok ? { ok: true as const } : { ok: false as const, message: "Hanya HR yang mengimpor presensi dan mengelola pemetaan." };
}

export async function saveProfil(_state: AksiState, formData: FormData): Promise<AksiState> {
  const sesi = await hr();
  if (!sesi.ok) return sesi;
  const pemisah = teks(formData, "pemisah") === "tab" ? "\t" : teks(formData, "pemisah");
  const formatTanggal = teks(formData, "formatTanggal");
  const nama = ["kolomIdMesin", "kolomTanggal", "kolomJamMasuk", "kolomJamPulang"];
  const kolom = nama.map((k) => teks(formData, k));
  const errors: Record<string, string> = {};
  if (![",", ";", "\t"].includes(pemisah)) errors.pemisah = "Pilih pemisah.";
  if (formatTanggal !== "YYYY-MM-DD" && formatTanggal !== "DD/MM/YYYY") errors.formatTanggal = "Pilih format tanggal.";
  nama.forEach((k, i) => { if (!kolom[i]) errors[k] = "Nama kolom wajib diisi."; });
  if (Object.keys(errors).length > 0) return { ok: false, message: "Profil belum bisa disimpan. Periksa isian yang ditandai.", fieldErrors: errors };
  const supabase = await createClient();
  const { error } = await supabase.rpc("simpan_profil_impor", {
    p_pemisah: pemisah, p_format_tanggal: formatTanggal,
    p_kolom_id_mesin: kolom[0], p_kolom_tanggal: kolom[1], p_kolom_jam_masuk: kolom[2], p_kolom_jam_pulang: kolom[3],
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath(BASE);
  redirect(`${BASE}/pengaturan?pesan=profil`);
}

export async function addPemetaan(_state: AksiState, formData: FormData): Promise<AksiState> {
  const sesi = await hr();
  if (!sesi.ok) return sesi;
  const idMesin = teks(formData, "idMesin");
  const karyawanId = teks(formData, "karyawanId");
  const errors: Record<string, string> = {};
  if (!idMesin) errors.idMesin = "ID mesin wajib diisi.";
  if (!karyawanId) errors.karyawanId = "Pilih karyawan aktif.";
  if (Object.keys(errors).length > 0) return { ok: false, message: "Pemetaan belum bisa disimpan.", fieldErrors: errors };
  const supabase = await createClient();
  const { error } = await supabase.rpc("tambah_pemetaan_id_mesin", { p_id_mesin: idMesin, p_karyawan_id: karyawanId });
  if (error) {
    const kolom = error.message.startsWith("ID mesin") ? "idMesin" : "karyawanId";
    return { ok: false, message: "Pemetaan belum bisa disimpan.", fieldErrors: { [kolom]: error.message } };
  }
  revalidatePath(BASE);
  redirect(`${BASE}/pengaturan?pesan=pemetaan`);
}

async function sidik(isi: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(isi));
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function importPresensi(_state: AksiState, formData: FormData): Promise<AksiState> {
  const sesi = await hr();
  if (!sesi.ok) return sesi;
  const periode = (await semuaPeriode()).find((p) => p.id === teks(formData, "periodeId"));
  const berkas = formData.get("berkas");
  if (!periode) return { ok: false, message: "Pilih periode.", fieldErrors: { periodeId: "Pilih periode." } };
  if (periode.status !== "TERBUKA") return { ok: false, message: `Impor ditolak: periode ${periode.nama} berstatus ${labelStatusPeriode(periode.status)} (tertutup).` };
  if (!(berkas instanceof File) || berkas.size === 0) return { ok: false, message: "Berkas kosong: tidak ada baris data presensi.", fieldErrors: { berkas: "Unggah berkas CSV." } };
  const isi = await berkas.text();
  // Format and broken rows fail the whole file before anything is written (AC-02, AC-04).
  const parsed = parseCsv(isi, await profil());
  if (!parsed.ok) return { ok: false, message: parsed.pesan };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("impor_presensi_mesin", {
    p_periode_gaji_id: periode.id,
    p_nama_berkas: berkas.name,
    p_sha256: await sidik(isi),
    p_baris: parsed.baris.map((b) => ({ baris: b.baris, id_mesin: b.idMesin, tanggal: b.tanggal, jam_masuk: b.jamMasuk, jam_pulang: b.jamPulang })),
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath(BASE);
  revalidatePath("/penggajian/presensi");
  redirect(`${BASE}/${data}`);
}
