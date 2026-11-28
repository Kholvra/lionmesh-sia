"use server";

import { revalidatePath } from "next/cache";

import {
  batalkanInvoicePemasok,
  catatInvoicePemasok,
  cocokkanUlangInvoice,
  getPengadaanExecutionContext,
  sahkanInvoicePemasok,
} from "@/core/pengadaan";
import { cekIzin } from "@/lib/auth/permissions";
import { PATH_INVOICE } from "./constants";
import type { InvoiceActionState } from "./form-state";
import {
  parseBatalInvoice,
  parseCatatInvoice,
  parseKoreksiInvoice,
  parseSahkanInvoice,
} from "./schema";

const PESAN_SESI = "Sesi Anda sudah berakhir. Silakan masuk lagi.";
const PESAN_IZIN = "Anda tidak berwenang mencatat atau mengesahkan invoice";

export async function catatInvoiceAction(
  prevState: InvoiceActionState,
  formData: FormData,
): Promise<InvoiceActionState> {
  void prevState;
  const context = await getPengadaanExecutionContext();
  if (!context.ok) return { status: "error", message: PESAN_SESI };
  if (!cekIzin(context.data.peran, "catat_invoice_utang")) {
    return { status: "error", message: PESAN_IZIN };
  }

  const parsed = parseCatatInvoice(formData);
  if (!parsed.input) {
    return { status: "error", message: parsed.message ?? "Data invoice tidak valid." };
  }

  const hasil = await catatInvoicePemasok(context.data.supabase, {
    penerimaanId: parsed.input.penerimaanId,
    nomorInvoice: parsed.input.nomorInvoice,
    tanggal: parsed.input.tanggal,
    terminHari: parsed.input.terminHari,
    nomorFakturPajak: parsed.input.nomorFakturPajak ?? undefined,
    ppnNilai: parsed.input.ppnNilai,
    baris: parsed.input.baris,
    actorId: context.data.actorId,
  });
  if (!hasil.ok) return { status: "error", message: hasil.message };

  revalidatePath(PATH_INVOICE);
  return {
    status: "success",
    message:
      hasil.data.statusInvoice === "COCOK"
        ? "Invoice tercatat dan cocok."
        : "Invoice tercatat dengan selisih. Periksa catatan selisih.",
  };
}

export async function koreksiInvoiceAction(
  prevState: InvoiceActionState,
  formData: FormData,
): Promise<InvoiceActionState> {
  void prevState;
  const context = await getPengadaanExecutionContext();
  if (!context.ok) return { status: "error", message: PESAN_SESI };
  if (!cekIzin(context.data.peran, "catat_invoice_utang")) {
    return { status: "error", message: PESAN_IZIN };
  }

  const parsed = parseKoreksiInvoice(formData);
  if (!parsed.input) {
    return { status: "error", message: parsed.message ?? "Data koreksi tidak valid." };
  }

  const hasil = await cocokkanUlangInvoice(context.data.supabase, {
    dokumenId: parsed.input.dokumenId,
    versi: parsed.input.versi,
    ppnNilai: parsed.input.ppnNilai,
    baris: parsed.input.baris,
    actorId: context.data.actorId,
  });
  if (!hasil.ok) return { status: "error", message: hasil.message };

  revalidatePath(PATH_INVOICE);
  return {
    status: "success",
    message:
      hasil.data.statusInvoice === "COCOK"
        ? "Invoice dikoreksi dan sekarang cocok."
        : "Invoice masih selisih. Periksa catatan selisih.",
  };
}

export async function sahkanInvoiceAction(
  prevState: InvoiceActionState,
  formData: FormData,
): Promise<InvoiceActionState> {
  void prevState;
  const context = await getPengadaanExecutionContext();
  if (!context.ok) return { status: "error", message: PESAN_SESI };
  if (!cekIzin(context.data.peran, "sahkan_pencocokan")) {
    return { status: "error", message: "Anda tidak berwenang mengesahkan invoice" };
  }

  const parsed = parseSahkanInvoice(formData);
  if (!parsed.input) {
    return { status: "error", message: parsed.message ?? "Data pengesahan tidak valid." };
  }

  const hasil = await sahkanInvoicePemasok(context.data.supabase, {
    dokumenId: parsed.input.dokumenId,
    versi: parsed.input.versi,
    actorId: context.data.actorId,
  });
  if (!hasil.ok) return { status: "error", message: hasil.message };

  revalidatePath(PATH_INVOICE);
  return { status: "success", message: "Utang diakui dan jurnal dibuat." };
}

export async function batalkanInvoiceAction(
  prevState: InvoiceActionState,
  formData: FormData,
): Promise<InvoiceActionState> {
  void prevState;
  const context = await getPengadaanExecutionContext();
  if (!context.ok) return { status: "error", message: PESAN_SESI };
  if (!cekIzin(context.data.peran, "catat_invoice_utang")) {
    return { status: "error", message: PESAN_IZIN };
  }

  const parsed = parseBatalInvoice(formData);
  if (!parsed.input) {
    return { status: "error", message: parsed.message ?? "Data pembatalan tidak valid." };
  }

  const hasil = await batalkanInvoicePemasok(context.data.supabase, {
    dokumenId: parsed.input.dokumenId,
    versi: parsed.input.versi,
    alasan: parsed.input.alasan,
    actorId: context.data.actorId,
  });
  if (!hasil.ok) return { status: "error", message: hasil.message };

  revalidatePath(PATH_INVOICE);
  return { status: "success", message: "Invoice dibatalkan." };
}
