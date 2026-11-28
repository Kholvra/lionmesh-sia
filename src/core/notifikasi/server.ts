import {
  createClient as createSupabaseClient,
  type SupabaseClient,
} from "@supabase/supabase-js";

import { fail, ok, type Result } from "@/lib/result";
import { getSupabaseEnv } from "@/lib/supabase/env";

export interface NotifikasiQueueContext {
  supabase: SupabaseClient;
}

/**
 * Konteks server untuk memproses antrean email. Kunci service role tidak pernah
 * dipakai di komponen klien; pengiriman berjalan di luar transaksi pemicu.
 */
export async function getNotifikasiQueueContext(): Promise<
  Result<NotifikasiQueueContext>
> {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return fail("Layanan notifikasi belum tersedia. Hubungi administrator.");
  }

  const { supabaseUrl } = getSupabaseEnv();
  const supabase = createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });

  return ok({ supabase });
}
