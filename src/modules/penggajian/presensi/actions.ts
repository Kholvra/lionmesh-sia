"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { assertIzin } from "@/lib/auth";
import type { AksiDomain } from "@/lib/auth";
import type { Result } from "@/lib/result";
import { createClient } from "@/lib/supabase/server";
import { sesiDariProfil } from "@/modules/penggajian/akun/akun";
import type { SesiPenggajian } from "@/modules/penggajian/akun/akun";
import type { AksiState } from "@/modules/penggajian/karyawan/actions";
import { hariIniJakarta } from "@/modules/penggajian/karyawan/format";
import { ringkasError } from "@/modules/penggajian/karyawan/rules";
import type { FieldErrors } from "@/modules/penggajian/karyawan/rules";
import { periodeUntukTanggal, semuaPeriode } from "@/modules/penggajian/periode/queries";
import { cekPeriodeTerbuka } from "@/modules/penggajian/periode/rules";
import { teks } from "@/modules/penggajian/shared/form";
import { jamSekarangJakarta } from "@/modules/penggajian/shared/waktu";
import { aksesPresensi } from "@/modules/penggajian/presensi/akses";
import { cariKaryawanTerlihat, cariPresensi, getLembur, lemburPadaTanggal } from "@/modules/penggajian/presensi/queries";
import { parseDurasi, validateLembur, validatePembatalan, validatePresensi } from "@/modules/penggajian/presensi/rules";

function gagal(errors: FieldErrors): AksiState {
  return { ok: false, message: ringkasError(errors), fieldErrors: errors };
}

/** The database guards every write as well; its message reaches the form. */
function gagalDb(error: { message: string }): AksiState {
  return { ok: false, message: error.message };
}

/** Actor and employee link come from the session, never from the form (B-02). */
async function sesiAksi(aksi: AksiDomain): Promise<Result<SesiPenggajian>> {
  const hasil = await assertIzin(aksi);
  return hasil.ok ? { ok: true, data: sesiDariProfil(hasil.data) } : hasil;
}

function revalidatePresensi() {
  revalidatePath("/penggajian/presensi");
  revalidatePath("/penggajian/lembur");
}

/** A Karyawan records only themself; HR picks the employee (PRE-01). */
async function karyawanTarget(sesi: SesiPenggajian, formData: FormData) {
  const akses = aksesPresensi(sesi);
  if (akses.mandiri) return cariKaryawanTerlihat(sesi, sesi.karyawanId ?? "");
  return akses.bolehCatatAtasNama ? cariKaryawanTerlihat(sesi, teks(formData, "karyawanId")) : undefined;
}

export async function clockIn(): Promise<AksiState> {
  const sesi = await sesiAksi("catat_presensi_mandiri");
  if (!sesi.ok) return sesi;
  const karyawan = sesi.data.karyawanId ? await cariKaryawanTerlihat(sesi.data, sesi.data.karyawanId) : undefined;
  if (!karyawan) return { ok: false, message: "Akun ini belum terhubung ke data karyawan. Hubungi HR." };
  const now = new Date();
  const tanggal = hariIniJakarta(now);
  const jamMasuk = jamSekarangJakarta(now);
  const errors = validatePresensi(
    { karyawan, tanggal, kehadiran: "HADIR", jamMasuk, jamPulang: "" },
    periodeUntukTanggal(await semuaPeriode(), tanggal),
    Boolean(await cariPresensi(karyawan.id, tanggal)),
    false,
  );
  if (Object.keys(errors).length > 0) return gagal(errors);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("catat_presensi", {
    p_karyawan_id: null, p_tanggal: tanggal, p_kehadiran: "HADIR", p_jam_masuk: jamMasuk,
  });
  if (error) return gagalDb(error);
  revalidatePresensi();
  return { ok: true, data: { id: data } };
}

