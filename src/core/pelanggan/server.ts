import type { SupabaseClient } from "@supabase/supabase-js";

import { getSesiUser } from "@/lib/auth/server";
import { fail, ok, type Result } from "@/lib/result";
import { createAdminClient } from "@/lib/supabase/admin";

import { PESAN_LAYANAN, PESAN_SESI } from "./messages";
import type { PelangganAktor } from "./types";

export interface PelangganExecutionContext {
  supabase: SupabaseClient;
  aktor: PelangganAktor;
}

/**
 * Creates the trusted server context for customer operations. Callers must run
 * the module permission check first; the actor and role come only from the
 * current Supabase session.
 */
export async function getPelangganExecutionContext(): Promise<
  Result<PelangganExecutionContext>
> {
  const sesi = await getSesiUser();
  if (!sesi) return fail(PESAN_SESI);

  const supabase = createAdminClient();
  if (!supabase) return fail(PESAN_LAYANAN);

  return ok({
    supabase,
    aktor: { id: sesi.user.id, peran: sesi.profile.peran },
  });
}
