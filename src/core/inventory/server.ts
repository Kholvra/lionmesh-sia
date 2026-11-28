import "server-only";

import { fail, type Result } from "@/lib/result";
import { withAdminAction } from "@/lib/with-admin-action";
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

/**
 * Jalur internal server untuk transfer manual. Pemanggil harus mencegah retry
 * otomatis dan tidak boleh meneruskan payload sumber dokumen atau actor.
 */
export async function transferStokUntukSesi(input: unknown): Promise<Result<TransferStokResult>> {
  return withAdminAction({ service: "stok", aksi: "transfer_antar_gudang" }, ({ actorId, getAdmin }) => {
    const parsed = parseTransferInput(input);
    if (!parsed) return fail("Data transfer stok tidak valid.");

    const admin = getAdmin();
    if (!admin.ok) return admin;

    return transferStok(admin.data, {
      ...parsed,
      actorId,
    });
  });
}

/** Jalur internal server untuk opname manual oleh peran Gudang. */
export async function opnameStokUntukSesi(input: unknown): Promise<Result<OpnameStokResult>> {
  return withAdminAction({ service: "stok", aksi: "opname_stok" }, ({ actorId, getAdmin }) => {
    const parsed = parseOpnameInput(input);
    if (!parsed) return fail("Data opname stok tidak valid.");

    const admin = getAdmin();
    if (!admin.ok) return admin;

    return opnameStok(admin.data, {
      ...parsed,
      actorId,
    });
  });
}

/** Jalur internal server untuk mutasi penyesuaian manual oleh peran Gudang. */
export async function catatPenyesuaianUntukSesi(input: unknown): Promise<Result<CatatMutasiResult>> {
  return withAdminAction({ service: "stok", aksi: "penyesuaian_stok" }, ({ actorId, getAdmin }) => {
    const parsed = parseAdjustmentInput(input);
    if (!parsed) return fail("Data penyesuaian stok tidak valid.");

    const admin = getAdmin();
    if (!admin.ok) return admin;

    return catatMutasi(admin.data, {
      ...parsed,
      tanggal: parsed.tanggal ?? new Date().toISOString(),
      tipe: "PENYESUAIAN",
      actorId,
    });
  });
}
