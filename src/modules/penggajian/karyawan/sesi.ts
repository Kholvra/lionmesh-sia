import { connection } from "next/server";

import { requireSesi } from "@/lib/auth";
import { aksesKaryawan, type AksesKaryawan } from "@/modules/penggajian/karyawan/akses";

export async function aksesSesi(): Promise<AksesKaryawan> {
  // The session read uses the clock, so it must run at request time.
  await connection();
  const { profile } = await requireSesi();
  return aksesKaryawan(profile.peran);
}
