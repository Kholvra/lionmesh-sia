"use server";

import { revalidatePath } from "next/cache";

import {
  createPelanggan,
  getPelangganExecutionContext,
  updateBatasKredit,
  updatePelanggan,
  updateStatusPelanggan,
} from "@/core/pelanggan";
import { requireIzin } from "@/lib/auth/server";

import { PATH_PELANGGAN } from "./constants";
import type { PelangganActionState } from "./form-state";
import {
  batasKreditSchema,
  isValidPelangganId,
  pelangganFormSchema,
} from "./schema";

export async function createPelangganAction(
  _prevState: PelangganActionState,
  formData: FormData
): Promise<PelangganActionState> {
  try {
    await requireIzin("buat_ubah_pelanggan");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Akses ditolak.";
    return { ok: false, message: msg };
  }

  const raw = {
    nama: formData.get("nama"),
    terminHari: formData.get("terminHari"),
    batasKredit: formData.get("batasKredit"),
    npwp: formData.get("npwp"),
    alamat: formData.get("alamat"),
    telepon: formData.get("telepon"),
    email: formData.get("email"),
  };

  const parsed = pelangganFormSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Data tidak valid.";
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const path = String(issue.path[0] ?? "general");
      if (!fieldErrors[path]) fieldErrors[path] = [];
      fieldErrors[path].push(issue.message);
    }
    return {
      ok: false,
      message: firstError,
      fieldErrors,
    };
  }

  const ctx = await getPelangganExecutionContext();
  if (!ctx.ok) return { ok: false, message: ctx.message };

  const res = await createPelanggan(
    ctx.data.supabase,
    {
      nama: parsed.data.nama,
      terminHari: parsed.data.terminHari,
      batasKredit: parsed.data.batasKredit,
      npwp: parsed.data.npwp,
      alamat: parsed.data.alamat,
      telepon: parsed.data.telepon,
      email: parsed.data.email,
    },
    ctx.data.aktor
  );

  if (!res.ok) {
    return { ok: false, message: res.message };
  }

  revalidatePath(PATH_PELANGGAN);
  return {
    ok: true,
    message: "Pelanggan berhasil disimpan.",
    pelangganId: res.data.id,
  };
}

export async function updatePelangganAction(
  id: string,
  _prevState: PelangganActionState,
  formData: FormData
): Promise<PelangganActionState> {
  try {
    await requireIzin("buat_ubah_pelanggan");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Akses ditolak.";
    return { ok: false, message: msg };
  }

  const raw = {
    nama: formData.get("nama"),
    terminHari: formData.get("terminHari"),
    npwp: formData.get("npwp"),
    alamat: formData.get("alamat"),
    telepon: formData.get("telepon"),
    email: formData.get("email"),
  };

  const parsed = pelangganFormSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Data tidak valid.";
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const path = String(issue.path[0] ?? "general");
      if (!fieldErrors[path]) fieldErrors[path] = [];
      fieldErrors[path].push(issue.message);
    }
    return {
      ok: false,
      message: firstError,
      fieldErrors,
    };
  }

  const ctx = await getPelangganExecutionContext();
  if (!ctx.ok) return { ok: false, message: ctx.message };

  const res = await updatePelanggan(
    ctx.data.supabase,
    {
      id,
      nama: parsed.data.nama,
      terminHari: parsed.data.terminHari,
      npwp: parsed.data.npwp,
      alamat: parsed.data.alamat,
      telepon: parsed.data.telepon,
      email: parsed.data.email,
    },
    ctx.data.aktor
  );

  if (!res.ok) {
    return { ok: false, message: res.message };
  }

  revalidatePath(PATH_PELANGGAN);
  return {
    ok: true,
    message: "Perubahan data pelanggan berhasil disimpan.",
    pelangganId: id,
  };
}

export async function updateBatasKreditAction(
  _prevState: PelangganActionState,
  formData: FormData
): Promise<PelangganActionState> {
  try {
    await requireIzin("ubah_batas_kredit");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Akses ditolak.";
    return { ok: false, message: msg };
  }

  const raw = {
    id: formData.get("id"),
    batasKredit: formData.get("batasKredit"),
  };

  const parsed = batasKreditSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Batas kredit tidak valid.";
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const path = String(issue.path[0] ?? "general");
      if (!fieldErrors[path]) fieldErrors[path] = [];
      fieldErrors[path].push(issue.message);
    }
    return {
      ok: false,
      message: firstError,
      fieldErrors,
    };
  }

  const ctx = await getPelangganExecutionContext();
  if (!ctx.ok) return { ok: false, message: ctx.message };

  const res = await updateBatasKredit(
    ctx.data.supabase,
    {
      id: parsed.data.id,
      batasKredit: parsed.data.batasKredit,
    },
    ctx.data.aktor
  );

  if (!res.ok) {
    return { ok: false, message: res.message };
  }

  revalidatePath(PATH_PELANGGAN);
  return {
    ok: true,
    message: "Batas kredit berhasil diperbarui.",
    pelangganId: parsed.data.id,
  };
}

export async function updateStatusPelangganAction(
  _prevState: PelangganActionState,
  formData: FormData
): Promise<PelangganActionState> {
  try {
    await requireIzin("buat_ubah_pelanggan");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Akses ditolak.";
    return { ok: false, message: msg };
  }

  const rawId = formData.get("id");
  const id = typeof rawId === "string" ? rawId : "";
  if (!isValidPelangganId(id)) {
    return { ok: false, message: "ID pelanggan tidak valid." };
  }

  const rawStatus = formData.get("status");
  const statusBaru = typeof rawStatus === "string" ? rawStatus : "";
  if (statusBaru !== "aktif" && statusBaru !== "nonaktif") {
    return { ok: false, message: "Status pelanggan tidak valid." };
  }

  const ctx = await getPelangganExecutionContext();
  if (!ctx.ok) return { ok: false, message: ctx.message };

  const res = await updateStatusPelanggan(
    ctx.data.supabase,
    { id, status: statusBaru },
    ctx.data.aktor
  );

  if (!res.ok) return { ok: false, message: res.message };

  revalidatePath(PATH_PELANGGAN);
  return {
    ok: true,
    message:
      statusBaru === "aktif"
        ? "Pelanggan berhasil diaktifkan."
        : "Pelanggan berhasil dinonaktifkan.",
    pelangganId: id,
  };
}
