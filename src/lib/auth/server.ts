"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { fail, ok, type Result } from "@/lib/result";
import { cekIzin, type AksiDomain } from "./permissions";
import type { Profile } from "./types";

class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Mengambil sesi dan profil pengguna aktif saat ini.
 * Mengembalikan null bila tidak ada sesi, profil tidak ada, atau akun nonaktif.
 */
export async function getSesiUser(): Promise<{
  user: { id: string; email?: string };
  profile: Profile;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, display_name, peran, aktif, karyawan_id, created_at, updated_at, updated_by")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || !profile.aktif) {
    return null;
  }

  return {
    user: { id: user.id, email: user.email },
    profile: profile as Profile,
  };
}

/**
 * Menjaga rute server atau Server Action agar mewajibkan sesi aktif.
 * Mengarahkan ke /login jika tidak ada sesi atau akun tidak aktif.
 */
export async function requireSesi(): Promise<{
  user: { id: string; email?: string };
  profile: Profile;
}> {
  const sessionData = await getSesiUser();
  if (!sessionData) {
    redirect("/login");
  }
  return sessionData;
}

/** Nama tampil sejumlah profil untuk keperluan audit lintas modul. */
export async function listNamaProfil(
  client: SupabaseClient,
  ids: readonly string[],
): Promise<Result<Map<string, string | null>>> {
  const unik = [...new Set(ids.filter((id) => id.length > 0))];
  if (unik.length === 0) return ok(new Map());

  const { data, error } = await client
    .from("profiles")
    .select("id, display_name")
    .in("id", unik);
  if (error) return fail(error.message);

  return ok(
    new Map(
      ((data ?? []) as { id: string; display_name: string | null }[]).map((row) => [
        row.id,
        row.display_name,
      ]),
    ),
  );
}

/**
 * Memvalidasi izin aksi dari matriks izin bersama.
 * Melemparkan AuthError jika belum punya peran atau aksinya tidak diizinkan.
 */
export async function requireIzin(
  aksi: AksiDomain,
): Promise<{
  user: { id: string; email?: string };
  profile: Profile;
}> {
  const sessionData = await requireSesi();
  const { profile } = sessionData;

  if (!profile.peran) {
    throw new AuthError("Akun Anda belum memiliki peran. Hubungi pengelola akun.");
  }

  if (!cekIzin(profile.peran, aksi)) {
    throw new AuthError("Peran Anda tidak berwenang melakukan tindakan ini.");
  }

  return sessionData;
}

/**
 * Memvalidasi otorisasi peran dalam konteks Server Action dengan mengembalikan Result.
 */
export async function assertIzin(
  aksi: AksiDomain,
): Promise<Result<Profile>> {
  const sessionData = await getSesiUser();
  if (!sessionData) {
    return {
      ok: false,
      message: "Sesi Anda sudah berakhir. Silakan masuk lagi.",
    };
  }

  const { profile } = sessionData;
  if (!profile.peran) {
    return {
      ok: false,
      message: "Akun Anda belum memiliki peran. Hubungi pengelola akun.",
    };
  }

  if (!cekIzin(profile.peran, aksi)) {
    return {
      ok: false,
      message: "Peran Anda tidak berwenang melakukan tindakan ini.",
    };
  }

  return {
    ok: true,
    data: profile,
  };
}

const PESAN_GAGAL_MASUK = "Username atau password salah.";
const PESAN_GAGAL_KELUAR = "Gagal keluar. Silakan coba lagi.";

const masukSchema = z.object({
  email: z
    .string({ error: PESAN_GAGAL_MASUK })
    .trim()
    .min(1, PESAN_GAGAL_MASUK)
    .email(PESAN_GAGAL_MASUK),
  password: z
    .string({ error: PESAN_GAGAL_MASUK })
    .min(1, PESAN_GAGAL_MASUK),
});

export async function signInAction(
  email: string,
  password: string,
): Promise<Result<void>> {
  const parsed = masukSchema.safeParse({ email, password });
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? PESAN_GAGAL_MASUK);
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    if (error || !data.user) return fail(PESAN_GAGAL_MASUK);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("aktif")
      .eq("id", data.user.id)
      .single();

    if (profileError || !profile?.aktif) {
      try {
        await supabase.auth.signOut();
      } catch {
        // Cleanup stays best-effort; the inactive profile still cannot sign in.
      }
      return fail(PESAN_GAGAL_MASUK);
    }

    return ok(undefined);
  } catch {
    return fail(PESAN_GAGAL_MASUK);
  }
}

export async function signOutAction(): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();
    if (error) return fail(PESAN_GAGAL_KELUAR);
    return ok(undefined);
  } catch {
    return fail(PESAN_GAGAL_KELUAR);
  }
}
