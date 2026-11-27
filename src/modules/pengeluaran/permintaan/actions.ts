"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ajukanDokumen, revisiDokumen, setujuiDokumen, tolakDokumen } from "@/core/dokumen";
import {
  ajukanPR,
  batalkanPR,
  getPengadaanExecutionContext,
  periksaPRDenganNilai,
} from "@/core/pengadaan";
import { cekIzin } from "@/lib/auth/permissions";
import { PATH_PERMINTAAN } from "./constants";
import type { PermintaanActionState } from "./form-state";
import {
  parseEstimasiNilai,
  parseKeputusanApproval,
  parsePenolakan,
  parsePermintaanForm,
  PESAN_WO_WAJIB,
} from "./schema";

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

  const parsed = parsePermintaanForm(formData, {
    requireWo: context.data.peran === "Produksi",
  });
  if (!parsed.input) {
    const message =
      parsed.fieldErrors.wo_id === PESAN_WO_WAJIB
        ? PESAN_WO_WAJIB
        : "Periksa kembali data permintaan.";
    return {
      status: "error",
      message,
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

  const keputusan = parseKeputusanApproval(formData);
  const estimasi = parseEstimasiNilai(formData);
  if (!keputusan.input || !estimasi.nilai) {
    return {
      status: "error",
      message: keputusan.message ?? estimasi.message ?? "Data permintaan tidak valid.",
    };
  }

  const hasil = await periksaPRDenganNilai(context.data.supabase, {
    permintaanId: keputusan.input.dokumenId,
    versi: keputusan.input.versi,
    actorId: context.data.actorId,
    nilai: estimasi.nilai,
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

export async function setujuiPermintaanAction(
  prevState: PermintaanActionState,
  formData: FormData,
): Promise<PermintaanActionState> {
  void prevState;
  const context = await getPengadaanExecutionContext();
  if (!context.ok) return { status: "error", message: PESAN_SESI };
  if (!cekIzin(context.data.peran, "setujui_pr")) {
    return { status: "error", message: "Anda tidak berwenang menyetujui permintaan ini" };
  }

  const keputusan = parseKeputusanApproval(formData);
  if (!keputusan.input) {
    return { status: "error", message: keputusan.message ?? "Data permintaan tidak valid." };
  }

  const hasil = await setujuiDokumen(context.data.supabase, {
    dokumenId: keputusan.input.dokumenId,
    versi: keputusan.input.versi,
    actorId: context.data.actorId,
  });
  if (!hasil.ok) return { status: "error", message: hasil.message };

  revalidatePath(PATH_PERMINTAAN);
  return { status: "success", message: "Persetujuan jenjang tercatat." };
}

export async function tolakPermintaanAction(
  prevState: PermintaanActionState,
  formData: FormData,
): Promise<PermintaanActionState> {
  void prevState;
  const context = await getPengadaanExecutionContext();
  if (!context.ok) return { status: "error", message: PESAN_SESI };
  if (!cekIzin(context.data.peran, "setujui_pr")) {
    return { status: "error", message: "Anda tidak berwenang menolak permintaan ini" };
  }

  const keputusan = parsePenolakan(formData);
  if (!keputusan.input) {
    return { status: "error", message: keputusan.message ?? "Data penolakan tidak valid." };
  }

  const hasil = await tolakDokumen(context.data.supabase, {
    dokumenId: keputusan.input.dokumenId,
    versi: keputusan.input.versi,
    actorId: context.data.actorId,
    alasan: keputusan.input.alasan,
  });
  if (!hasil.ok) return { status: "error", message: hasil.message };

  revalidatePath(PATH_PERMINTAAN);
  return { status: "success", message: "Permintaan ditolak." };
}
