"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createPemasok, setStatusPemasok, updatePemasok } from "@/core/pemasok";
import { cekIzin } from "@/lib/auth/permissions";
import { getSesiUser } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { PATH_PEMASOK } from "./constants";
import type { PemasokActionState } from "./form-state";
import { isValidPemasokId, parsePemasokForm } from "./schema";

const PESAN_IZIN = "Anda tidak punya izin mengubah data pemasok";

async function pastikanPurchasing(): Promise<
  | { ok: true }
  | { ok: false; message: string }
> {
  const sesi = await getSesiUser();
  if (!sesi) {
    return {
      ok: false,
      message: "Sesi Anda sudah berakhir. Silakan masuk lagi.",
    };
  }

  if (!cekIzin(sesi.profile.peran, "buat_ubah_pemasok")) {
    return { ok: false, message: PESAN_IZIN };
  }

  return { ok: true };
}

export async function simpanPemasokAction(
  prevState: PemasokActionState,
  formData: FormData,
): Promise<PemasokActionState> {
  void prevState;

  const izin = await pastikanPurchasing();
  if (!izin.ok) {
    return { status: "error", message: izin.message };
  }

  const parsed = parsePemasokForm(formData);
  if (!parsed.input) {
    return {
      status: "error",
      message: "Periksa kembali data pemasok.",
      fieldErrors: parsed.fieldErrors,
    };
  }

  const supabase = await createClient();
  const id = formData.get("id");

  if (typeof id === "string" && id.length > 0) {
    if (!isValidPemasokId(id)) {
      return { status: "error", message: "Pemasok tidak ditemukan." };
    }

    const hasil = await updatePemasok(supabase, id, parsed.input);
    if (!hasil.ok) {
      return { status: "error", message: hasil.message };
    }

    revalidatePath(PATH_PEMASOK);
    return {
      status: "success",
      message: "Data pemasok berhasil diperbarui.",
    };
  }

  const hasil = await createPemasok(supabase, parsed.input);
  if (!hasil.ok) {
    return { status: "error", message: hasil.message };
  }

  revalidatePath(PATH_PEMASOK);
  redirect(`${PATH_PEMASOK}?pemasok=${hasil.data.id}`);
}

export async function ubahStatusPemasokAction(
  prevState: PemasokActionState,
  formData: FormData,
): Promise<PemasokActionState> {
  void prevState;

  const izin = await pastikanPurchasing();
  if (!izin.ok) {
    return { status: "error", message: izin.message };
  }

  const id = formData.get("id");
  if (!isValidPemasokId(id)) {
    return { status: "error", message: "Pemasok tidak ditemukan." };
  }

  const aktifValue = formData.get("aktif");
  if (aktifValue !== "true" && aktifValue !== "false") {
    return { status: "error", message: "Status pemasok tidak valid." };
  }

  const supabase = await createClient();
  const hasil = await setStatusPemasok(supabase, id, aktifValue === "true");
  if (!hasil.ok) {
    return { status: "error", message: hasil.message };
  }

  revalidatePath(PATH_PEMASOK);
  return {
    status: "success",
    message:
      aktifValue === "true"
        ? "Pemasok berhasil diaktifkan."
        : "Pemasok berhasil dinonaktifkan.",
  };
}
