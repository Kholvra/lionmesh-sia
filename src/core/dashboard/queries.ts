import type { SupabaseClient } from "@supabase/supabase-js";

import { getDokumenExecutionContext } from "@/core/dokumen";
import { DAFTAR_PERAN, type Peran } from "@/lib/auth/types";
import { isRecord } from "@/lib/validation";
import { readAllPages } from "./pagination";

import {
  hitungKartu,
  sumberPerSiklus,
  susunAntrean,
  SIKLUS_PER_TIPE,
} from "./antrean";
import type {
  AturanApprovalAntrean,
  DokumenMenunggu,
  PersetujuanTercatat,
  RingkasanDashboard,
} from "./types";

export interface DataDashboard {
  ringkasan: RingkasanDashboard;
  error: string | null;
}

const PESAN_GAGAL =
  "Ringkasan tindakan gagal dimuat. Sumber data tidak dapat dibaca.";

function gagal(tipeTerdaftar: readonly string[], message = PESAN_GAGAL): DataDashboard {
  const sumber = sumberPerSiklus(tipeTerdaftar, true);
  return {
    ringkasan: {
      antrean: [],
      kartu: hitungKartu([], sumber),
      tanpaSiklus: 0,
    },
    error: message,
  };
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function isPeran(value: unknown): value is Peran {
  return (
    typeof value === "string" && (DAFTAR_PERAN as readonly string[]).includes(value)
  );
}

function parseSnapshot(value: unknown): AturanApprovalAntrean[] {
  if (!Array.isArray(value)) return [];

  const hasil: AturanApprovalAntrean[] = [];
  for (const item of value) {
    if (!isRecord(item)) continue;
    const level = item.level;
    if (typeof level !== "number" || !Number.isInteger(level) || level < 1) {
      continue;
    }
    if (!isPeran(item.peran)) continue;
    hasil.push({ level, peran: item.peran });
  }
  return hasil.sort((kiri, kanan) => kiri.level - kanan.level);
}

interface JenisDokumenRingkas {
  nama: string;
  perluApproval: boolean;
  statusMenungguApproval: string | null;
}

async function ambilJenis(
  supabase: SupabaseClient,
): Promise<{
  daftar: Map<string, JenisDokumenRingkas>;
  tipeTerdaftar: string[];
  error: string | null;
}> {
  const { data, error } = await supabase
    .from("jenis_dokumen")
    .select("tipe,nama,perlu_approval,status_menunggu_approval");

  if (error) {
    return { daftar: new Map(), tipeTerdaftar: [], error: error.message };
  }

  const daftar = new Map<string, JenisDokumenRingkas>();
  const tipeTerdaftar: string[] = [];

  for (const row of (data ?? []) as unknown[]) {
    if (!isRecord(row)) continue;
    const tipe = asString(row.tipe);
    if (!tipe) continue;
    daftar.set(tipe, {
      nama: asString(row.nama) || tipe,
      perluApproval: row.perlu_approval === true,
      statusMenungguApproval:
        typeof row.status_menunggu_approval === "string"
          ? row.status_menunggu_approval
          : null,
    });
    tipeTerdaftar.push(tipe);
  }

  return { daftar, tipeTerdaftar, error: null };
}

async function ambilDokumen(
  supabase: SupabaseClient,
  statusMenunggu: readonly string[],
  jenis: Map<string, JenisDokumenRingkas>,
): Promise<{ daftar: DokumenMenunggu[]; error: string | null }> {
  if (statusMenunggu.length === 0) {
    return { daftar: [], error: null };
  }

  const { data, error } = await readAllPages((from, to) => supabase
    .from("dokumen")
    .select(
      "id,tipe,nomor,status,pembuat_id,approval_snapshot,siklus_approval,updated_at",
    )
    .in("status", [...statusMenunggu])
    .order("updated_at", { ascending: true })
    .order("id", { ascending: true })
    .range(from, to));

  if (error) {
    return { daftar: [], error };
  }

  const daftar: DokumenMenunggu[] = [];
  for (const row of (data ?? []) as unknown[]) {
    if (!isRecord(row)) continue;
    const tipe = asString(row.tipe);
    const detail = jenis.get(tipe);
    if (!detail?.perluApproval) continue;

    daftar.push({
      id: asString(row.id),
      tipe,
      nomor: asString(row.nomor),
      status: asString(row.status),
      pembuatId: asString(row.pembuat_id),
      namaJenis: detail.nama,
      perluApproval: detail.perluApproval,
      statusMenungguApproval: detail.statusMenungguApproval,
      approvalSnapshot: parseSnapshot(row.approval_snapshot),
      siklusApproval:
        typeof row.siklus_approval === "number" ? row.siklus_approval : 0,
      mulaiMenunggu: asString(row.updated_at),
    });
  }

  return { daftar, error: null };
}

async function ambilPersetujuan(
  supabase: SupabaseClient,
  dokumenIds: readonly string[],
): Promise<{ daftar: PersetujuanTercatat[]; error: string | null }> {
  if (dokumenIds.length === 0) {
    return { daftar: [], error: null };
  }

  const data: unknown[] = [];
  for (let index = 0; index < dokumenIds.length; index += 100) {
    const ids = dokumenIds.slice(index, index + 100);
    const result = await readAllPages((from, to) => supabase
      .from("riwayat_status")
      .select("dokumen_id,level,actor_id,siklus_approval")
      .in("dokumen_id", [...ids])
      .eq("aksi", "SETUJUI")
      .order("id", { ascending: true })
      .range(from, to));
    if (result.error) return { daftar: [], error: result.error };
    data.push(...result.data);
  }

  const daftar: PersetujuanTercatat[] = [];
  for (const row of (data ?? []) as unknown[]) {
    if (!isRecord(row)) continue;
    if (typeof row.level !== "number") continue;
    daftar.push({
      dokumenId: asString(row.dokumen_id),
      level: row.level,
      actorId: asString(row.actor_id),
      siklusApproval:
        typeof row.siklus_approval === "number" ? row.siklus_approval : 0,
    });
  }

  return { daftar, error: null };
}

/**
 * Read model dashboard. Actor identity comes only from the server session, and
 * every row is filtered by approval role and separation of duties here, not in
 * the browser.
 */
export async function getDataDashboard(aktor: {
  id: string;
  peran: Peran | null;
}): Promise<DataDashboard> {
  const context = await getDokumenExecutionContext();
  if (!context.ok) {
    return gagal(Object.keys(SIKLUS_PER_TIPE), context.message);
  }

  const supabase = context.data.supabase;

  const jenis = await ambilJenis(supabase);
  if (jenis.error) {
    return gagal(Object.keys(SIKLUS_PER_TIPE));
  }

  const statusMenunggu = [
    ...new Set(
      [...jenis.daftar.values()]
        .filter((item) => item.perluApproval && item.statusMenungguApproval)
        .map((item) => item.statusMenungguApproval as string),
    ),
  ];

  const dokumen = await ambilDokumen(supabase, statusMenunggu, jenis.daftar);
  if (dokumen.error) {
    return gagal(jenis.tipeTerdaftar);
  }

  const persetujuan = await ambilPersetujuan(
    supabase,
    dokumen.daftar.map((item) => item.id),
  );
  if (persetujuan.error) {
    return gagal(jenis.tipeTerdaftar);
  }

  const hasil = susunAntrean(dokumen.daftar, persetujuan.daftar, aktor);
  const sumber = sumberPerSiklus(jenis.tipeTerdaftar, false);

  return {
    ringkasan: {
      antrean: hasil.antrean,
      kartu: hitungKartu(hasil.antrean, sumber),
      tanpaSiklus: hasil.tanpaSiklus,
    },
    error: null,
  };
}
