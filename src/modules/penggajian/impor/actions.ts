"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { assertIzin } from "@/lib/auth";
import { sesiDariProfil } from "@/modules/penggajian/akun/akun";
import type { AksiState } from "@/modules/penggajian/karyawan/actions";
import { cariKaryawan } from "@/modules/penggajian/karyawan/store";
import { parseCsv } from "@/modules/penggajian/impor/parse";
import { profil, semuaHasil, semuaPemetaan, simpanHasil, simpanProfil, tambahPemetaan } from "@/modules/penggajian/impor/store";
import type { BarisDilewati, FormatTanggal, ProfilPemetaan } from "@/modules/penggajian/impor/types";
import { cariPeriode } from "@/modules/penggajian/periode/store";
import { labelStatusPeriode } from "@/modules/penggajian/periode/rules";
import { cariPresensi, simpanPresensi } from "@/modules/penggajian/presensi/store";
import { teks } from "@/modules/penggajian/shared/form";

const BASE = "/penggajian/impor";

/*
 * The matrix has no separate import permission; importing is HR's attendance
 * work (GJ-008 M-03), so it uses the HR-only recap permission.
 */
async function hr() {
  const hasil = await assertIzin("rekap_presensi");
  return hasil.ok ? { ok: true as const, nama: sesiDariProfil(hasil.data).nama, profileId: hasil.data.id } : { ok: false as const, message: "Hanya HR yang mengimpor presensi dan mengelola pemetaan." };
}

export async function saveProfil(_state: AksiState, formData: FormData): Promise<AksiState> {
  const sesi = await hr();
  if (!sesi.ok) return sesi;
  const pemisah = teks(formData, "pemisah") === "tab" ? "\t" : teks(formData, "pemisah");
  const formatTanggal = teks(formData, "formatTanggal");
  const kolom = ["kolomIdMesin", "kolomTanggal", "kolomJamMasuk", "kolomJamPulang"].map((k) => teks(formData, k));
  const errors: Record<string, string> = {};
  if (![",", ";", "\t"].includes(pemisah)) errors.pemisah = "Pilih pemisah.";
  if (formatTanggal !== "YYYY-MM-DD" && formatTanggal !== "DD/MM/YYYY") errors.formatTanggal = "Pilih format tanggal.";
  ["kolomIdMesin", "kolomTanggal", "kolomJamMasuk", "kolomJamPulang"].forEach((k, i) => { if (!kolom[i]) errors[k] = "Nama kolom wajib diisi."; });
  if (Object.keys(errors).length > 0) return { ok: false, message: "Profil belum bisa disimpan. Periksa isian yang ditandai.", fieldErrors: errors };
  simpanProfil({
    pemisah: pemisah as ProfilPemetaan["pemisah"], formatTanggal: formatTanggal as FormatTanggal,
    kolomIdMesin: kolom[0], kolomTanggal: kolom[1], kolomJamMasuk: kolom[2], kolomJamPulang: kolom[3],
    diubahOleh: sesi.nama, diubahPada: new Date().toISOString(),
  });
  revalidatePath(BASE);
  redirect(`${BASE}/pengaturan?pesan=profil`);
}

export async function addPemetaan(_state: AksiState, formData: FormData): Promise<AksiState> {
  const sesi = await hr();
  if (!sesi.ok) return sesi;
  const idMesin = teks(formData, "idMesin");
  const karyawan = cariKaryawan(teks(formData, "karyawanId"));
  const errors: Record<string, string> = {};
  if (!idMesin) errors.idMesin = "ID mesin wajib diisi.";
  else if (semuaPemetaan().some((p) => p.idMesin === idMesin)) errors.idMesin = `ID mesin ${idMesin} sudah dipetakan; satu ID hanya untuk satu NIK.`;
  if (!karyawan || karyawan.status !== "AKTIF") errors.karyawanId = "Pilih karyawan aktif.";
  if (Object.keys(errors).length > 0 || !karyawan) return { ok: false, message: "Pemetaan belum bisa disimpan.", fieldErrors: errors };
  tambahPemetaan({ idMesin, karyawanId: karyawan.id, oleh: sesi.nama, pada: new Date().toISOString() });
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
  const periode = cariPeriode(teks(formData, "periodeId"));
  const berkas = formData.get("berkas");
  if (!periode) return { ok: false, message: "Pilih periode.", fieldErrors: { periodeId: "Pilih periode." } };
  if (periode.status !== "TERBUKA") return { ok: false, message: `Impor ditolak: periode ${periode.nama} berstatus ${labelStatusPeriode(periode.status)} (tertutup).` };
  if (!(berkas instanceof File) || berkas.size === 0) return { ok: false, message: "Berkas kosong: tidak ada baris data presensi.", fieldErrors: { berkas: "Unggah berkas CSV." } };
  const isi = await berkas.text();
  const hash = await sidik(isi);
  const lama = semuaHasil().find((h) => h.hash === hash);
  if (lama) return { ok: false, message: `Berkas ini sudah pernah diimpor (${lama.namaBerkas}). Tidak ada baris yang ditambahkan.` };
  const parsed = parseCsv(isi, profil());
  if (!parsed.ok) return { ok: false, message: parsed.pesan };

  // Classify every row before writing, so the whole file is applied in one step.
  const dilewati: BarisDilewati[] = [];
  const simpan: { karyawanId: string; tanggal: string; jamMasuk: string; jamPulang: string }[] = [];
  for (const row of parsed.baris) {
    const lewat = (jenis: BarisDilewati["jenis"], alasan: string) => dilewati.push({ baris: row.baris, idMesin: row.idMesin, tanggal: row.tanggal, jenis, alasan });
    const peta = semuaPemetaan().find((p) => p.idMesin === row.idMesin);
    const karyawan = peta ? cariKaryawan(peta.karyawanId) : undefined;
    if (!peta || !karyawan) { lewat("TIDAK_TERPETAKAN", `ID mesin ${row.idMesin} belum dipetakan ke NIK`); continue; }
    if (karyawan.status !== "AKTIF") { lewat("NONAKTIF", `NIK ${karyawan.nik} nonaktif`); continue; }
    if (row.tanggal < periode.mulai || row.tanggal > periode.selesai) { lewat("DI_LUAR_PERIODE", `Tanggal di luar periode ${periode.nama}`); continue; }
    if (cariPresensi(karyawan.id, row.tanggal) || simpan.some((s) => s.karyawanId === karyawan.id && s.tanggal === row.tanggal)) {
      lewat("BENTROK", `Presensi NIK ${karyawan.nik} pada tanggal ini sudah ada; yang lama tidak diubah`);
      continue;
    }
    simpan.push({ karyawanId: karyawan.id, tanggal: row.tanggal, jamMasuk: row.jamMasuk, jamPulang: row.jamPulang });
  }
  const pada = new Date().toISOString();
  for (const s of simpan) {
    simpanPresensi({ ...s, kehadiran: "HADIR", sumber: "IMPOR", pencatatProfileId: sesi.profileId, dicatatOleh: `${sesi.nama} (impor ${berkas.name})`, dicatatPada: pada });
  }
  const id = crypto.randomUUID();
  simpanHasil({ id, periodeId: periode.id, namaBerkas: berkas.name, hash, oleh: sesi.nama, pada, tersimpan: simpan.length, dilewati });
  revalidatePath(BASE);
  revalidatePath("/penggajian/presensi");
  redirect(`${BASE}/${id}`);
}
