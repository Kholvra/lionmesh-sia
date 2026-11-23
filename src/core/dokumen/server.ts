import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

import { getSesiUser } from "@/lib/auth/server";
import type { Peran } from "@/lib/auth/types";
import { fail, ok, type Result } from "@/lib/result";
import { getSupabaseEnv } from "@/lib/supabase/env";

export interface DokumenExecutionContext {
  supabase: SupabaseClient;
  actorId: string;
  peran: Peran | null;
}

/**
 * Creates the trusted server context for document operations. Callers must
 * perform the module-specific authorization check before invoking core actions;
 * actorId is taken only from the current Supabase session.
 */
export async function getDokumenExecutionContext(): Promise<Result<DokumenExecutionContext>> {
  const session = await getSesiUser();
  if (!session) {
    return fail("Sesi Anda sudah berakhir. Silakan masuk lagi.");
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return fail("Layanan dokumen belum tersedia. Hubungi administrator.");
  }

  const { supabaseUrl } = getSupabaseEnv();
  const supabase = createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });

  return ok({
    supabase,
    actorId: session.user.id,
    peran: session.profile.peran,
  });
}
