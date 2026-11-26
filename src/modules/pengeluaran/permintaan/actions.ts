"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ajukanDokumen, revisiDokumen } from "@/core/dokumen";
import {
  ajukanPR,
  batalkanPR,
  getPengadaanExecutionContext,
  periksaPR,
} from "@/core/pengadaan";
import { cekIzin } from "@/lib/auth/permissions";
import { PATH_PERMINTAAN } from "./constants";
import type { PermintaanActionState } from "./form-state";
import { parsePermintaanForm } from "./schema";

const PESAN_SESI = "Sesi Anda sudah berakhir. Silakan masuk lagi.";

function pesanIzin(aksi: "ajukan" | "periksa" | "batalkan" | "revisi"): string {
  if (aksi === "periksa") return "Anda tidak punya izin memeriksa permintaan pembelian";
  if (aksi === "batalkan") return "Anda tidak punya izin membatalkan permintaan pembelian";
  if (aksi === "revisi") return "Anda tidak punya izin merevisi permintaan pembelian";
  return "Anda tidak punya izin mengajukan permintaan pembelian";
}

export async function ajukanPermintaanAction(
  prevState: PermintaanActionState,
  formData: FormData,
): Promise<PermintaanActionState> {
  void prevState;
  const context = await getPengadaanExecutionContext();
  if (!context.ok) return { status: "error", message: PESAN_SESI };

  if (!cekIzin(context.data.peran, "ajukan_pr")) {
    return { status: "error", message: pesanIzin("ajukan") };
  }

  const parsed = parsePermintaanForm(formData);
  if (!parsed.input) {
    return {
      status: "error",
      message: "Periksa kembali data permintaan.",
      fieldErrors: parsed.fieldErrors,
    };
  }

  const hasil = await ajukanPR(context.data.supabase, {
    actorId: context.data.actorId,
    gudangId: parsed.input.gudangId,
    tanggalButuh: parsed.input.tanggalButuh,
    keterangan: parsed.input.keterangan,
    woId: parsed.input.woId,
    baris: parsed.input.baris,
  });

  if (!hasil.ok) return { status: "error", message: hasil.message };

  revalidatePath(PATH_PERMINTAAN);
  redirect(`${PATH_PERMINTAAN}?permintaan=${hasil.data.permintaanId}`);
}

export async function periksaPermintaanAction(
  prevState: PermintaanActionState,
  formData: FormData,
): Promise<PermintaanActionState> {
  void prevState;
  const context = await getPengadaanExecutionContext();
  if (!context.ok) return { status: "error", message: PESAN_SESI };
  if (!cekIzin(context.data.peran, "periksa_pr")) {
    return { status: "error", message: pesanIzin("periksa") };
  }

  const permintaanId = String(formData.get("id") ?? "");
  const versi = Number(formData.get("versi"));
  if (!permintaanId || !Number.isInteger(versi)) {
    return { status: "error", message: "Data permintaan tidak valid." };
  }

  const hasil = await periksaPR(context.data.supabase, {
    permintaanId,
    versi,
    actorId: context.data.actorId,
  });
  if (!hasil.ok) return { status: "error", message: hasil.message };

  revalidatePath(PATH_PERMINTAAN);
  return { status: "success", message: "Permintaan diteruskan untuk persetujuan." };
}

export async function kembalikanPermintaanAction(
  prevState: PermintaanActionState,
  formData: FormData,
): Promise<PermintaanActionState> {
  void prevState;
  const context = await getPengadaanExecutionContext();
  if (!context.ok) return { status: "error", message: PESAN_SESI };
  if (!cekIzin(context.data.peran, "periksa_pr")) {
    return { status: "error", message: pesanIzin("periksa") };
  }

  const dokumenId = String(formData.get("id") ?? "");
  const versi = Number(formData.get("versi"));
  const alasan = String(formData.get("alasan") ?? "").trim();
  if (!dokumenId || !Number.isInteger(versi)) {
    return { status: "error", message: "Data permintaan tidak valid." };
  }
  if (alasan.length === 0) {
    return { status: "error", message: "Alasan pengembalian wajib diisi" };
  }

  const hasil = await revisiDokumen(context.data.supabase, {
    dokumenId,
    versi,
    actorId: context.data.actorId,
    alasan,
  });
  if (!hasil.ok) return { status: "error", message: hasil.message };

  revalidatePath(PATH_PERMINTAAN);
  return { status: "success", message: "Permintaan dikembalikan untuk diperbaiki." };
}

export async function ajukanUlangPermintaanAction(
  prevState: PermintaanActionState,
  formData: FormData,
): Promise<PermintaanActionState> {
  void prevState;
  const context = await getPengadaanExecutionContext();
  if (!context.ok) return { status: "error", message: PESAN_SESI };
  if (!cekIzin(context.data.peran, "ajukan_pr")) {
    return { status: "error", message: pesanIzin("ajukan") };
  }

  const dokumenId = String(formData.get("id") ?? "");
  const versi = Number(formData.get("versi"));
  if (!dokumenId || !Number.isInteger(versi)) {
    return { status: "error", message: "Data permintaan tidak valid." };
  }

  const hasil = await ajukanDokumen(context.data.supabase, {
    dokumenId,
    versi,
    actorId: context.data.actorId,
  });
  if (!hasil.ok) return { status: "error", message: hasil.message };

  revalidatePath(PATH_PERMINTAAN);
  return { status: "success", message: "Permintaan diajukan ulang." };
}

export async function batalkanPermintaanAction(
  prevState: PermintaanActionState,
  formData: FormData,
): Promise<PermintaanActionState> {
  void prevState;
  const context = await getPengadaanExecutionContext();
  if (!context.ok) return { status: "error", message: PESAN_SESI };
  if (!cekIzin(context.data.peran, "ajukan_pr")) {
    return { status: "error", message: pesanIzin("batalkan") };
  }

  const permintaanId = String(formData.get("id") ?? "");
  const versi = Number(formData.get("versi"));
  const alasan = String(formData.get("alasan") ?? "").trim();
  if (!permintaanId || !Number.isInteger(versi)) {
    return { status: "error", message: "Data permintaan tidak valid." };
  }
  if (alasan.length === 0) {
    return { status: "error", message: "Alasan pembatalan wajib diisi" };
  }

  const hasil = await batalkanPR(context.data.supabase, {
    permintaanId,
    versi,
    alasan,
    actorId: context.data.actorId,
  });
  if (!hasil.ok) return { status: "error", message: hasil.message };

  revalidatePath(PATH_PERMINTAAN);
  return { status: "success", message: "Permintaan dibatalkan." };
}
