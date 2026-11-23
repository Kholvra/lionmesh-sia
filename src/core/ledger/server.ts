import { getSesiUser } from "@/lib/auth/server";
import { fail, type Result } from "@/lib/result";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  hasOnlyKeys,
  isIsoDate,
  isNonBlankString,
  isRecord,
  isUuid,
} from "@/lib/validation";
import { postJournal, reverseJournal } from "./service";
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
  const session = await getSesiUser();
  if (!session) return fail("Sesi Anda sudah berakhir. Silakan masuk lagi.");

  const parsed = parsePostInput(input);
  if (!parsed) return fail("Data jurnal tidak valid.");

  const admin = createAdminClient();
  if (!admin) {
    return fail("Layanan jurnal belum tersedia. Hubungi administrator.");
  }

  return postJournal(admin, {
    ...parsed,
    actorId: session.user.id,
  });
}

export async function reverseJournalUntukSesi(
  input: unknown,
): Promise<Result<PostJournalResult>> {
  const session = await getSesiUser();
  if (!session) return fail("Sesi Anda sudah berakhir. Silakan masuk lagi.");

  const parsed = parseReverseInput(input);
  if (!parsed) return fail("Data jurnal pembalik tidak valid.");

  const admin = createAdminClient();
  if (!admin) {
    return fail("Layanan jurnal belum tersedia. Hubungi administrator.");
  }

  return reverseJournal(admin, {
    ...parsed,
    actorId: session.user.id,
  });
}