export async function clockOut(): Promise<AksiState> {
  const sesi = await sesiAksi("catat_presensi_mandiri");
  if (!sesi.ok) return sesi;
  const now = new Date();
  const tanggal = hariIniJakarta(now);
  const presensi = sesi.data.karyawanId ? await cariPresensi(sesi.data.karyawanId, tanggal) : undefined;
  if (!presensi || presensi.jamPulang) return { ok: false, message: "Belum ada absen masuk hari ini, atau absen pulang sudah tercatat." };
  const tertutup = cekPeriodeTerbuka(tanggal, periodeUntukTanggal(await semuaPeriode(), tanggal));
  if (tertutup || presensi.status !== "MENUNGGU_VALIDASI_SUPERVISOR") {
    return { ok: false, message: tertutup ?? "Presensi sudah tervalidasi. Untuk koreksi, hubungi HR." };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("isi_jam_pulang", { p_presensi_id: presensi.id, p_jam_pulang: jamSekarangJakarta(now) });
  if (error) return gagalDb(error);
  revalidatePresensi();
  return { ok: true, data: { id: presensi.id } };
}

export async function createPresensi(_state: AksiState, formData: FormData): Promise<AksiState> {
  const sesi = await sesiAksi("catat_presensi_mandiri");
  if (!sesi.ok) return sesi;
  if (!aksesPresensi(sesi.data).bolehCatatAtasNama) return { ok: false, message: "Hanya HR yang mencatat presensi atas nama karyawan." };
  const karyawan = await karyawanTarget(sesi.data, formData);
  const input = {
    karyawan,
    tanggal: teks(formData, "tanggal"),
    kehadiran: teks(formData, "kehadiran"),
    jamMasuk: teks(formData, "jamMasuk"),
    jamPulang: teks(formData, "jamPulang"),
  };
  const periode = periodeUntukTanggal(await semuaPeriode(), input.tanggal);
  const ada = Boolean(karyawan && (await cariPresensi(karyawan.id, input.tanggal)));
  const errors = validatePresensi(input, periode, ada);
  if (Object.keys(errors).length > 0 || !karyawan) return gagal(errors);
  const hadir = input.kehadiran === "HADIR";
  const supabase = await createClient();
  const { error } = await supabase.rpc("catat_presensi", {
    p_karyawan_id: karyawan.id,
    p_tanggal: input.tanggal,
    p_kehadiran: input.kehadiran,
    p_jam_masuk: hadir ? input.jamMasuk : null,
    p_jam_pulang: hadir ? input.jamPulang : null,
    p_keterangan: teks(formData, "keterangan"),
  });
  if (error) return gagalDb(error);
  revalidatePresensi();
  redirect(`/penggajian/presensi?periode=${periode?.id ?? ""}&pesan=dicatat`);
}

export async function createLembur(_state: AksiState, formData: FormData): Promise<AksiState> {
  const sesi = await sesiAksi("ajukan_lembur_mandiri");
  if (!sesi.ok) return sesi;
  const karyawan = await karyawanTarget(sesi.data, formData);
  const input = {
    karyawan,
    tanggal: teks(formData, "tanggal"),
    durasi: teks(formData, "durasi"),
    nomorSpl: teks(formData, "nomorSpl"),
  };
  const hariItu = karyawan ? await lemburPadaTanggal(karyawan.id, input.tanggal) : [];
  const errors = validateLembur(input, periodeUntukTanggal(await semuaPeriode(), input.tanggal), hariItu);
  if (Object.keys(errors).length > 0 || !karyawan) return gagal(errors);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("ajukan_lembur", {
    p_karyawan_id: aksesPresensi(sesi.data).mandiri ? null : karyawan.id,
    p_tanggal: input.tanggal,
    p_menit: parseDurasi(input.durasi),
    p_nomor_spl: input.nomorSpl,
    p_keterangan: teks(formData, "keterangan"),
  });
  if (error) return gagalDb(error);
  revalidatePresensi();
  redirect(`/penggajian/lembur/${data}?pesan=diajukan`);
}

export async function cancelLembur(id: string, _state: AksiState, formData: FormData): Promise<AksiState> {
  const sesi = await sesiAksi("ajukan_lembur_mandiri");
  if (!sesi.ok) return sesi;
  const lembur = await getLembur(sesi.data, id);
  if (!lembur) return { ok: false, message: "Pengajuan lembur tidak ditemukan." };
  const alasan = teks(formData, "alasan");
  const errors = validatePembatalan(lembur, sesi.data.profileId, alasan);
  if (Object.keys(errors).length > 0) return gagal(errors);
  const supabase = await createClient();
  const { error } = await supabase.rpc("batalkan_lembur", { p_lembur_id: id, p_alasan: alasan });
  if (error) return gagalDb(error);
  revalidatePresensi();
  redirect(`/penggajian/lembur/${id}?pesan=dibatalkan`);
}
