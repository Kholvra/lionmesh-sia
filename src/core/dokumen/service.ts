import type { SupabaseClient } from "@supabase/supabase-js";

import { fail, ok, type Result } from "@/lib/result";
import type {
  BuatDokumenInput,
  Dokumen,
  PindahStatusDokumenInput,
  TransisiDokumenHasil,
  TransisiDokumenInput,
} from "./types";

type RpcRecord = Record<string, unknown>;

function isRecord(value: unknown): value is RpcRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseTransisiResult(value: unknown): Result<TransisiDokumenHasil> {
  if (!isRecord(value) || !isRecord(value.dokumen) || typeof value.riwayat_id !== "string") {
    return fail("Respons layanan dokumen tidak valid.");
  }

  return ok({
    dokumen: value.dokumen as unknown as Dokumen,
    riwayat_id: value.riwayat_id,
  });
}

function validateIdentification(input: TransisiDokumenInput): string | null {
  if (!input.dokumenId || !input.actorId) return "Data dokumen tidak lengkap.";
  if (!Number.isInteger(input.versi) || input.versi < 0) return "Versi dokumen tidak valid.";
  return null;
}

async function runTransition(
  supabase: SupabaseClient,
  rpc: string,
  args: Record<string, unknown>,
): Promise<Result<TransisiDokumenHasil>> {
  const { data, error } = await supabase.rpc(rpc, args);
  if (error) return fail(error.message);
  return parseTransisiResult(data);
}

export async function buatDokumen(
  supabase: SupabaseClient,
  input: BuatDokumenInput,
): Promise<Result<TransisiDokumenHasil>> {
  if (!input.tipe.trim() || !input.actorId) {
    return fail("Jenis dan aktor dokumen wajib diisi.");
  }

  return runTransition(supabase, "buat_dokumen", {
    p_tipe: input.tipe.trim(),
    p_aktor_id: input.actorId,
    p_nominal: input.nominal ?? null,
    p_tanggal: input.tanggal ?? null,
  });
}

export async function ajukanDokumen(
  supabase: SupabaseClient,
  input: TransisiDokumenInput,
): Promise<Result<TransisiDokumenHasil>> {
  const invalid = validateIdentification(input);
  if (invalid) return fail(invalid);

  return runTransition(supabase, "ajukan_dokumen", {
    p_dokumen_id: input.dokumenId,
    p_versi: input.versi,
    p_aktor_id: input.actorId,
    p_alasan: input.alasan ?? null,
  });
}

export async function periksaDokumen(
  supabase: SupabaseClient,
  input: TransisiDokumenInput,
): Promise<Result<TransisiDokumenHasil>> {
  const invalid = validateIdentification(input);
  if (invalid) return fail(invalid);

  return runTransition(supabase, "periksa_dokumen", {
    p_dokumen_id: input.dokumenId,
    p_versi: input.versi,
    p_aktor_id: input.actorId,
    p_alasan: input.alasan ?? null,
  });
}

export async function setujuiDokumen(
  supabase: SupabaseClient,
  input: TransisiDokumenInput,
): Promise<Result<TransisiDokumenHasil>> {
  const invalid = validateIdentification(input);
  if (invalid) return fail(invalid);

  return runTransition(supabase, "setujui_dokumen", {
    p_dokumen_id: input.dokumenId,
    p_versi: input.versi,
    p_aktor_id: input.actorId,
    p_alasan: input.alasan ?? null,
  });
}

export async function revisiDokumen(
  supabase: SupabaseClient,
  input: TransisiDokumenInput,
): Promise<Result<TransisiDokumenHasil>> {
  const invalid = validateIdentification(input);
  if (invalid) return fail(invalid);

  return runTransition(supabase, "revisi_dokumen", {
    p_dokumen_id: input.dokumenId,
    p_versi: input.versi,
    p_aktor_id: input.actorId,
    p_alasan: input.alasan ?? null,
  });
}

export async function selesaikanRevisiDokumen(
  supabase: SupabaseClient,
  input: TransisiDokumenInput,
): Promise<Result<TransisiDokumenHasil>> {
  const invalid = validateIdentification(input);
  if (invalid) return fail(invalid);

  return runTransition(supabase, "selesaikan_revisi_dokumen", {
    p_dokumen_id: input.dokumenId,
    p_versi: input.versi,
    p_aktor_id: input.actorId,
    p_alasan: input.alasan ?? null,
  });
}

export async function tolakDokumen(
  supabase: SupabaseClient,
  input: TransisiDokumenInput & { alasan: string },
): Promise<Result<TransisiDokumenHasil>> {
  const invalid = validateIdentification(input);
  if (invalid) return fail(invalid);
  if (!input.alasan.trim()) return fail("Isi alasan untuk menolak dokumen.");

  return runTransition(supabase, "tolak_dokumen", {
    p_dokumen_id: input.dokumenId,
    p_versi: input.versi,
    p_aktor_id: input.actorId,
    p_alasan: input.alasan,
  });
}

export async function batalkanDokumen(
  supabase: SupabaseClient,
  input: TransisiDokumenInput & { alasan: string },
): Promise<Result<TransisiDokumenHasil>> {
  const invalid = validateIdentification(input);
  if (invalid) return fail(invalid);
  if (!input.alasan.trim()) return fail("Isi alasan untuk membatalkan dokumen.");

  return runTransition(supabase, "batalkan_dokumen", {
    p_dokumen_id: input.dokumenId,
    p_versi: input.versi,
    p_aktor_id: input.actorId,
    p_alasan: input.alasan,
  });
}

export async function prosesDokumen(
  supabase: SupabaseClient,
  input: TransisiDokumenInput,
): Promise<Result<TransisiDokumenHasil>> {
  const invalid = validateIdentification(input);
  if (invalid) return fail(invalid);

  return runTransition(supabase, "proses_dokumen", {
    p_dokumen_id: input.dokumenId,
    p_versi: input.versi,
    p_aktor_id: input.actorId,
    p_alasan: input.alasan ?? null,
  });
}

export async function selesaikanDokumen(
  supabase: SupabaseClient,
  input: TransisiDokumenInput,
): Promise<Result<TransisiDokumenHasil>> {
  const invalid = validateIdentification(input);
  if (invalid) return fail(invalid);

  return runTransition(supabase, "selesaikan_dokumen", {
    p_dokumen_id: input.dokumenId,
    p_versi: input.versi,
    p_aktor_id: input.actorId,
    p_alasan: input.alasan ?? null,
  });
}

export async function pindahStatusDokumen(
  supabase: SupabaseClient,
  input: PindahStatusDokumenInput,
): Promise<Result<TransisiDokumenHasil>> {
  const invalid = validateIdentification(input);
  if (invalid) return fail(invalid);
  if (!input.statusTujuan || !input.aksi) return fail("Status dan aksi wajib diisi.");

  return runTransition(supabase, "pindah_status_dokumen", {
    p_dokumen_id: input.dokumenId,
    p_versi: input.versi,
    p_status_tujuan: input.statusTujuan,
    p_aksi: input.aksi,
    p_aktor_id: input.actorId,
    p_alasan: input.alasan ?? null,
    p_diposting: input.diposting ?? false,
    p_reset_approval: input.resetApproval ?? null,
  });
}
