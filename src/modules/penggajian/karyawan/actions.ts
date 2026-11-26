"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { assertIzin } from "@/lib/auth";
import type { Profile } from "@/lib/auth";
import type { Result } from "@/lib/result";
import {
  parseNominal,
  ringkasError,
  validateDataKaryawan,
  validateGajiPokok,
  validateKaryawanBaru,
  validateNonaktif,
  type FieldErrors,
} from "@/modules/penggajian/karyawan/rules";
import {
  cariKaryawan,
  daftarAktif,
  nonaktifkanKaryawan,
  semuaKaryawan,
  simpanKaryawanBaru,
  tambahGajiPokok,
  ubahDataKaryawan,
} from "@/modules/penggajian/karyawan/store";
import type { DataKaryawanInput, TipeKaryawan } from "@/modules/penggajian/karyawan/types";

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

function namaAktor(profile: Profile) {
  return profile.display_name ?? profile.peran ?? "Pengguna";
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
  const nikTerpakai = semuaKaryawan().map((karyawan) => karyawan.nik);
  const errors = validateKaryawanBaru(input, daftarAktif(), nikTerpakai);
  if (Object.keys(errors).length > 0) return gagal(errors);

  const karyawan = simpanKaryawanBaru(
    { ...data, nik: input.nik, tipe: data.tipe as TipeKaryawan },
    { nominal: parseNominal(input.gajiPokok) ?? 0, tanggalBerlaku: input.tanggalBerlaku },
    namaAktor(aktor.data),
    new Date().toISOString(),
  );
  revalidatePath(BASE_PATH);
  redirect(`${BASE_PATH}/${karyawan.id}?pesan=dibuat`);
}

export async function updateKaryawan(
  id: string,
  _prev: AksiState,
  formData: FormData,
): Promise<AksiState> {
  const aktor = await aktorHr();
  if (!aktor.ok) return aktor;

  const karyawan = cariKaryawan(id);
  if (!karyawan) return { ok: false, message: "Karyawan tidak ditemukan." };

  const data = bacaDataKaryawan(formData);
  const errors = validateDataKaryawan(data, daftarAktif());
  if (Object.keys(errors).length > 0) return gagal(errors);

  ubahDataKaryawan(karyawan, { ...data, tipe: data.tipe as TipeKaryawan }, namaAktor(aktor.data), new Date().toISOString());
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

  const karyawan = cariKaryawan(id);
  if (!karyawan) return { ok: false, message: "Karyawan tidak ditemukan." };

  const input = { nominal: teks(formData, "nominal"), tanggalBerlaku: teks(formData, "tanggalBerlaku") };
  const errors = validateGajiPokok(input, karyawan.gajiPokok);
  if (Object.keys(errors).length > 0) return gagal(errors);

  tambahGajiPokok(karyawan, {
    nominal: parseNominal(input.nominal) ?? 0,
    tanggalBerlaku: input.tanggalBerlaku,
    oleh: namaAktor(aktor.data),
    pada: new Date().toISOString(),
  });
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

  const karyawan = cariKaryawan(id);
  if (!karyawan) return { ok: false, message: "Karyawan tidak ditemukan." };
  if (karyawan.status === "NONAKTIF") {
    return { ok: false, message: "Karyawan ini sudah nonaktif." };
  }

  const tanggalKeluar = teks(formData, "tanggalKeluar");
  const errors = validateNonaktif(tanggalKeluar);
  if (Object.keys(errors).length > 0) return gagal(errors);

  nonaktifkanKaryawan(karyawan, tanggalKeluar, namaAktor(aktor.data), new Date().toISOString());
  revalidatePath(BASE_PATH);
  redirect(`${BASE_PATH}/${id}?pesan=nonaktif`);
}
