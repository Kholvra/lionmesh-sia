import { getSesiUser } from "@/lib/auth/server";
import { cekIzin, type AksiDomain } from "@/lib/auth/permissions";
import { fail, type Result } from "@/lib/result";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  hasOnlyKeys,
  isIsoDate,
  isNonBlankString,
  isRecord,
  isUuid,
} from "@/lib/validation";
import type {
  CatatMutasiResult,
  OpnameStokResult,
  TransferStokResult,
} from "./types";
import { isDecimal } from "./decimal";
import { catatMutasi, opnameStok, transferStok } from "./service";

type InventorySession = NonNullable<Awaited<ReturnType<typeof getSesiUser>>>;

function parseTransferInput(value: unknown) {
  if (!isRecord(value) || !hasOnlyKeys(value, ["produkId", "gudangAsalId", "gudangTujuanId", "qty", "tanggal"])) {
    return null;
  }
  if (
    !isUuid(value.produkId) ||
    !isUuid(value.gudangAsalId) ||
    !isUuid(value.gudangTujuanId) ||
    !isDecimal(value.qty, false, false) ||
    (value.tanggal !== undefined && !isIsoDate(value.tanggal))
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
    !isNonBlankString(value.alasan) ||
    (value.tanggal !== undefined && !isIsoDate(value.tanggal))
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
    !isNonBlankString(value.alasan) ||
    (value.tanggal !== undefined && !isIsoDate(value.tanggal))
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

/**
 * Jalur internal server untuk transfer manual. Pemanggil harus mencegah retry
 * otomatis dan tidak boleh meneruskan payload sumber dokumen atau actor.
 */
export async function transferStokUntukSesi(input: unknown): Promise<Result<TransferStokResult>> {
  const session = await requireInventoryPermission("transfer_antar_gudang");
  if (!session.ok) return session;

  const parsed = parseTransferInput(input);
  if (!parsed) return fail("Data transfer stok tidak valid.");

  const admin = createAdminClient();
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

  const admin = createAdminClient();
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

  const admin = createAdminClient();
  if (!admin) return fail("Layanan stok belum tersedia. Hubungi administrator.");

  return catatMutasi(admin, {
    ...parsed,
    tanggal: parsed.tanggal ?? new Date().toISOString(),
    tipe: "PENYESUAIAN",
    actorId: session.data.user.id,
  });
}
