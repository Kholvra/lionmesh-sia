"use server";

import { revalidatePath } from "next/cache";

import {
  batalkanPembayaranPemasok,
  catatHasilTransferPemasok,
  catatPembayaranPemasok,
  getPengadaanExecutionContext,
  verifikasiPembayaranPemasok,
} from "@/core/pengadaan";
import { cekIzin } from "@/lib/auth/permissions";
import { PATH_BAYAR } from "./constants";
import type { BayarActionState } from "./form-state";
import {
  parseBatalPembayaran,
  parseCatatPembayaran,
  parseHasilTransfer,
  parseVerifikasi,
} from "./schema";

const PESAN_SESI = "Sesi Anda sudah berakhir. Silakan masuk lagi.";
const MAKS_BUKTI_BYTE = 5 * 1024 * 1024;
const TIPE_BUKTI = new Set(["application/pdf", "image/jpeg", "image/png"]);

export async function catatPembayaranAction(
  prevState: BayarActionState,
  formData: FormData,
): Promise<BayarActionState> {
  void prevState;
  const context = await getPengadaanExecutionContext();
  if (!context.ok) return { status: "error", message: PESAN_SESI };
  if (!cekIzin(context.data.peran, "bayar_pemasok")) {
    return { status: "error", message: "Anda tidak berwenang mencatat pembayaran pemasok" };
  }

  const parsed = parseCatatPembayaran(formData);
  if (!parsed.input) {
    return { status: "error", message: parsed.message ?? "Data pembayaran tidak valid." };
  }

  const hasil = await catatPembayaranPemasok(context.data.supabase, {
    pemasokId: parsed.input.pemasokId,
    rekeningBankId: parsed.input.rekeningBankId,
    nominal: parsed.input.nominal,
    tanggal: parsed.input.tanggal,
    actorId: context.data.actorId,
  });
  if (!hasil.ok) return { status: "error", message: hasil.message };

  revalidatePath(PATH_BAYAR);
  return { status: "success", message: "Pembayaran dicatat dan menunggu verifikasi Accounting." };
}

export async function verifikasiPembayaranAction(
  prevState: BayarActionState,
  formData: FormData,
): Promise<BayarActionState> {
  void prevState;
  const context = await getPengadaanExecutionContext();
  if (!context.ok) return { status: "error", message: PESAN_SESI };
  if (!cekIzin(context.data.peran, "verifikasi_pembayaran_pemasok")) {
    return { status: "error", message: "Anda tidak berwenang memverifikasi pembayaran" };
  }

  const parsed = parseVerifikasi(formData);
  if (!parsed.input) {
    return { status: "error", message: parsed.message ?? "Data verifikasi tidak valid." };
  }

  const hasil = await verifikasiPembayaranPemasok(context.data.supabase, {
    dokumenId: parsed.input.dokumenId,
    actorId: context.data.actorId,
  });
  if (!hasil.ok) return { status: "error", message: hasil.message };

  revalidatePath(PATH_BAYAR);
  return { status: "success", message: "Pembayaran diverifikasi." };
}

export async function catatHasilTransferAction(
  prevState: BayarActionState,
  formData: FormData,
): Promise<BayarActionState> {
  void prevState;
  const context = await getPengadaanExecutionContext();
  if (!context.ok) return { status: "error", message: PESAN_SESI };
  if (!cekIzin(context.data.peran, "bayar_pemasok")) {
    return { status: "error", message: "Anda tidak berwenang mencatat hasil transfer" };
  }

  const parsed = parseHasilTransfer(formData);
  if (!parsed.input) {
    return { status: "error", message: parsed.message ?? "Data hasil transfer tidak valid." };
  }

  let buktiPath: string | undefined;
  if (parsed.input.berhasil) {
    const berkas = formData.get("bukti");
    if (!(berkas instanceof File) || berkas.size === 0) {
      return { status: "error", message: "Bukti transfer wajib dilampirkan" };
    }
    if (!TIPE_BUKTI.has(berkas.type)) {
      return { status: "error", message: "Bukti transfer harus PDF, JPG, atau PNG" };
    }
    if (berkas.size > MAKS_BUKTI_BYTE) {
      return { status: "error", message: "Bukti transfer maksimal 5 MB" };
    }

    const ekstensi = berkas.name.split(".").pop()?.toLowerCase() ?? "bin";
    buktiPath = `${parsed.input.dokumenId}/${crypto.randomUUID()}.${ekstensi}`;
    const unggah = await context.data.supabase.storage
      .from("bukti-transfer")
      .upload(buktiPath, await berkas.arrayBuffer(), {
        contentType: berkas.type,
        upsert: false,
      });
    if (unggah.error) {
      return { status: "error", message: "Gagal mengunggah bukti transfer." };
    }
  }

  const hasil = await catatHasilTransferPemasok(context.data.supabase, {
    dokumenId: parsed.input.dokumenId,
    versi: parsed.input.versi,
    berhasil: parsed.input.berhasil,
    buktiPath,
    alasan: parsed.input.alasan ?? undefined,
    actorId: context.data.actorId,
  });
  if (!hasil.ok) return { status: "error", message: hasil.message };

  revalidatePath(PATH_BAYAR);
  return {
    status: "success",
    message: parsed.input.berhasil
      ? "Transfer berhasil dicatat dan jurnal dibuat."
      : "Transfer gagal dicatat. Utang tidak berubah.",
  };
}

export async function batalkanPembayaranAction(
  prevState: BayarActionState,
  formData: FormData,
): Promise<BayarActionState> {
  void prevState;
  const context = await getPengadaanExecutionContext();
  if (!context.ok) return { status: "error", message: PESAN_SESI };
  if (!cekIzin(context.data.peran, "bayar_pemasok")) {
    return { status: "error", message: "Anda tidak berwenang membatalkan pembayaran" };
  }

  const parsed = parseBatalPembayaran(formData);
  if (!parsed.input) {
    return { status: "error", message: parsed.message ?? "Data pembatalan tidak valid." };
  }

  const hasil = await batalkanPembayaranPemasok(context.data.supabase, {
    dokumenId: parsed.input.dokumenId,
    versi: parsed.input.versi,
    alasan: parsed.input.alasan,
    actorId: context.data.actorId,
  });
  if (!hasil.ok) return { status: "error", message: hasil.message };

  revalidatePath(PATH_BAYAR);
  return { status: "success", message: "Pembayaran dibatalkan dan jurnal dibalik." };
}
