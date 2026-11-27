"use server";

import { revalidatePath } from "next/cache";

import {
  ajukanReturPemasok,
  batalkanReturPemasok,
  catatLokasiPemisahan,
  catatQC,
  getPengadaanExecutionContext,
  putuskanReturPemasok,
} from "@/core/pengadaan";
import { cekIzin } from "@/lib/auth/permissions";
import { PATH_QC, PATH_RETUR } from "./constants";
import type { QcActionState } from "./form-state";
import { parseBatalRetur, parseLokasi, parsePutusan, parseQc, parseRetur } from "./schema";

const PESAN_SESI = "Sesi Anda sudah berakhir. Silakan masuk lagi.";

export async function catatQcAction(
  prevState: QcActionState,
  formData: FormData,
): Promise<QcActionState> {
  void prevState;
  const context = await getPengadaanExecutionContext();
  if (!context.ok) return { status: "error", message: PESAN_SESI };
  if (!cekIzin(context.data.peran, "catat_qc_bahan")) {
    return { status: "error", message: "Anda tidak berwenang mencatat hasil QC" };
  }

  const parsed = parseQc(formData);
  if (!parsed.input) {
    return { status: "error", message: parsed.message ?? "Data QC tidak valid." };
  }

  const hasil = await catatQC(context.data.supabase, {
    penerimaanId: parsed.input.penerimaanId,
    versi: parsed.input.versi,
    baris: parsed.input.baris,
    actorId: context.data.actorId,
  });
  if (!hasil.ok) return { status: "error", message: hasil.message };

  revalidatePath(PATH_QC);
  return {
    status: "success",
    message: `QC tercatat. Nilai masuk ${hasil.data.totalNilai}.`,
  };
}

export async function catatLokasiAction(
  prevState: QcActionState,
  formData: FormData,
): Promise<QcActionState> {
  void prevState;
  const context = await getPengadaanExecutionContext();
  if (!context.ok) return { status: "error", message: PESAN_SESI };
  if (!cekIzin(context.data.peran, "catat_pengeluaran_retur")) {
    return {
      status: "error",
      message: "Anda tidak berwenang mencatat pemisahan barang gagal",
    };
  }

  const parsed = parseLokasi(formData);
  if (!parsed.input) {
    return { status: "error", message: parsed.message ?? "Data lokasi tidak valid." };
  }

  const hasil = await catatLokasiPemisahan(context.data.supabase, {
    penerimaanItemId: parsed.input.penerimaanItemId,
    lokasi: parsed.input.lokasi,
    actorId: context.data.actorId,
  });
  if (!hasil.ok) return { status: "error", message: hasil.message };

  revalidatePath(PATH_QC);
  return { status: "success", message: "Lokasi pemisahan tersimpan." };
}

export async function ajukanReturAction(
  prevState: QcActionState,
  formData: FormData,
): Promise<QcActionState> {
  void prevState;
  const context = await getPengadaanExecutionContext();
  if (!context.ok) return { status: "error", message: PESAN_SESI };
  if (!cekIzin(context.data.peran, "ajukan_retur_pemasok")) {
    return { status: "error", message: "Anda tidak berwenang mengajukan retur" };
  }

  const parsed = parseRetur(formData);
  if (!parsed.input) {
    return { status: "error", message: parsed.message ?? "Data retur tidak valid." };
  }

  const hasil = await ajukanReturPemasok(context.data.supabase, {
    penerimaanId: parsed.input.penerimaanId,
    alasan: parsed.input.alasan ?? undefined,
    baris: parsed.input.baris,
    actorId: context.data.actorId,
  });
  if (!hasil.ok) return { status: "error", message: hasil.message };

  revalidatePath(PATH_RETUR);
  return { status: "success", message: "Retur diajukan untuk persetujuan Accounting." };
}

export async function putuskanReturAction(
  prevState: QcActionState,
  formData: FormData,
): Promise<QcActionState> {
  void prevState;
  const context = await getPengadaanExecutionContext();
  if (!context.ok) return { status: "error", message: PESAN_SESI };
  if (!cekIzin(context.data.peran, "setujui_retur_pemasok")) {
    return { status: "error", message: "Anda tidak berwenang memutuskan retur" };
  }

  const parsed = parsePutusan(formData);
  if (!parsed.input) {
    return { status: "error", message: parsed.message ?? "Data keputusan tidak valid." };
  }

  const hasil = await putuskanReturPemasok(context.data.supabase, {
    dokumenId: parsed.input.dokumenId,
    versi: parsed.input.versi,
    setuju: parsed.input.setuju,
    alasan: parsed.input.alasan ?? undefined,
    actorId: context.data.actorId,
  });
  if (!hasil.ok) return { status: "error", message: hasil.message };

  revalidatePath(PATH_RETUR);
  return {
    status: "success",
    message: parsed.input.setuju ? "Retur disetujui." : "Retur ditolak.",
  };
}

export async function batalkanReturAction(
  prevState: QcActionState,
  formData: FormData,
): Promise<QcActionState> {
  void prevState;
  const context = await getPengadaanExecutionContext();
  if (!context.ok) return { status: "error", message: PESAN_SESI };
  if (!cekIzin(context.data.peran, "ajukan_retur_pemasok")) {
    return { status: "error", message: "Anda tidak berwenang membatalkan retur" };
  }

  const parsed = parseBatalRetur(formData);
  if (!parsed.input) {
    return { status: "error", message: parsed.message ?? "Data pembatalan tidak valid." };
  }

  const hasil = await batalkanReturPemasok(context.data.supabase, {
    dokumenId: parsed.input.dokumenId,
    versi: parsed.input.versi,
    alasan: parsed.input.alasan,
    actorId: context.data.actorId,
  });
  if (!hasil.ok) return { status: "error", message: hasil.message };

  revalidatePath(PATH_RETUR);
  return { status: "success", message: "Retur dibatalkan." };
}
