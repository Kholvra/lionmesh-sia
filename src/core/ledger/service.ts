import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { parseRpcResult } from "@/lib/parse-rpc-result";
import { fail, ok, type Result } from "@/lib/result";
import { isIsoDate, isNonBlankString, isUuid } from "@/lib/validation";
import { formatCents, isMoney, moneyToCents } from "./money";
import {
  PEMBALIKAN,
  AKUN_PERAN_PATTERN,
  SUMBER_TIPE_PATTERN,
  type PostJournalInput,
  type PostJournalResult,
  type ReverseJournalInput,
} from "./types";

function toTanggalString(value: string | Date): string | null {
  const text = value instanceof Date ? value.toISOString() : value;
  return isIsoDate(text) ? text : null;
}

const skemaHasilJurnal = z
  .object({
    jurnal_id: z.string(),
    total_debit: z.string(),
    total_kredit: z.string(),
  })
  .transform((data) => ({
    jurnalId: data.jurnal_id,
    totalDebit: data.total_debit,
    totalKredit: data.total_kredit,
  }));

function validateHeader(input: {
  tanggal: string | Date;
  sumberTipe: string;
  sumberId: string;
  sumberNomor: string;
  sumberPemicu: string;
  actorId: string;
}): string | null {
  if (!isUuid(input.actorId)) {
    return "Sesi pengguna tidak valid.";
  }
  if (
    !SUMBER_TIPE_PATTERN.test(input.sumberTipe) ||
    !isUuid(input.sumberId) ||
    !isNonBlankString(input.sumberNomor) ||
    !isNonBlankString(input.sumberPemicu)
  ) {
    return "Data jurnal tidak valid.";
  }
  if (!toTanggalString(input.tanggal)) {
    return "Tanggal jurnal tidak valid.";
  }
  return null;
}

function validateBaris(baris: readonly { akunPeran: string; debit: string; kredit: string }[]) {
  if (baris.length < 2) {
    return { message: "Jurnal minimal dua baris." } as const;
  }

  let totalDebit = BigInt(0);
  let totalKredit = BigInt(0);

  for (const item of baris) {
    if (!AKUN_PERAN_PATTERN.test(item.akunPeran)) {
      return { message: "Data jurnal tidak valid." } as const;
    }
    if (!isMoney(item.debit) || !isMoney(item.kredit)) {
      return { message: "Nilai jurnal tidak valid: nominal harus bulat tanpa sen." } as const;
    }

    const debit = moneyToCents(item.debit);
    const kredit = moneyToCents(item.kredit);

    if (
      !(
        (debit > BigInt(0) && kredit === BigInt(0)) ||
        (kredit > BigInt(0) && debit === BigInt(0))
      )
    ) {
      return {
        message: "Setiap baris jurnal harus berisi debit atau kredit, bukan keduanya.",
      } as const;
    }

    totalDebit += debit;
    totalKredit += kredit;
  }

  if (totalDebit !== totalKredit) {
    return {
      message: `Jurnal tidak seimbang: debit ${formatCents(totalDebit)}, kredit ${formatCents(totalKredit)}.`,
    } as const;
  }

  return null;
}

export async function postJournal(
  supabase: SupabaseClient,
  input: PostJournalInput,
): Promise<Result<PostJournalResult>> {
  const headerError = validateHeader(input);
  if (headerError) return fail(headerError);

  if (input.sumberTipe === PEMBALIKAN && !input.jurnalAsalId) {
    return fail("Jurnal pembalik wajib merujuk jurnal asal.");
  }
  if (input.jurnalAsalId && !isUuid(input.jurnalAsalId)) {
    return fail("Jurnal asal tidak valid.");
  }
  if (input.jurnalAsalId && input.sumberTipe !== PEMBALIKAN) {
    return fail("Jurnal pembalik harus memakai sumber PEMBALIKAN.");
  }

  const barisError = validateBaris(input.baris);
  if (barisError) return fail(barisError.message);

  const tanggal = toTanggalString(input.tanggal);
  if (!tanggal) return fail("Tanggal jurnal tidak valid.");

  const { data, error } = await supabase.rpc("post_journal", {
    p_tanggal: tanggal,
    p_sumber_tipe: input.sumberTipe,
    p_sumber_id: input.sumberId,
    p_sumber_nomor: input.sumberNomor,
    p_sumber_pemicu: input.sumberPemicu,
    p_baris: input.baris.map((item) => ({
      akun_peran: item.akunPeran,
      debit: item.debit,
      kredit: item.kredit,
    })),
    p_mata_uang: input.mataUang ?? "IDR",
    p_actor_id: input.actorId,
    p_jurnal_asal_id: input.jurnalAsalId ?? null,
  });

  if (error) return fail(error.message);

  const result = parseRpcResult(skemaHasilJurnal, data);
  if (!result) return fail("Respons jurnal tidak valid.");
  return ok(result);
}

export async function reverseJournal(
  supabase: SupabaseClient,
  input: ReverseJournalInput,
): Promise<Result<PostJournalResult>> {
  if (
    !isUuid(input.jurnalId) ||
    !isUuid(input.actorId) ||
    !isUuid(input.sumberId) ||
    !isNonBlankString(input.sumberNomor) ||
    !isNonBlankString(input.sumberPemicu)
  ) {
    return fail("Data jurnal pembalik tidak valid.");
  }

  const tanggal = toTanggalString(input.tanggal);
  if (!tanggal) return fail("Tanggal jurnal tidak valid.");

  const { data, error } = await supabase.rpc("reverse_journal", {
    p_jurnal_id: input.jurnalId,
    p_tanggal: tanggal,
    p_sumber_id: input.sumberId,
    p_sumber_nomor: input.sumberNomor,
    p_sumber_pemicu: input.sumberPemicu,
    p_actor_id: input.actorId,
  });

  if (error) return fail(error.message);

  const result = parseRpcResult(skemaHasilJurnal, data);
  if (!result) return fail("Respons jurnal tidak valid.");
  return ok(result);
}
