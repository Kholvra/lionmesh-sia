import type { SupabaseClient } from "@supabase/supabase-js";

import { fail, ok, type Result } from "@/lib/result";
import { isRecord, isUuid } from "@/lib/validation";
import type { PeriodeLaporan } from "./periode";

export interface TutupPeriodeInput {
  tahun: number;
  bulan: number;
  actorId: string;
}

export interface TutupTahunInput {
  tahun: number;
  actorId: string;
}

export interface HasilTutupPeriode {
  tahun: number;
  bulan: number;
  status: "kunci";
  dikunciAt: string;
}

export interface HasilTutupTahun {
  tahun: number;
  status: "ditutup";
  jurnalId: string | null;
  totalDebit: string | null;
  totalKredit: string | null;
}

export interface PeriodeAkuntansiStatus extends PeriodeLaporan {
  status: "buka" | "kunci" | "belum_ada";
  dikunciAt: string | null;
  dikunciOleh: string | null;
}

export interface TahunBukuStatus {
  id: string | null;
  tahun: number;
  status: "terbuka" | "ditutup";
  ditutupAt: string | null;
  ditutupOleh: string | null;
}

export interface NeracaSaldoPemeriksaan {
  seimbang: boolean;
  totalDebitCents: string;
  totalKreditCents: string;
  selisihCents: string;
}

export interface PemeriksaanTutupPeriode {
  periode: PeriodeLaporan;
  status: "buka" | "kunci" | "belum_ada";
  periodeSebelumnya: {
    label: string;
    status: "buka" | "kunci" | "belum_ada";
  } | null;
  setengahPosting: number;
  neraca: NeracaSaldoPemeriksaan;
  tahunSebelumnya: {
    tahun: number;
    status: "terbuka" | "ditutup" | "tidak_ada";
    punyaAktivitas: boolean;
  } | null;
  bisaDitutup: boolean;
  alasan: string[];
}

export interface PemeriksaanTutupTahun {
  tahun: number;
  status: "terbuka" | "ditutup";
  periodeTerbuka: { tahun: number; bulan: number; label: string }[];
  desember: { status: "buka" | "kunci" | "belum_ada"; label: string };
  setengahPosting: number;
  neraca: NeracaSaldoPemeriksaan;
  tahunSebelumnya: {
    tahun: number;
    status: "terbuka" | "ditutup" | "tidak_ada";
    punyaAktivitas: boolean;
  } | null;
  bisaDitutup: boolean;
  alasan: string[];
}

function parseTutupPeriodeResult(value: unknown): HasilTutupPeriode | null {
  if (
    !isRecord(value) ||
    typeof value.tahun !== "number" ||
    typeof value.bulan !== "number" ||
    value.status !== "kunci" ||
    typeof value.dikunci_at !== "string"
  ) {
    return null;
  }

  return {
    tahun: value.tahun,
    bulan: value.bulan,
    status: "kunci",
    dikunciAt: value.dikunci_at,
  };
}

function parseTutupTahunResult(value: unknown): HasilTutupTahun | null {
  if (
    !isRecord(value) ||
    typeof value.tahun !== "number" ||
    value.status !== "ditutup" ||
    (value.jurnal_id !== null && typeof value.jurnal_id !== "string") ||
    (value.total_debit !== null && typeof value.total_debit !== "string") ||
    (value.total_kredit !== null && typeof value.total_kredit !== "string")
  ) {
    return null;
  }

  return {
    tahun: value.tahun,
    status: "ditutup",
    jurnalId: value.jurnal_id,
    totalDebit: value.total_debit,
    totalKredit: value.total_kredit,
  };
}

function validasiTahunBulan(tahun: number, bulan: number): string | null {
  if (!Number.isInteger(tahun) || tahun < 2000 || tahun > 9999) {
    return "Tahun periode tidak valid.";
  }
  if (!Number.isInteger(bulan) || bulan < 1 || bulan > 12) {
    return "Bulan periode tidak valid.";
  }
  return null;
}

export async function tutupPeriode(
  supabase: SupabaseClient,
  input: TutupPeriodeInput,
): Promise<Result<HasilTutupPeriode>> {
  const invalid = validasiTahunBulan(input.tahun, input.bulan);
  if (invalid) return fail(invalid);
  if (input.bulan === 12) {
    return fail(
      "Desember ditutup lewat tutup buku tahunan, bukan tutup periode bulanan.",
    );
  }
  if (!isUuid(input.actorId)) return fail("Sesi pengguna tidak valid.");

  const { data, error } = await supabase.rpc("tutup_periode", {
    p_tahun: input.tahun,
    p_bulan: input.bulan,
    p_actor_id: input.actorId,
  });

  if (error) return fail(error.message);

  const hasil = parseTutupPeriodeResult(data);
  if (!hasil) return fail("Respons tutup periode tidak valid.");
  return ok(hasil);
}

export async function tutupBukuTahunan(
  supabase: SupabaseClient,
  input: TutupTahunInput,
): Promise<Result<HasilTutupTahun>> {
  if (!Number.isInteger(input.tahun) || input.tahun < 2000 || input.tahun > 9999) {
    return fail("Tahun buku tidak valid.");
  }
  if (!isUuid(input.actorId)) return fail("Sesi pengguna tidak valid.");

  const { data, error } = await supabase.rpc("tutup_buku_tahunan", {
    p_tahun: input.tahun,
    p_actor_id: input.actorId,
  });

  if (error) return fail(error.message);

  const hasil = parseTutupTahunResult(data);
  if (!hasil) return fail("Respons tutup buku tahunan tidak valid.");
  return ok(hasil);
}

export function parseTutupPeriodeResponse(value: unknown): HasilTutupPeriode | null {
  return parseTutupPeriodeResult(value);
}

export function parseTutupTahunResponse(value: unknown): HasilTutupTahun | null {
  return parseTutupTahunResult(value);
}
