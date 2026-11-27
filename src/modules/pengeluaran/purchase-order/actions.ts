"use server";

import { revalidatePath } from "next/cache";

import {
  batalkanPurchaseOrder,
  catatKonfirmasiPo,
  getPengadaanExecutionContext,
  terbitkanPurchaseOrder,
} from "@/core/pengadaan";
import { cekIzin } from "@/lib/auth/permissions";
import { PATH_PO } from "./constants";
import type { PoActionState } from "./form-state";
import { parseKonfirmasiPo, parsePembatalanPo, parseTerbitkanPo } from "./schema";

const PESAN_SESI = "Sesi Anda sudah berakhir. Silakan masuk lagi.";
const PESAN_IZIN = "Anda tidak berwenang menerbitkan atau membatalkan purchase order";

export async function terbitkanPoAction(
  prevState: PoActionState,
  formData: FormData,
): Promise<PoActionState> {
  void prevState;
  const context = await getPengadaanExecutionContext();
  if (!context.ok) return { status: "error", message: PESAN_SESI };
  if (!cekIzin(context.data.peran, "pilih_pemasok_po")) {
    return { status: "error", message: PESAN_IZIN };
  }

  const parsed = parseTerbitkanPo(formData);
  if (!parsed.input) {
    return { status: "error", message: parsed.message ?? "Data purchase order tidak valid." };
  }

  const hasil = await terbitkanPurchaseOrder(context.data.supabase, {
    permintaanId: parsed.input.permintaanId,
    versi: parsed.input.versi,
    tanggal: parsed.input.tanggal,
    baris: parsed.input.baris.map((row) => ({ itemId: row.itemId, qty: row.qty })),
    actorId: context.data.actorId,
  });
  if (!hasil.ok) return { status: "error", message: hasil.message };

  revalidatePath(PATH_PO);
  return { status: "success", message: "Purchase order diterbitkan." };
}

export async function batalkanPoAction(
  prevState: PoActionState,
  formData: FormData,
): Promise<PoActionState> {
  void prevState;
  const context = await getPengadaanExecutionContext();
  if (!context.ok) return { status: "error", message: PESAN_SESI };
  if (!cekIzin(context.data.peran, "pilih_pemasok_po")) {
    return { status: "error", message: PESAN_IZIN };
  }

  const parsed = parsePembatalanPo(formData);
  if (!parsed.input) {
    return { status: "error", message: parsed.message ?? "Data pembatalan tidak valid." };
  }

  const hasil = await batalkanPurchaseOrder(context.data.supabase, {
    dokumenId: parsed.input.dokumenId,
    versi: parsed.input.versi,
    alasan: parsed.input.alasan,
    actorId: context.data.actorId,
  });
  if (!hasil.ok) return { status: "error", message: hasil.message };

  revalidatePath(PATH_PO);
  return { status: "success", message: "PO dan permintaan dibatalkan." };
}

export async function catatKonfirmasiAction(
  prevState: PoActionState,
  formData: FormData,
): Promise<PoActionState> {
  void prevState;
  const context = await getPengadaanExecutionContext();
  if (!context.ok) return { status: "error", message: PESAN_SESI };
  if (!cekIzin(context.data.peran, "pilih_pemasok_po")) {
    return { status: "error", message: PESAN_IZIN };
  }

  const parsed = parseKonfirmasiPo(formData);
  if (!parsed.input) {
    return { status: "error", message: parsed.message ?? "Data konfirmasi tidak valid." };
  }

  const hasil = await catatKonfirmasiPo(context.data.supabase, {
    dokumenId: parsed.input.dokumenId,
    catatan: parsed.input.catatan,
    actorId: context.data.actorId,
  });
  if (!hasil.ok) return { status: "error", message: hasil.message };

  revalidatePath(PATH_PO);
  return { status: "success", message: "Konfirmasi pemasok tersimpan." };
}
