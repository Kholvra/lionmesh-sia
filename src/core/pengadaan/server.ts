import type { SupabaseClient } from "@supabase/supabase-js";

import type { Peran } from "@/lib/auth/types";
import { ok, type Result } from "@/lib/result";
import { withAdminAction } from "@/lib/with-admin-action";

export interface PengadaanExecutionContext {
  supabase: SupabaseClient;
  actorId: string;
  peran: Peran | null;
}

/**
 * Trusted server context for procurement. The module checks the action role
 * before calling core; actorId comes only from the Supabase session.
 */
export async function getPengadaanExecutionContext(): Promise<Result<PengadaanExecutionContext>> {
  return withAdminAction("pengadaan", ({ session, getAdmin }) => {
    const admin = getAdmin();
    if (!admin.ok) return admin;

    return ok({
      supabase: admin.data,
      actorId: session.user.id,
      peran: session.profile.peran,
    });
  });
}
