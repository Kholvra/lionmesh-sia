"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { assertIzin } from "@/lib/auth";
import { sesiDariProfil } from "@/modules/penggajian/akun/akun";
import type { AksiState } from "@/modules/penggajian/karyawan/actions";
import { cariPeriode, ubahStatusPeriode } from "@/modules/penggajian/periode/store";
import { cariKaryawan } from "@/modules/penggajian/karyawan/store";
import { parseDurasi, validateLembur } from "@/modules/penggajian/presensi/rules";
import { cariLembur, semuaLembur, ubahLembur, validasiEntriPeriode } from "@/modules/penggajian/presensi/store";
import { periodeUntukTanggal } from "@/modules/penggajian/periode/store";
import { catatRiwayat } from "@/modules/penggajian/shared/riwayat";
import { teks } from "@/modules/penggajian/shared/form";
import { rekapPeriode } from "@/modules/penggajian/rekap/queries";
import { validateSimpanRekap, validateValidasi } from "@/modules/penggajian/rekap/rules";

const REKAP = "/penggajian/rekap";

function selesai(periodeId: string, pesan: string): never {
  revalidatePath(REKAP);
  revalidatePath("/penggajian/periode");
  redirect(`${REKAP}?periode=${periodeId}&pesan=${pesan}`);
}

export async function saveRekap(_state: AksiState, formData: FormData): Promise<AksiState> {
  const hasil = await assertIzin("rekap_presensi");
  if (!hasil.ok) return hasil;
  const periode = cariPeriode(teks(formData, "periodeId"));
  if (!periode) return { ok: false, message: "Periode tidak ditemukan." };
  const masalah = validateSimpanRekap(periode, rekapPeriode(periode));
  if (masalah) return { ok: false, message: masalah };
  periode.validasi = [];
  periode.pengembalian = null;
  ubahStatusPeriode(periode, "REKAP", sesiDariProfil(hasil.data).nama, new Date().toISOString(), "Rekap disimpan");
  selesai(periode.id, "disimpan");
}

export async function validateRekap(_state: AksiState, formData: FormData): Promise<AksiState> {
  const hasil = await assertIzin("validasi_presensi");
  if (!hasil.ok) return { ok: false, message: "Hanya Supervisor Lapangan departemen ini yang berwenang memvalidasi rekapnya." };
  const sesi = sesiDariProfil(hasil.data);
  const periode = cariPeriode(teks(formData, "periodeId"));
  if (!periode) return { ok: false, message: "Periode tidak ditemukan." };
  const semua = rekapPeriode(periode);
  const pilihan = teks(formData, "departemenId");
  const departemen = sesi.departemenIds.includes(pilihan) ? semua.find((dep) => dep.id === pilihan) : undefined;
  const masalah = validateValidasi(periode, departemen, sesi.profileId);
  if (masalah || !departemen) return { ok: false, message: masalah ?? "Departemen tidak ditemukan." };
  const pada = new Date().toISOString();
  periode.validasi.push({ departemenId: departemen.id, oleh: sesi.nama, profileId: sesi.profileId, pada });
  catatRiwayat(periode.riwayat, { dari: "REKAP", ke: "REKAP", oleh: sesi.nama, pada, alasan: `Departemen ${departemen.nama} tervalidasi` });
  if (semua.every((dep) => periode.validasi.some((v) => v.departemenId === dep.id))) {
    validasiEntriPeriode(periode.mulai, periode.selesai, sesi.nama, pada);
    ubahStatusPeriode(periode, "TERVALIDASI", sesi.nama, pada, "Semua departemen tervalidasi");
  }
  selesai(periode.id, "divalidasi");
}

export async function returnRekap(_state: AksiState, formData: FormData): Promise<AksiState> {
  const hasil = await assertIzin("validasi_presensi");
  if (!hasil.ok) return { ok: false, message: "Hanya Supervisor Lapangan yang bisa mengembalikan rekap departemennya." };
  const sesi = sesiDariProfil(hasil.data);
  const periode = cariPeriode(teks(formData, "periodeId"));
  const alasan = teks(formData, "alasan");
  if (!periode || periode.status !== "REKAP") return { ok: false, message: "Pengembalian hanya untuk periode berstatus Rekap." };
  const pilihan = teks(formData, "departemenId");
  const departemen = sesi.departemenIds.includes(pilihan) ? rekapPeriode(periode).find((dep) => dep.id === pilihan) : undefined;
  if (!departemen) return { ok: false, message: "Hanya Supervisor Lapangan departemen ini yang bisa mengembalikan rekapnya." };
  if (!alasan) return { ok: false, message: "Alasan pengembalian wajib diisi.", fieldErrors: { alasan: "Alasan pengembalian wajib diisi." } };
  const pada = new Date().toISOString();
  // Returning reopens the whole period and clears every department's validation (GJ-003 edge case).
  periode.validasi = [];
  periode.pengembalian = { departemenId: departemen.id, alasan, oleh: sesi.nama, pada };
  ubahStatusPeriode(periode, "TERBUKA", sesi.nama, pada, `Dikembalikan ${departemen.nama}: ${alasan}`);
  selesai(periode.id, "dikembalikan");
}

/** HR fixes an overtime row while the period is open again, with a reason (D-48). */
export async function fixLembur(id: string, _state: AksiState, formData: FormData): Promise<AksiState> {
  const hasil = await assertIzin("rekap_presensi");
  if (!hasil.ok) return hasil;
  const lembur = cariLembur(id);
  if (!lembur) return { ok: false, message: "Pengajuan lembur tidak ditemukan." };
  const periode = periodeUntukTanggal(lembur.tanggal);
  if (periode?.status !== "TERBUKA" || lembur.status !== "MENUNGGU_VALIDASI_SUPERVISOR") {
    return { ok: false, message: "Lembur hanya bisa diperbaiki selama periode Terbuka dan belum tervalidasi." };
  }
  const durasi = teks(formData, "durasi");
  const menit = parseDurasi(durasi);
  const nomorSpl = teks(formData, "nomorSpl");
  const alasan = teks(formData, "alasan");
  const lainnya = semuaLembur().filter((row) => row.id !== id && row.karyawanId === lembur.karyawanId && row.tanggal === lembur.tanggal);
  const errors = validateLembur(
    { karyawan: cariKaryawan(lembur.karyawanId), tanggal: lembur.tanggal, durasi, nomorSpl },
    periode,
    lainnya,
  );
  if (!alasan) errors.alasan = "Alasan perbaikan wajib diisi.";
  if (Object.keys(errors).length > 0) return { ok: false, message: "Data belum bisa disimpan. Periksa isian yang ditandai.", fieldErrors: errors };
  const nama = sesiDariProfil(hasil.data).nama;
  const pada = new Date().toISOString();
  catatRiwayat(lembur.riwayat, { dari: lembur.status, ke: lembur.status, oleh: nama, pada, alasan: `Diperbaiki HR: ${alasan}` });
  ubahLembur(lembur, { menit: menit ?? lembur.menit, nomorSpl, keterangan: lembur.keterangan });
  revalidatePath("/penggajian/lembur");
  redirect(`/penggajian/lembur/${id}?pesan=diperbaiki`);
}
