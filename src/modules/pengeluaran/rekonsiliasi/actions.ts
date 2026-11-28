"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";

import {
  cocokkanMutasiBank,
  getPengadaanExecutionContext,
  imporMutasiBank,
  lepasPasanganMutasiBank,
  pasangkanMutasiBank,
  simpanProfilPemetaanBank,
  tandaiSelisihMutasiBank,
} from "@/core/pengadaan";
import { cekIzin } from "@/lib/auth/permissions";
import { PATH_REKONSILIASI } from "./constants";
import { parseCsv, petakanBaris } from "./csv";
import type { RekonActionState } from "./form-state";
import { parseImpor, parsePasangan, parseProfil, parseSelisih } from "./schema";

const PESAN_SESI = "Sesi Anda sudah berakhir. Silakan masuk lagi.";
const PESAN_IZIN = "Anda tidak berwenang melakukan rekonsiliasi bank";
const MAKS_BERKAS = 2 * 1024 * 1024;

export async function imporMutasiAction(
  prevState: RekonActionState,
  formData: FormData,
): Promise<RekonActionState> {
  void prevState;
  const context = await getPengadaanExecutionContext();
  if (!context.ok) return { status: "error", message: PESAN_SESI };
  if (!cekIzin(context.data.peran, "rekonsiliasi_bank")) {
    return { status: "error", message: PESAN_IZIN };
  }

  const parsed = parseImpor(formData);
  if (!parsed.input) {
    return { status: "error", message: parsed.message ?? "Data impor tidak valid." };
  }

  const berkas = formData.get("berkas");
  if (!(berkas instanceof File) || berkas.size === 0) {
    return { status: "error", message: "Berkas mutasi wajib dipilih" };
  }
  if (berkas.size > MAKS_BERKAS) {
    return { status: "error", message: "Berkas mutasi maksimal 2 MB" };
  }

  const teks = await berkas.text();
  const rows = parseCsv(teks);
  const hasil = petakanBaris(rows, parsed.input.pemetaan);
  if (hasil.error) {
    return { status: "error", message: hasil.error };
  }
  if (hasil.baris.length === 0) {
    return { status: "error", message: "Berkas tidak memuat baris mutasi" };
  }

  const hash = createHash("sha256").update(teks).digest("hex");
  const simpan = await imporMutasiBank(context.data.supabase, {
    rekeningBankId: parsed.input.rekeningBankId,
    periode: `${parsed.input.periode}-01`,
    hash,
    namaBerkas: berkas.name,
    baris: hasil.baris,
    actorId: context.data.actorId,
  });
  if (!simpan.ok) return { status: "error", message: simpan.message };

  revalidatePath(PATH_REKONSILIASI);
  return {
    status: "success",
    message: `Impor selesai: ${simpan.data.jumlahBaris} baris, ${simpan.data.cocok} cocok, ${simpan.data.belumCocok} belum cocok.`,
  };
}

export async function simpanProfilAction(
  prevState: RekonActionState,
  formData: FormData,
): Promise<RekonActionState> {
  void prevState;
  const context = await getPengadaanExecutionContext();
  if (!context.ok) return { status: "error", message: PESAN_SESI };
  if (!cekIzin(context.data.peran, "rekonsiliasi_bank")) {
    return { status: "error", message: PESAN_IZIN };
  }

  const parsed = parseProfil(formData);
  if (!parsed.input) {
    return { status: "error", message: parsed.message ?? "Data profil tidak valid." };
  }

  const hasil = await simpanProfilPemetaanBank(context.data.supabase, {
    nama: parsed.input.nama,
    rekeningBankId: parsed.input.rekeningBankId || undefined,
    pemetaan: parsed.input.pemetaan,
    actorId: context.data.actorId,
  });
  if (!hasil.ok) return { status: "error", message: hasil.message };

  revalidatePath(PATH_REKONSILIASI);
  return { status: "success", message: "Profil pemetaan tersimpan." };
}

export async function cocokkanMutasiAction(
  prevState: RekonActionState,
  formData: FormData,
): Promise<RekonActionState> {
  void prevState;
  const context = await getPengadaanExecutionContext();
  if (!context.ok) return { status: "error", message: PESAN_SESI };
  if (!cekIzin(context.data.peran, "rekonsiliasi_bank")) {
    return { status: "error", message: PESAN_IZIN };
  }

  const mutasiId = String(formData.get("mutasi_id") ?? "");
  const hasil = await cocokkanMutasiBank(context.data.supabase, {
    mutasiId,
    actorId: context.data.actorId,
  });
  if (!hasil.ok) return { status: "error", message: hasil.message };

  revalidatePath(PATH_REKONSILIASI);
  return {
    status: "success",
    message:
      hasil.data.status === "COCOK"
        ? "Mutasi cocok dengan satu baris jurnal."
        : "Belum ada pasangan tunggal; periksa daftar sisi buku.",
  };
}

export async function pasangkanMutasiAction(
  prevState: RekonActionState,
  formData: FormData,
): Promise<RekonActionState> {
  void prevState;
  const context = await getPengadaanExecutionContext();
  if (!context.ok) return { status: "error", message: PESAN_SESI };
  if (!cekIzin(context.data.peran, "rekonsiliasi_bank")) {
    return { status: "error", message: PESAN_IZIN };
  }

  const parsed = parsePasangan(formData);
  if (!parsed.input) {
    return { status: "error", message: parsed.message ?? "Data pasangan tidak valid." };
  }

  const hasil = await pasangkanMutasiBank(context.data.supabase, {
    mutasiId: parsed.input.mutasiId,
    jurnalDetailId: parsed.input.jurnalDetailId,
    actorId: context.data.actorId,
  });
  if (!hasil.ok) return { status: "error", message: hasil.message };

  revalidatePath(PATH_REKONSILIASI);
  return { status: "success", message: "Pasangan manual tersimpan." };
}

export async function tandaiSelisihAction(
  prevState: RekonActionState,
  formData: FormData,
): Promise<RekonActionState> {
  void prevState;
  const context = await getPengadaanExecutionContext();
  if (!context.ok) return { status: "error", message: PESAN_SESI };
  if (!cekIzin(context.data.peran, "rekonsiliasi_bank")) {
    return { status: "error", message: PESAN_IZIN };
  }

  const parsed = parseSelisih(formData);
  if (!parsed.input) {
    return { status: "error", message: parsed.message ?? "Data selisih tidak valid." };
  }

  const hasil = await tandaiSelisihMutasiBank(context.data.supabase, {
    mutasiId: parsed.input.mutasiId,
    alasan: parsed.input.alasan,
    actorId: context.data.actorId,
  });
  if (!hasil.ok) return { status: "error", message: hasil.message };

  revalidatePath(PATH_REKONSILIASI);
  return { status: "success", message: "Mutasi ditandai selisih." };
}

export async function lepasPasanganAction(
  prevState: RekonActionState,
  formData: FormData,
): Promise<RekonActionState> {
  void prevState;
  const context = await getPengadaanExecutionContext();
  if (!context.ok) return { status: "error", message: PESAN_SESI };
  if (!cekIzin(context.data.peran, "rekonsiliasi_bank")) {
    return { status: "error", message: PESAN_IZIN };
  }

  const mutasiId = String(formData.get("mutasi_id") ?? "");
  const hasil = await lepasPasanganMutasiBank(context.data.supabase, {
    mutasiId,
    actorId: context.data.actorId,
  });
  if (!hasil.ok) return { status: "error", message: hasil.message };

  revalidatePath(PATH_REKONSILIASI);
  return { status: "success", message: "Pasangan dilepas." };
}
