import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Dokumen } from "@/core/dokumen";
import { cekIzin, type AksiDomain } from "@/lib/auth/permissions";
import type { Peran } from "@/lib/auth/types";
import { fail, ok, type Result } from "@/lib/result";
import { isRecord } from "@/lib/validation";
import {
  withAdminAction,
  type AdminActionContext,
} from "@/lib/with-admin-action";

import type { AksiSpk } from "./types";

export interface KonteksProduksi {
  supabase: SupabaseClient;
  actorId: string;
  peran: Peran | null;
}

export const PESAN_IZIN = "Peran Anda tidak berwenang melakukan tindakan ini.";
const RESPON_TIDAK_VALID = "Respons layanan produksi tidak valid.";
const dokumenRpc = z.custom<Dokumen>((value) => isRecord(value));

export const dokumenHasilMentah = z.object({ dokumen: dokumenRpc, riwayat_id: z.string() });
export const dokumenHasil = dokumenHasilMentah.transform((data) => ({
  dokumen: data.dokumen, riwayatId: data.riwayat_id,
}));

export const dokumenOpsionalMentah = z.object({
  dokumen: dokumenRpc.nullable(), riwayat_id: z.string().nullable(),
});
export const dokumenOpsional = dokumenOpsionalMentah.transform((data) =>
  data.dokumen && data.riwayat_id
    ? { dokumen: data.dokumen, riwayatId: data.riwayat_id }
    : {});

/** Identity comes from the Supabase session only, never from the payload. */
export function konteksDariAdminAction(context: AdminActionContext): Result<KonteksProduksi> {
  const admin = context.getAdmin();
  if (!admin.ok) return fail(admin.message);
  return ok({ supabase: admin.data, actorId: context.actorId, peran: context.peran });
}

export async function getProduksiExecutionContext(): Promise<Result<KonteksProduksi>> {
  return withAdminAction("produksi", (context) => konteksDariAdminAction(context));
}

export function validasi<S extends z.ZodTypeAny>(schema: S, input: unknown): Result<z.output<S>> {
  const hasil = schema.safeParse(input);
  return hasil.success
    ? ok(hasil.data)
    : fail(hasil.error.issues[0]?.message ?? "Input produksi tidak valid.");
}

/** One SECURITY DEFINER RPC owns the whole transaction; the actor is session-derived. */
export async function jalankanRpc<S extends z.ZodTypeAny>(
  ctx: KonteksProduksi,
  aksi: AksiDomain,
  rpc: string,
  argumen: Record<string, unknown>,
  schema: S,
): Promise<Result<z.output<S>>> {
  if (!cekIzin(ctx.peran, aksi)) return fail(PESAN_IZIN);
  const { data, error } = await ctx.supabase.rpc(rpc, { ...argumen, p_aktor_id: ctx.actorId });
  if (error) return fail(error.message);
  const hasil = schema.safeParse(data);
  return hasil.success ? ok(hasil.data) : fail(RESPON_TIDAK_VALID);
}

/** Compares decimal(18,4) strings without floating-point drift. */
export function skalaQty(nilai: string): bigint {
  const [bulat, desimal = ""] = nilai.split(".");
  return BigInt(bulat) * BigInt(10000) + BigInt(desimal.padEnd(4, "0"));
}

export const IZIN_TRANSISI: Record<AksiSpk, AksiDomain> = {
  CEK_BAHAN: "cek_ketersediaan_bahan",
  AJUKAN_PEMBELIAN: "ajukan_permintaan_bahan",
  TERIMA_BAHAN: "terima_bahan",
  MULAI: "ubah_batal_perintah_produksi",
  CATAT_HASIL: "catat_hasil_produksi",
  QC: "periksa_qc_hasil",
  SELESAI: "terima_barang_jadi",
  BATAL: "ubah_batal_perintah_produksi",
};
