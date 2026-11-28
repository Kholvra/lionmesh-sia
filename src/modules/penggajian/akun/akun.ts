import { connection } from "next/server";

import { requireSesi } from "@/lib/auth";
import type { Peran, Profile } from "@/lib/auth";

/*
 * A Karyawan account points to its employee row through profiles.karyawan_id
 * (D-53, fk_profiles_karyawan in migration 0017).
 */
export type SesiPenggajian = {
  profileId: string;
  peran: Peran | null;
  nama: string;
  karyawanId: string | null;
};

export function sesiDariProfil(profile: Profile): SesiPenggajian {
  return {
    profileId: profile.id,
    peran: profile.peran,
    nama: profile.display_name ?? profile.peran ?? "Pengguna",
    karyawanId: profile.karyawan_id ?? null,
  };
}

/** Reads the session at request time; the actor never comes from the client. */
export async function sesiPenggajian(): Promise<SesiPenggajian> {
  await connection();
  const { profile } = await requireSesi();
  return sesiDariProfil(profile);
}
