"use server";

import { revalidatePath } from "next/cache";

import {
  batalkanPenerimaan,
  catatPenerimaan,
  getPengadaanExecutionContext,
  tutupExceptionPengadaan,
} from "@/core/pengadaan";
import { cekIzin } from "@/lib/auth/permissions";
import { PATH_PENERIMAAN } from "./constants";
import type { PenerimaanActionState } from "./form-state";
import {
  parsePembatalanPenerimaan,
  parseTerimaPenerimaan,
  parseTutupException,
} from "./schema";

const PESAN_SESI = "Sesi Anda sudah berakhir. Silakan masuk lagi.";

export async function catatPenerimaanAction(
  prevState: PenerimaanActionState,
  formData: FormData,
): Promise<PenerimaanActionState> {
  void prevState;
  const context = await getPengadaanExecutionContext();
  if (!context.ok) return { status: "error", message: PESAN_SESI };
  if (!cekIzin(context.data.peran, "catat_penerimaan")) {
    return { status: "error", message: "Anda tidak berwenang mencatat penerimaan" };
  }

  const parsed = parseTerimaPenerimaan(formData);
  if (!parsed.input) {
    return { status: "error", message: parsed.message ?? "Data penerimaan tidak valid." };
  }

  const hasil = await catatPenerimaan(context.data.supabase, {
    poId: parsed.input.poId,
    versiPO: parsed.input.versiPo,
    gudangId: parsed.input.gudangId,
    jenis: parsed.input.jenis,
    tanggal: parsed.input.tanggal,
    baris: parsed.input.baris.map((row) => ({
      poItemId: row.poItemId,
      qtyDiterima: row.qty,
    })),
    actorId: context.data.actorId,
  });
  if (!hasil.ok) return { status: "error", message: hasil.message };

  revalidatePath(PATH_PENERIMAAN);
  return { status: "success", message: "Penerimaan tercatat." };
}

export async function batalkanPenerimaanAction(
  prevState: PenerimaanActionState,
  formData: FormData,
): Promise<PenerimaanActionState> {
  void prevState;
  const context = await getPengadaanExecutionContext();
  if (!context.ok) return { status: "error", message: PESAN_SESI };
  if (!cekIzin(context.data.peran, "catat_penerimaan")) {
    return { status: "error", message: "Anda tidak berwenang membatalkan penerimaan" };
  }

  const parsed = parsePembatalanPenerimaan(formData);
  if (!parsed.input) {
    return { status: "error", message: parsed.message ?? "Data pembatalan tidak valid." };
  }

  const hasil = await batalkanPenerimaan(context.data.supabase, {
    dokumenId: parsed.input.dokumenId,
    versi: parsed.input.versi,
    alasan: parsed.input.alasan,
    actorId: context.data.actorId,
  });
  if (!hasil.ok) return { status: "error", message: hasil.message };

  revalidatePath(PATH_PENERIMAAN);
  return { status: "success", message: "Penerimaan dibatalkan." };
}

export async function tutupExceptionAction(
  prevState: PenerimaanActionState,
  formData: FormData,
): Promise<PenerimaanActionState> {
  void prevState;
  const context = await getPengadaanExecutionContext();
  if (!context.ok) return { status: "error", message: PESAN_SESI };
  if (!cekIzin(context.data.peran, "tutup_exception_selisih")) {
    return { status: "error", message: "Anda tidak berwenang menutup exception" };
  }

  const parsed = parseTutupException(formData);
  if (!parsed.input) {
    return { status: "error", message: parsed.message ?? "Data penutupan tidak valid." };
  }

  const hasil = await tutupExceptionPengadaan(context.data.supabase, {
    exceptionId: parsed.input.exceptionId,
    alasan: parsed.input.alasan,
    actorId: context.data.actorId,
  });
  if (!hasil.ok) return { status: "error", message: hasil.message };

  revalidatePath(PATH_PENERIMAAN);
  return { status: "success", message: "Exception ditutup." };
}
