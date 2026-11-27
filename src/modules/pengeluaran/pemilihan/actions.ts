"use server";

import { revalidatePath } from "next/cache";

import {
  getPengadaanExecutionContext,
  simpanPenawaranHarga,
  tetapkanPemasokDenganAlasan,
} from "@/core/pengadaan";
import { cekIzin } from "@/lib/auth/permissions";
import { PATH_PEMILIHAN } from "./constants";
import type { PemilihanActionState } from "./form-state";
import { parsePenawaran, parsePenetapan } from "./schema";

const PESAN_SESI = "Sesi Anda sudah berakhir. Silakan masuk lagi.";
const PESAN_IZIN = "Anda tidak berwenang memilih pemasok";

export async function simpanHargaAction(
  prevState: PemilihanActionState,
  formData: FormData,
): Promise<PemilihanActionState> {
  void prevState;
  const context = await getPengadaanExecutionContext();
  if (!context.ok) return { status: "error", message: PESAN_SESI };
  if (!cekIzin(context.data.peran, "pilih_pemasok_po")) {
    return { status: "error", message: PESAN_IZIN };
  }

  const parsed = parsePenawaran(formData);
  if (!parsed.input) {
    return { status: "error", message: parsed.message ?? "Data harga pembanding tidak valid." };
  }

  const hasil = await simpanPenawaranHarga(context.data.supabase, {
    permintaanId: parsed.input.permintaanId,
    itemId: parsed.input.itemId,
    pemasokId: parsed.input.pemasokId,
    harga: parsed.input.harga,
    tanggal: parsed.input.tanggal,
    actorId: context.data.actorId,
  });
  if (!hasil.ok) return { status: "error", message: hasil.message };

  revalidatePath(PATH_PEMILIHAN);
  return { status: "success", message: "Harga pembanding tersimpan." };
}

export async function tetapkanPemasokAction(
  prevState: PemilihanActionState,
  formData: FormData,
): Promise<PemilihanActionState> {
  void prevState;
  const context = await getPengadaanExecutionContext();
  if (!context.ok) return { status: "error", message: PESAN_SESI };
  if (!cekIzin(context.data.peran, "pilih_pemasok_po")) {
    return { status: "error", message: PESAN_IZIN };
  }

  const parsed = parsePenetapan(formData);
  if (!parsed.input) {
    return { status: "error", message: parsed.message ?? "Data penetapan tidak valid." };
  }

  const hasil = await tetapkanPemasokDenganAlasan(context.data.supabase, {
    permintaanId: parsed.input.permintaanId,
    versi: parsed.input.versi,
    pemasokId: parsed.input.pemasokId,
    alasan: parsed.input.alasan ?? undefined,
    actorId: context.data.actorId,
  });
  if (!hasil.ok) return { status: "error", message: hasil.message };

  revalidatePath(PATH_PEMILIHAN);
  return { status: "success", message: "Pemasok ditetapkan." };
}
