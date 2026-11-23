import type { SupabaseClient } from "@supabase/supabase-js";

import { fail, ok, type Result } from "@/lib/result";
import type {
  AturanApproval,
  AturanApprovalSnapshot,
  Dokumen,
  JenisDokumen,
  RiwayatStatus,
} from "./types";

type Row = Record<string, unknown>;

function asString(value: unknown): string {
  return typeof value === "string" ? value : String(value ?? "");
}

function asNumber(value: unknown): number {
  return typeof value === "number" ? value : Number(value);
}

function asSnapshot(value: unknown): AturanApprovalSnapshot[] {
  return Array.isArray(value) ? (value as AturanApprovalSnapshot[]) : [];
}

function mapDokumen(row: Row): Dokumen {
  return {
    id: asString(row.id),
    tipe: asString(row.tipe),
    nomor: asString(row.nomor),
    periode: asString(row.periode),
    status: asString(row.status) as Dokumen["status"],
    pembuat_id: asString(row.pembuat_id),
    nominal: row.nominal === null ? null : asString(row.nominal),
    approval_snapshot: asSnapshot(row.approval_snapshot),
    siklus_approval: asNumber(row.siklus_approval),
    diposting: row.diposting === true,
    diposting_at: row.diposting_at === null ? null : asString(row.diposting_at),
    versi: asNumber(row.versi),
    created_by: row.created_by === null ? null : asString(row.created_by),
    created_at: asString(row.created_at),
    updated_by: row.updated_by === null ? null : asString(row.updated_by),
    updated_at: asString(row.updated_at),
  };
}

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
  return ok(data ? mapDokumen(data as unknown as Row) : null);
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

  return ok(
    ((data ?? []) as unknown as Row[]).map((row) => ({
      id: asString(row.id),
      dokumen_id: asString(row.dokumen_id),
      tipe_dokumen: asString(row.tipe_dokumen),
      aksi: asString(row.aksi) as RiwayatStatus["aksi"],
      status_asal:
        row.status_asal === null ? null : (asString(row.status_asal) as RiwayatStatus["status_asal"]),
      status_tujuan: asString(row.status_tujuan) as RiwayatStatus["status_tujuan"],
      level: row.level === null ? null : asNumber(row.level),
      alasan: row.alasan === null ? null : asString(row.alasan),
      siklus_approval: asNumber(row.siklus_approval),
      actor_id: asString(row.actor_id),
      created_by: row.created_by === null ? null : asString(row.created_by),
      created_at: asString(row.created_at),
      updated_by: row.updated_by === null ? null : asString(row.updated_by),
      updated_at: asString(row.updated_at),
    })),
  );
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

  const row = data as unknown as Row;
  return ok({
    tipe: asString(row.tipe),
    nama: asString(row.nama),
    status_awal: asString(row.status_awal) as JenisDokumen["status_awal"],
    perlu_approval: row.perlu_approval === true,
    status_menunggu_approval:
      row.status_menunggu_approval === null
        ? null
        : (asString(row.status_menunggu_approval) as JenisDokumen["status_menunggu_approval"]),
    created_by: row.created_by === null ? null : asString(row.created_by),
    created_at: asString(row.created_at),
    updated_by: row.updated_by === null ? null : asString(row.updated_by),
    updated_at: asString(row.updated_at),
  });
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

  return ok(
    ((data ?? []) as unknown as Row[]).map((row) => ({
      id: asString(row.id),
      tipe: asString(row.tipe),
      level: asNumber(row.level),
      peran: asString(row.peran) as AturanApproval["peran"],
      batas_bawah: asString(row.batas_bawah),
      batas_atas: row.batas_atas === null ? null : asString(row.batas_atas),
      aktif: row.aktif === true,
      created_by: row.created_by === null ? null : asString(row.created_by),
      created_at: asString(row.created_at),
      updated_by: row.updated_by === null ? null : asString(row.updated_by),
      updated_at: asString(row.updated_at),
    })),
  );
}
