import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { getSesiUser } from "@/lib/auth/server";
import { cekIzin, type AksiDomain } from "@/lib/auth/permissions";
import { fail, type Result } from "@/lib/result";
import { getSupabaseEnv } from "@/lib/supabase/env";
import type {
  CatatMutasiResult,
  OpnameStokResult,
  TransferStokResult,
} from "./types";
import { isDecimal } from "./decimal";
import { catatMutasi, opnameStok, transferStok } from "./service";

type InventorySession = NonNullable<Awaited<ReturnType<typeof getSesiUser>>>;
type InputRecord = Record<string, unknown>;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))?$/;

function isRecord(value: unknown): value is InputRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: InputRecord, keys: readonly string[]): boolean {
  return Object.keys(value).every((key) => keys.includes(key));
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function isDate(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = ISO_DATE_PATTERN.exec(value);
  if (!match) return false;

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day &&
    !Number.isNaN(Date.parse(value))
  );
}

function isReason(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function parseTransferInput(value: unknown) {
  if (!isRecord(value) || !hasOnlyKeys(value, ["produkId", "gudangAsalId", "gudangTujuanId", "qty", "tanggal"])) {
    return null;
  }
  if (
    !isUuid(value.produkId) ||
    !isUuid(value.gudangAsalId) ||
    !isUuid(value.gudangTujuanId) ||
    !isDecimal(value.qty, false, false) ||
    (value.tanggal !== undefined && !isDate(value.tanggal))
  ) {
    return null;
  }
  return {
    produkId: value.produkId,
    gudangAsalId: value.gudangAsalId,
    gudangTujuanId: value.gudangTujuanId,
    qty: value.qty,
    ...(value.tanggal === undefined ? {} : { tanggal: value.tanggal }),
  };
}

function parseOpnameInput(value: unknown) {
  if (!isRecord(value) || !hasOnlyKeys(value, ["produkId", "gudangId", "qtyFisik", "alasan", "tanggal"])) {
    return null;
  }
  if (
    !isUuid(value.produkId) ||
    !isUuid(value.gudangId) ||
    !isDecimal(value.qtyFisik, true, false) ||
    !isReason(value.alasan) ||
    (value.tanggal !== undefined && !isDate(value.tanggal))
  ) {
    return null;
  }
  return {
    produkId: value.produkId,
    gudangId: value.gudangId,
    qtyFisik: value.qtyFisik,
    alasan: value.alasan,
    ...(value.tanggal === undefined ? {} : { tanggal: value.tanggal }),
  };
}

function parseAdjustmentInput(value: unknown) {
  if (!isRecord(value) || !hasOnlyKeys(value, ["produkId", "gudangId", "qty", "alasan", "tanggal"])) {
    return null;
  }
  if (
    !isUuid(value.produkId) ||
    !isUuid(value.gudangId) ||
    !isDecimal(value.qty, false) ||
    !isReason(value.alasan) ||
    (value.tanggal !== undefined && !isDate(value.tanggal))
  ) {
    return null;
  }
  return {
    produkId: value.produkId,
    gudangId: value.gudangId,
    qty: value.qty,
    alasan: value.alasan,
    ...(value.tanggal === undefined ? {} : { tanggal: value.tanggal }),
  };
}

async function requireInventoryPermission(aksi: AksiDomain): Promise<Result<InventorySession>> {
  const session = await getSesiUser();
  if (!session) {
    return fail("Sesi Anda sudah berakhir. Silakan masuk lagi.");
  }
  if (!cekIzin(session.profile.peran, aksi)) {
    return fail("Peran Anda tidak berwenang melakukan tindakan ini.");
  }
  return { ok: true, data: session };
}

function createInventoryAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) return null;

  const { supabaseUrl } = getSupabaseEnv();
  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

/**
 * Jalur internal server untuk transfer manual. Pemanggil harus mencegah retry
 * otomatis dan tidak boleh meneruskan payload sumber dokumen atau actor.
 */
export async function transferStokUntukSesi(input: unknown): Promise<Result<TransferStokResult>> {
  const session = await requireInventoryPermission("transfer_antar_gudang");
  if (!session.ok) return session;

  const parsed = parseTransferInput(input);
  if (!parsed) return fail("Data transfer stok tidak valid.");

  const admin = createInventoryAdminClient();
  if (!admin) return fail("Layanan stok belum tersedia. Hubungi administrator.");

  return transferStok(admin, {
    ...parsed,
    actorId: session.data.user.id,
  });
}

/** Jalur internal server untuk opname manual oleh peran Gudang. */
export async function opnameStokUntukSesi(input: unknown): Promise<Result<OpnameStokResult>> {
  const session = await requireInventoryPermission("opname_stok");
  if (!session.ok) return session;

  const parsed = parseOpnameInput(input);
  if (!parsed) return fail("Data opname stok tidak valid.");

  const admin = createInventoryAdminClient();
  if (!admin) return fail("Layanan stok belum tersedia. Hubungi administrator.");

  return opnameStok(admin, {
    ...parsed,
    actorId: session.data.user.id,
  });
}

/** Jalur internal server untuk mutasi penyesuaian manual oleh peran Gudang. */
export async function catatPenyesuaianUntukSesi(input: unknown): Promise<Result<CatatMutasiResult>> {
  const session = await requireInventoryPermission("penyesuaian_stok");
  if (!session.ok) return session;

  const parsed = parseAdjustmentInput(input);
  if (!parsed) return fail("Data penyesuaian stok tidak valid.");

  const admin = createInventoryAdminClient();
  if (!admin) return fail("Layanan stok belum tersedia. Hubungi administrator.");

  return catatMutasi(admin, {
    ...parsed,
    tanggal: parsed.tanggal ?? new Date().toISOString(),
    tipe: "PENYESUAIAN",
    actorId: session.data.user.id,
  });
}
