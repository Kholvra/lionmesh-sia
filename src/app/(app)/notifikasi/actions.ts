"use server";

import { revalidatePath } from "next/cache";

import { tandaiNotifikasiDibaca } from "@/core/notifikasi";
import { getSesiUser } from "@/lib/auth/server";
import { fail, ok, type Result } from "@/lib/result";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/validation";

import { PATH_NOTIFIKASI } from "./constants";

/**
 * Identitas penerima selalu dari sesi (B-02); id notifikasi hanya penunjuk baris
 * dan tetap diperiksa ulang oleh fungsi database.
 */
export async function tandaiDibacaAction(
  notifikasiId: string,
): Promise<Result<void>> {
  const sesi = await getSesiUser();
  if (!sesi) {
    return fail("Sesi Anda sudah berakhir. Silakan masuk lagi.");
  }

  if (!isUuid(notifikasiId)) {
    return fail("Notifikasi tidak ditemukan.");
  }

  const supabase = await createClient();
  const hasil = await tandaiNotifikasiDibaca(supabase, notifikasiId);
  if (!hasil.ok) return fail(hasil.message);

  revalidatePath(PATH_NOTIFIKASI);
  return ok(undefined);
}
