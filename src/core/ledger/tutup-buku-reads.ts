import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { ambilTeks } from "@/lib/ambil-teks";
import { parseRpcResult } from "@/lib/parse-rpc-result";
import { fail, ok, type Result } from "@/lib/result";
import { isRecord } from "@/lib/validation";
import { buatPeriode } from "./periode";
import type {
  PeriodeAkuntansiStatus,
  TahunBukuStatus,
} from "./tutup-buku";

const teksSchema = z.unknown().optional().transform((value) => ambilTeks(value));
const angkaSchema = z.unknown().optional().transform((value) => Number(value));

const periodeRowSchema = z
  .object({
    tahun: angkaSchema,
    bulan: angkaSchema,
    status: teksSchema.pipe(z.enum(["buka", "kunci"])),
    dikunci_at: teksSchema,
    dikunci_oleh: teksSchema,
  })
  .refine(
    (row) =>
      Number.isInteger(row.tahun) &&
      Number.isInteger(row.bulan) &&
      row.bulan >= 1 &&
      row.bulan <= 12,
  )
  .transform((row) => ({
    ...buatPeriode(row.tahun, row.bulan),
    status: row.status,
    dikunciAt: row.dikunci_at,
    dikunciOleh: row.dikunci_oleh,
  }));

const tahunBukuSchema = z.object({
  id: teksSchema,
  tahun: angkaSchema,
  status: teksSchema.pipe(z.enum(["terbuka", "ditutup"])),
  ditutup_at: teksSchema,
  ditutup_oleh: teksSchema,
});

const setengahPostingSchema = z
  .number()
  .refine((value) => Number.isInteger(value) && value >= 0);

export async function listPeriodeAkuntansiStatus(
  supabase: SupabaseClient,
): Promise<Result<PeriodeAkuntansiStatus[]>> {
  const { data, error } = await supabase
    .from("periode_akuntansi")
    .select("tahun, bulan, status, dikunci_at, dikunci_oleh")
    .order("tahun", { ascending: true })
    .order("bulan", { ascending: true });

  if (error) return fail(`Gagal membaca periode akuntansi: ${error.message}`);
  if (!Array.isArray(data)) return fail("Respons periode akuntansi tidak valid.");

  const hasil: PeriodeAkuntansiStatus[] = [];
  for (const item of data) {
    const periode = parseRpcResult(periodeRowSchema, item);
    if (!periode) return fail("Data periode akuntansi tidak lengkap.");
    hasil.push(periode);
  }

  return ok(hasil);
}

export async function getTahunBuku(
  supabase: SupabaseClient,
  tahun: number,
): Promise<Result<TahunBukuStatus>> {
  const { data, error } = await supabase
    .from("tahun_buku")
    .select("id, tahun, status, ditutup_at, ditutup_oleh")
    .eq("tahun", tahun)
    .maybeSingle();

  if (error) return fail(`Gagal membaca tahun buku: ${error.message}`);

  if (!data) {
    return ok({
      id: null,
      tahun,
      status: "terbuka",
      ditutupAt: null,
      ditutupOleh: null,
    });
  }

  const hasil = parseRpcResult(tahunBukuSchema, data, (value) =>
    isRecord(value)
      ? "Status tahun buku tidak valid."
      : "Respons tahun buku tidak valid.",
  );
  if (!hasil.ok) return hasil;

  return ok({
    id: hasil.data.id,
    tahun: hasil.data.tahun,
    status: hasil.data.status,
    ditutupAt: hasil.data.ditutup_at,
    ditutupOleh: hasil.data.ditutup_oleh,
  });
}

export async function hitungSetengahPosting(
  admin: SupabaseClient,
  tahun: number,
  bulan: number,
): Promise<Result<number>> {
  const { data, error } = await admin.rpc("c010_hitung_setengah_posting", {
    p_tahun: tahun,
    p_bulan: bulan,
  });

  if (error) {
    return fail(`Gagal memeriksa dokumen setengah posting: ${error.message}`);
  }

  return parseRpcResult(
    setengahPostingSchema,
    data,
    "Respons pemeriksaan setengah posting tidak valid.",
  );
}
