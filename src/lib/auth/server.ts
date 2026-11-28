import { redirect } from "next/navigation";
import { connection } from "next/server";

import { createClient } from "@/lib/supabase/server";
import type { Result } from "@/lib/result";
import { cekIzin, type AksiDomain } from "./permissions";
import type { Profile } from "./types";

export class AuthError extends Error {
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
  await connection();
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
