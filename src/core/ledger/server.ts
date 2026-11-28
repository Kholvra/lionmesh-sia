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
import { postJournal, reverseJournal } from "./service";
import {
  tutupBukuTahunan,
  tutupPeriode,
  type HasilTutupPeriode,
  type HasilTutupTahun,
} from "./tutup-buku";
import {
  AKUN_PERAN_PATTERN,
  SUMBER_TIPE_PATTERN,
  type BarisJurnal,
  type PostJournalInput,
  type PostJournalResult,
  type ReverseJournalInput,
} from "./types";

function parseBaris(value: unknown): BarisJurnal[] | null {
  if (!Array.isArray(value) || value.length < 2) return null;

  const baris: BarisJurnal[] = [];
  for (const item of value) {
    if (
      !isRecord(item) ||
      !hasOnlyKeys(item, ["akunPeran", "debit", "kredit"]) ||
      typeof item.akunPeran !== "string" ||
      !AKUN_PERAN_PATTERN.test(item.akunPeran) ||
      typeof item.debit !== "string" ||
      typeof item.kredit !== "string"
    ) {
      return null;
    }

    baris.push({
      akunPeran: item.akunPeran,
      debit: item.debit,
      kredit: item.kredit,
    });
  }
  return baris;
}

function parsePostInput(value: unknown): Omit<PostJournalInput, "actorId"> | null {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, [
      "tanggal",
      "sumberTipe",
      "sumberId",
      "sumberNomor",
      "sumberPemicu",
      "mataUang",
      "baris",
    ])
  ) {
    return null;
  }

  const baris = parseBaris(value.baris);
  if (
    !isIsoDate(value.tanggal) ||
    typeof value.sumberTipe !== "string" ||
    !SUMBER_TIPE_PATTERN.test(value.sumberTipe) ||
    !isUuid(value.sumberId) ||
    !isNonBlankString(value.sumberNomor) ||
    !isNonBlankString(value.sumberPemicu) ||
    (value.mataUang !== undefined && value.mataUang !== "IDR") ||
    !baris
  ) {
    return null;
  }

  return {
    tanggal: value.tanggal,
    sumberTipe: value.sumberTipe,
    sumberId: value.sumberId,
    sumberNomor: value.sumberNomor,
    sumberPemicu: value.sumberPemicu,
    mataUang: "IDR",
    baris,
  };
}

function parseReverseInput(
  value: unknown,
): Omit<ReverseJournalInput, "actorId"> | null {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, [
      "jurnalId",
      "tanggal",
      "sumberId",
      "sumberNomor",
      "sumberPemicu",
    ])
  ) {
    return null;
  }

  if (
    !isUuid(value.jurnalId) ||
    !isIsoDate(value.tanggal) ||
    !isUuid(value.sumberId) ||
    !isNonBlankString(value.sumberNomor) ||
    !isNonBlankString(value.sumberPemicu)
  ) {
    return null;
  }

  return {
    jurnalId: value.jurnalId,
    tanggal: value.tanggal,
    sumberId: value.sumberId,
    sumberNomor: value.sumberNomor,
    sumberPemicu: value.sumberPemicu,
  };
}

export async function postJournalUntukSesi(
  input: unknown,
): Promise<Result<PostJournalResult>> {
  return withAdminAction({ service: "jurnal" }, async ({ session, getAdmin }) => {
    const parsed = parsePostInput(input);
    if (!parsed) return fail("Data jurnal tidak valid.");

    const admin = getAdmin();
    if (!admin.ok) return fail(admin.message);

    return postJournal(admin.data, {
      ...parsed,
      actorId: session.user.id,
    });
  });
}

export async function reverseJournalUntukSesi(
  input: unknown,
): Promise<Result<PostJournalResult>> {
  return withAdminAction({ service: "jurnal" }, async ({ session, getAdmin }) => {
    const parsed = parseReverseInput(input);
    if (!parsed) return fail("Data jurnal pembalik tidak valid.");

    const admin = getAdmin();
    if (!admin.ok) return fail(admin.message);

    return reverseJournal(admin.data, {
      ...parsed,
      actorId: session.user.id,
    });
  });
}

function parseTutupPeriodeInput(
  value: unknown,
): { tahun: number; bulan: number } | null {
  if (!isRecord(value) || !hasOnlyKeys(value, ["tahun", "bulan"])) {
    return null;
  }
  if (
    typeof value.tahun !== "number" ||
    !Number.isInteger(value.tahun) ||
    typeof value.bulan !== "number" ||
    !Number.isInteger(value.bulan)
  ) {
    return null;
  }
  return { tahun: value.tahun, bulan: value.bulan };
}

function parseTutupTahunInput(value: unknown): { tahun: number } | null {
  if (!isRecord(value) || !hasOnlyKeys(value, ["tahun"])) return null;
  if (typeof value.tahun !== "number" || !Number.isInteger(value.tahun)) {
    return null;
  }
  return { tahun: value.tahun };
}

export async function tutupPeriodeUntukSesi(
  input: unknown,
): Promise<Result<HasilTutupPeriode>> {
  return withAdminAction(
    { service: "tutup buku", assertAksi: "tutup_periode" },
    async ({ actorId, getAdmin }) => {
      const parsed = parseTutupPeriodeInput(input);
      if (!parsed) return fail("Data periode tidak valid.");

      const admin = getAdmin();
      if (!admin.ok) return fail(admin.message);

      return tutupPeriode(admin.data, { ...parsed, actorId });
    },
  );
}

export async function tutupTahunUntukSesi(
  input: unknown,
): Promise<Result<HasilTutupTahun>> {
  return withAdminAction(
    { service: "tutup buku", assertAksi: "tutup_tahun_buku" },
    async ({ actorId, getAdmin }) => {
      const parsed = parseTutupTahunInput(input);
      if (!parsed) return fail("Data tahun buku tidak valid.");

      const admin = getAdmin();
      if (!admin.ok) return fail(admin.message);

      return tutupBukuTahunan(admin.data, { ...parsed, actorId });
    },
  );
}
