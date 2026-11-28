import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { fail, ok, type Result } from "@/lib/result";
import { isRecord } from "@/lib/validation";
import type {
  AturanApproval,
  AturanApprovalSnapshot,
  Dokumen,
  JenisDokumen,
  RiwayatStatus,
} from "./types";

const RESPONS_TIDAK_VALID = "Respons layanan dokumen tidak valid.";

function keTeks(value: unknown): string {
  return typeof value === "string" ? value : String(value ?? "");
}

function keAngka(value: unknown): number {
  return typeof value === "number" ? value : Number(value);
}

function keBaris(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

const teks = () => z.preprocess(keTeks, z.string());

const teksNullable = () =>
  z.preprocess(
    (value) => (value === null ? null : keTeks(value)),
    z.string().nullable(),
  );

const angka = () =>
  z.preprocess(keAngka, z.custom<number>((value) => typeof value === "number"));

const angkaNullable = () =>
  z.preprocess(
    (value) => (value === null ? null : keAngka(value)),
    z.custom<number | null>((value) => value === null || typeof value === "number"),
  );

const bolean = () => z.preprocess((value) => value === true, z.boolean());

const snapshot = () =>
  z.preprocess(
    (value) => (Array.isArray(value) ? value : []),
    z.custom<AturanApprovalSnapshot[]>((value) => Array.isArray(value)),
  );

const status = () =>
  z.preprocess(keTeks, z.custom<Dokumen["status"]>((value) => typeof value === "string"));

const statusNullable = () =>
  z.preprocess(
    (value) => (value === null ? null : keTeks(value)),
    z.custom<Dokumen["status"] | null>(
      (value) => value === null || typeof value === "string",
    ),
  );

const aksi = () =>
  z.preprocess(keTeks, z.custom<RiwayatStatus["aksi"]>((value) => typeof value === "string"));

const peran = () =>
  z.preprocess(keTeks, z.custom<AturanApproval["peran"]>((value) => typeof value === "string"));

const dokumenRowSchema = z.preprocess(
  keBaris,
  z.object({
    id: teks(),
    tipe: teks(),
    nomor: teks(),
    periode: teks(),
    status: status(),
    pembuat_id: teks(),
    nominal: teksNullable(),
    approval_snapshot: snapshot(),
    siklus_approval: angka(),
    diposting: bolean(),
    diposting_at: teksNullable(),
    versi: angka(),
    created_by: teksNullable(),
    created_at: teks(),
    updated_by: teksNullable(),
    updated_at: teks(),
  }),
);

const riwayatStatusRowSchema = z.preprocess(
  keBaris,
  z.object({
    id: teks(),
    dokumen_id: teks(),
    tipe_dokumen: teks(),
    aksi: aksi(),
    status_asal: statusNullable(),
    status_tujuan: status(),
    level: angkaNullable(),
    alasan: teksNullable(),
    siklus_approval: angka(),
    actor_id: teks(),
    created_by: teksNullable(),
    created_at: teks(),
    updated_by: teksNullable(),
    updated_at: teks(),
  }),
);

const jenisDokumenRowSchema = z.preprocess(
  keBaris,
  z.object({
    tipe: teks(),
    nama: teks(),
    status_awal: status(),
    perlu_approval: bolean(),
    status_menunggu_approval: statusNullable(),
    created_by: teksNullable(),
    created_at: teks(),
    updated_by: teksNullable(),
    updated_at: teks(),
  }),
);

const aturanApprovalRowSchema = z.preprocess(
  keBaris,
  z.object({
    id: teks(),
    tipe: teks(),
    level: angka(),
    peran: peran(),
    batas_bawah: teks(),
    batas_atas: teksNullable(),
    aktif: bolean(),
    created_by: teksNullable(),
    created_at: teks(),
    updated_by: teksNullable(),
    updated_at: teks(),
  }),
);

const DOKUMEN_COLUMNS =
  "id,tipe,nomor,periode,status,pembuat_id,nominal::text,approval_snapshot," +
  "siklus_approval,diposting,diposting_at,versi,created_by,created_at,updated_by,updated_at";

export async function getDokumen(
  supabase: SupabaseClient,
  dokumenId: string,
): Promise<Result<Dokumen | null>> {
  const { data, error } = await supabase
    .from("dokumen")
    .select(DOKUMEN_COLUMNS)
    .eq("id", dokumenId)
    .maybeSingle();

  if (error) return fail(error.message);
  if (!data) return ok(null);

  const parsed = dokumenRowSchema.safeParse(data);
  if (!parsed.success) return fail(RESPONS_TIDAK_VALID);
  return ok(parsed.data);
}

export async function listRiwayatStatus(
  supabase: SupabaseClient,
  dokumenId: string,
): Promise<Result<RiwayatStatus[]>> {
  const { data, error } = await supabase
    .from("riwayat_status")
    .select(
      "id,dokumen_id,tipe_dokumen,aksi,status_asal,status_tujuan,level,alasan," +
        "siklus_approval,actor_id,created_by,created_at,updated_by,updated_at",
    )
    .eq("dokumen_id", dokumenId)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });

  if (error) return fail(error.message);

  const parsed = z.array(riwayatStatusRowSchema).safeParse(data ?? []);
  if (!parsed.success) return fail(RESPONS_TIDAK_VALID);
  return ok(parsed.data);
}

export async function getJenisDokumen(
  supabase: SupabaseClient,
  tipe: string,
): Promise<Result<JenisDokumen | null>> {
  const { data, error } = await supabase
    .from("jenis_dokumen")
    .select(
      "tipe,nama,status_awal,perlu_approval,status_menunggu_approval," +
        "created_by,created_at,updated_by,updated_at",
    )
    .eq("tipe", tipe)
    .maybeSingle();

  if (error) return fail(error.message);
  if (!data) return ok(null);

  const parsed = jenisDokumenRowSchema.safeParse(data);
  if (!parsed.success) return fail(RESPONS_TIDAK_VALID);
  return ok(parsed.data);
}

export async function listAturanApproval(
  supabase: SupabaseClient,
  tipe: string,
): Promise<Result<AturanApproval[]>> {
  const { data, error } = await supabase
    .from("aturan_approval")
    .select(
      "id,tipe,level,peran,batas_bawah::text,batas_atas::text,aktif," +
        "created_by,created_at,updated_by,updated_at",
    )
    .eq("tipe", tipe)
    .order("level", { ascending: true });

  if (error) return fail(error.message);

  const parsed = z.array(aturanApprovalRowSchema).safeParse(data ?? []);
  if (!parsed.success) return fail(RESPONS_TIDAK_VALID);
  return ok(parsed.data);
}
