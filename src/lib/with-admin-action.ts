import type { SupabaseClient } from "@supabase/supabase-js";

import { assertIzin, getSesiUser } from "@/lib/auth/server";
import { cekIzin, type AksiDomain } from "@/lib/auth/permissions";
import type { Peran, Profile } from "@/lib/auth/types";
import { fail, ok, type Result } from "@/lib/result";
import { createAdminClient } from "@/lib/supabase/admin";

export const SESSION_EXPIRED_MESSAGE =
  "Sesi Anda sudah berakhir. Silakan masuk lagi.";
export const PERMISSION_DENIED_MESSAGE =
  "Peran Anda tidak berwenang melakukan tindakan ini.";

export interface AdminActionSession {
  user: { id: string; email?: string };
  profile: Profile;
}

export interface AdminActionContext {
  session: AdminActionSession;
  actorId: string;
  peran: Peran | null;
  /**
   * Admin access stays lazy: existing wrappers validate the payload before the
   * service key is checked, so invalid input keeps its original error message.
   */
  getAdmin(): Result<SupabaseClient>;
}

export type AdminAction<T> = (
  context: AdminActionContext,
) => Result<T> | Promise<Result<T>>;

export interface WithAdminActionOptions {
  /** Label for "Layanan <service> belum tersedia. Hubungi administrator." */
  service: string;
  /** Permission checked with the shared role matrix after the session check. */
  aksi?: AksiDomain;
  /** Permission checked with assertIzin, keeping its module-specific messages. */
  assertAksi?: AksiDomain;
  /** Replaces the standard service-unavailable message when a caller needs one. */
  unavailableMessage?: string;
}

export async function withAdminAction<T>(
  service: string,
  action: AdminAction<T>,
): Promise<Result<T>>;
export async function withAdminAction<T>(
  options: WithAdminActionOptions,
  action: AdminAction<T>,
): Promise<Result<T>>;
export async function withAdminAction<T>(
  optionsOrService: WithAdminActionOptions | string,
  action: AdminAction<T>,
): Promise<Result<T>> {
  const options: WithAdminActionOptions =
    typeof optionsOrService === "string"
      ? { service: optionsOrService }
      : optionsOrService;

  let session: AdminActionSession;
  if (options.assertAksi !== undefined) {
    const izin = await assertIzin(options.assertAksi);
    if (!izin.ok) return fail(izin.message);
    session = { user: { id: izin.data.id }, profile: izin.data };
  } else {
    const current = await getSesiUser();
    if (!current) return fail(SESSION_EXPIRED_MESSAGE);
    if (options.aksi !== undefined && !cekIzin(current.profile.peran, options.aksi)) {
      return fail(PERMISSION_DENIED_MESSAGE);
    }
    session = current;
  }

  const unavailableMessage =
    options.unavailableMessage ??
    `Layanan ${options.service} belum tersedia. Hubungi administrator.`;

  return action({
    session,
    actorId: session.user.id,
    peran: session.profile.peran,
    getAdmin(): Result<SupabaseClient> {
      const admin = createAdminClient();
      if (!admin) return fail(unavailableMessage);
      return ok(admin);
    },
  });
}
