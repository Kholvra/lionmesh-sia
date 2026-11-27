"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { assertIzin } from "@/lib/auth";
import type { Profile } from "@/lib/auth";
import type { Result } from "@/lib/result";
import { createClient } from "@/lib/supabase/server";
import { getDaftarAktif, muatKaryawan, nikTerpakai } from "@/modules/penggajian/karyawan/queries";
import {
  parseNominal,
  ringkasError,
  validateDataKaryawan,
  validateGajiPokok,
  validateKaryawanBaru,
  validateNonaktif,
  type FieldErrors,
} from "@/modules/penggajian/karyawan/rules";
import type { DataKaryawanInput } from "@/modules/penggajian/karyawan/types";

export type AksiState =
  | (Result<{ id: string }> & { fieldErrors?: FieldErrors })
  | null;

const BASE_PATH = "/penggajian/karyawan";

function teks(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function bacaDataKaryawan(formData: FormData): DataKaryawanInput {
  return {
    nama: teks(formData, "nama"),
    jabatanId: teks(formData, "jabatanId"),
    departemenId: teks(formData, "departemenId"),
    tipe: teks(formData, "tipe"),
    ptkpKode: teks(formData, "ptkpKode"),
    tanggalMasuk: teks(formData, "tanggalMasuk"),
    rekening: {
      namaBank: teks(formData, "rekeningNamaBank"),
      nomor: teks(formData, "rekeningNomor").replace(/\s/g, ""),
      namaPemilik: teks(formData, "rekeningNamaPemilik"),
    },
  };
}

function gagal(errors: FieldErrors): AksiState {
  return { ok: false, message: ringkasError(errors), fieldErrors: errors };
}

/** The actor comes from the server session, never from the form (B-02). */
async function aktorHr(): Promise<Result<Profile>> {
  return assertIzin("kelola_data_karyawan");
}

/** The database rejects writes outside HR as well (gj001_assert_hr); its message reaches the form. */
function gagalDb(error: { message: string }): AksiState {
  return { ok: false, message: error.message };
}

function dataKeRpc(data: DataKaryawanInput) {
  return {
    p_nama: data.nama,
    p_departemen_id: data.departemenId,
    p_jabatan_id: data.jabatanId,
    p_ptkp_kode: data.ptkpKode,
    p_tipe: data.tipe,
    p_tanggal_masuk: data.tanggalMasuk,
    p_rekening_nama_bank: data.rekening.namaBank,
    p_rekening_nomor: data.rekening.nomor,
    p_rekening_nama_pemilik: data.rekening.namaPemilik,
  };
}

export async function createKaryawan(_prev: AksiState, formData: FormData): Promise<AksiState> {
  const aktor = await aktorHr();
  if (!aktor.ok) return aktor;

  const data = bacaDataKaryawan(formData);
  const input = {
    ...data,
    nik: teks(formData, "nik"),
    gajiPokok: teks(formData, "gajiPokok"),
    tanggalBerlaku: teks(formData, "tanggalBerlaku"),
  };
  const supabase = await createClient();
  const [daftar, terpakai] = await Promise.all([getDaftarAktif(supabase), nikTerpakai(supabase)]);
  const errors = validateKaryawanBaru(input, daftar, terpakai);
  if (Object.keys(errors).length > 0) return gagal(errors);

  const { data: id, error } = await supabase.rpc("create_karyawan", {
    ...dataKeRpc(data),
    p_nik: input.nik,
    p_gaji_pokok: parseNominal(input.gajiPokok),
    p_tanggal_berlaku: input.tanggalBerlaku,
  });
  if (error) return gagalDb(error);
  revalidatePath(BASE_PATH);
  redirect(`${BASE_PATH}/${id}?pesan=dibuat`);
}

export async function updateKaryawan(
  id: string,
  _prev: AksiState,
  formData: FormData,
): Promise<AksiState> {
  const aktor = await aktorHr();
  if (!aktor.ok) return aktor;

  const supabase = await createClient();
  const karyawan = await muatKaryawan(id, supabase);
  if (!karyawan) return { ok: false, message: "Karyawan tidak ditemukan." };

  const data = bacaDataKaryawan(formData);
  const errors = validateDataKaryawan(data, await getDaftarAktif(supabase));
  if (Object.keys(errors).length > 0) return gagal(errors);

  const { error } = await supabase.rpc("update_karyawan", { p_id: id, ...dataKeRpc(data) });
  if (error) return gagalDb(error);
  revalidatePath(BASE_PATH);
  redirect(`${BASE_PATH}/${id}?pesan=diubah`);
}

export async function addGajiPokok(
  id: string,
  _prev: AksiState,
  formData: FormData,
): Promise<AksiState> {
  const aktor = await aktorHr();
  if (!aktor.ok) return aktor;

  const supabase = await createClient();
  const karyawan = await muatKaryawan(id, supabase);
  if (!karyawan) return { ok: false, message: "Karyawan tidak ditemukan." };

  const input = { nominal: teks(formData, "nominal"), tanggalBerlaku: teks(formData, "tanggalBerlaku") };
  const errors = validateGajiPokok(input, karyawan.gajiPokok);
  if (Object.keys(errors).length > 0) return gagal(errors);

  const { error } = await supabase.rpc("tambah_gaji_pokok", {
    p_karyawan_id: id,
    p_nominal: parseNominal(input.nominal),
    p_tanggal_berlaku: input.tanggalBerlaku,
  });
  if (error) return gagalDb(error);
  revalidatePath(BASE_PATH);
  redirect(`${BASE_PATH}/${id}?pesan=gaji`);
}

export async function deactivateKaryawan(
  id: string,
  _prev: AksiState,
  formData: FormData,
): Promise<AksiState> {
  const aktor = await aktorHr();
  if (!aktor.ok) return aktor;

  const supabase = await createClient();
  const karyawan = await muatKaryawan(id, supabase);
  if (!karyawan) return { ok: false, message: "Karyawan tidak ditemukan." };
  if (karyawan.status === "NONAKTIF") {
    return { ok: false, message: "Karyawan ini sudah nonaktif." };
  }

  const tanggalKeluar = teks(formData, "tanggalKeluar");
  const errors = validateNonaktif(tanggalKeluar);
  if (Object.keys(errors).length > 0) return gagal(errors);

  const { error } = await supabase.rpc("nonaktifkan_karyawan", { p_id: id, p_tanggal_keluar: tanggalKeluar });
  if (error) return gagalDb(error);
  revalidatePath(BASE_PATH);
  redirect(`${BASE_PATH}/${id}?pesan=nonaktif`);
}
