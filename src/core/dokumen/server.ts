import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Peran } from "@/lib/auth/types";
import { ok, type Result } from "@/lib/result";
import { withAdminAction } from "@/lib/with-admin-action";

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
  return withAdminAction("dokumen", ({ session, getAdmin }) => {
    const admin = getAdmin();
    if (!admin.ok) return admin;
    return ok({
      supabase: admin.data,
      actorId: session.user.id,
      peran: session.profile.peran,
    });
  });
}
