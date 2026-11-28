"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { assertIzin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sesiDariProfil } from "@/modules/penggajian/akun/akun";
import type { AksiState } from "@/modules/penggajian/karyawan/actions";
import { periodeUntukTanggal, semuaPeriode } from "@/modules/penggajian/periode/queries";
import { cariKaryawanTerlihat, getLembur, lemburPadaTanggal } from "@/modules/penggajian/presensi/queries";
import { parseDurasi, validateLembur } from "@/modules/penggajian/presensi/rules";
import { teks } from "@/modules/penggajian/shared/form";
import { aksesRekap, getRekap } from "@/modules/penggajian/rekap/queries";
import { validateSimpanRekap, validateValidasi } from "@/modules/penggajian/rekap/rules";

const REKAP = "/penggajian/rekap";

function selesai(periodeId: string, pesan: string): never {
  revalidatePath(REKAP);
  revalidatePath("/penggajian/periode");
  redirect(`${REKAP}?periode=${periodeId}&pesan=${pesan}`);
}

async function cariPeriode(id: string) {
  return (await semuaPeriode()).find((p) => p.id === id);
}

export async function saveRekap(_state: AksiState, formData: FormData): Promise<AksiState> {
  const hasil = await assertIzin("rekap_presensi");
  if (!hasil.ok) return hasil;
  const periode = await cariPeriode(teks(formData, "periodeId"));
  if (!periode) return { ok: false, message: "Periode tidak ditemukan." };
  const masalah = validateSimpanRekap(periode, await getRekap(sesiDariProfil(hasil.data), periode));
  if (masalah) return { ok: false, message: masalah };
  const supabase = await createClient();
  const { error } = await supabase.rpc("rekap_periode", { p_periode_gaji_id: periode.id });
  if (error) return { ok: false, message: error.message };
  selesai(periode.id, "disimpan");
}

export async function validateRekap(_state: AksiState, formData: FormData): Promise<AksiState> {
  const hasil = await assertIzin("validasi_presensi");
  if (!hasil.ok) return { ok: false, message: "Hanya Supervisor Lapangan departemen ini yang berwenang memvalidasi rekapnya." };
  const sesi = sesiDariProfil(hasil.data);
  const periode = await cariPeriode(teks(formData, "periodeId"));
  if (!periode) return { ok: false, message: "Periode tidak ditemukan." };
  const pilihan = teks(formData, "departemenId");
  const akses = await aksesRekap(sesi);
  const departemen = akses.departemenIds.includes(pilihan) ? (await getRekap(sesi, periode)).find((dep) => dep.id === pilihan) : undefined;
  const masalah = validateValidasi(periode, departemen, sesi.profileId);
  if (masalah || !departemen) return { ok: false, message: masalah ?? "Departemen tidak ditemukan." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("validasi_departemen", { p_periode_gaji_id: periode.id, p_departemen_id: departemen.id });
  if (error) return { ok: false, message: error.message };
  selesai(periode.id, "divalidasi");
}

export async function returnRekap(_state: AksiState, formData: FormData): Promise<AksiState> {
  const hasil = await assertIzin("validasi_presensi");
  if (!hasil.ok) return { ok: false, message: "Hanya Supervisor Lapangan yang bisa mengembalikan rekap departemennya." };
  const sesi = sesiDariProfil(hasil.data);
  const periode = await cariPeriode(teks(formData, "periodeId"));
  const alasan = teks(formData, "alasan");
  if (!periode || periode.status !== "REKAP") return { ok: false, message: "Pengembalian hanya untuk periode berstatus Rekap." };
  const pilihan = teks(formData, "departemenId");
  if (!(await aksesRekap(sesi)).departemenIds.includes(pilihan)) {
    return { ok: false, message: "Hanya Supervisor Lapangan departemen ini yang bisa mengembalikan rekapnya." };
  }
  if (!alasan) return { ok: false, message: "Alasan pengembalian wajib diisi.", fieldErrors: { alasan: "Alasan pengembalian wajib diisi." } };
  const supabase = await createClient();
  const { error } = await supabase.rpc("kembalikan_rekap", { p_periode_gaji_id: periode.id, p_departemen_id: pilihan, p_alasan: alasan });
  if (error) return { ok: false, message: error.message };
  selesai(periode.id, "dikembalikan");
}

/** HR fixes an overtime row while the period is open again, with a reason (D-48). */
export async function fixLembur(id: string, _state: AksiState, formData: FormData): Promise<AksiState> {
  const hasil = await assertIzin("rekap_presensi");
  if (!hasil.ok) return hasil;
  const sesi = sesiDariProfil(hasil.data);
  const lembur = await getLembur(sesi, id);
  if (!lembur) return { ok: false, message: "Pengajuan lembur tidak ditemukan." };
  const periode = periodeUntukTanggal(await semuaPeriode(), lembur.tanggal);
  if (periode?.status !== "TERBUKA" || lembur.status !== "MENUNGGU_VALIDASI_SUPERVISOR") {
    return { ok: false, message: "Lembur hanya bisa diperbaiki selama periode Terbuka dan belum tervalidasi." };
  }
  const durasi = teks(formData, "durasi");
  const nomorSpl = teks(formData, "nomorSpl");
  const alasan = teks(formData, "alasan");
  const lainnya = (await lemburPadaTanggal(lembur.karyawanId, lembur.tanggal)).filter((row) => row.id !== id);
  const errors = validateLembur(
    { karyawan: await cariKaryawanTerlihat(sesi, lembur.karyawanId), tanggal: lembur.tanggal, durasi, nomorSpl },
    periode,
    lainnya,
  );
  if (!alasan) errors.alasan = "Alasan perbaikan wajib diisi.";
  if (Object.keys(errors).length > 0) return { ok: false, message: "Data belum bisa disimpan. Periksa isian yang ditandai.", fieldErrors: errors };
  const supabase = await createClient();
  const { error } = await supabase.rpc("perbaiki_lembur", { p_lembur_id: id, p_menit: parseDurasi(durasi), p_nomor_spl: nomorSpl, p_alasan: alasan });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/penggajian/lembur");
  redirect(`/penggajian/lembur/${id}?pesan=diperbaiki`);
}
