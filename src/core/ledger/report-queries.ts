import type { SupabaseClient } from "@supabase/supabase-js";

import { fail, ok, type Result } from "@/lib/result";
import { isRecord } from "@/lib/validation";
import { buatPeriode, type PeriodeLaporan } from "./periode";
import type { AkunRingkas, BarisLaporan } from "./report";

const UKURAN_HALAMAN = 1000;

const SELECT_BARIS =
  "id, debit::text, kredit::text, " +
  "jurnal:jurnal_id!inner(id, tanggal, sumber_tipe, sumber_nomor, sumber_pemicu, created_at), " +
  "akun:akun_id!inner(id, nomor, nama, peran)";

export interface FilterBarisJurnal {
  /** Batas bawah inklusif, ISO dengan offset. */
  mulai?: string;
  /** Batas atas eksklusif, ISO dengan offset. */
  selesai?: string;
  akunId?: string;
}

function ambilTeks(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function petakanBaris(value: unknown): BarisLaporan | null {
  if (!isRecord(value) || !isRecord(value.jurnal) || !isRecord(value.akun)) {
    return null;
  }

  const jurnal = value.jurnal;
  const akun = value.akun;

  const barisId = ambilTeks(value.id);
  const jurnalId = ambilTeks(jurnal.id);
  const tanggal = ambilTeks(jurnal.tanggal);
  const dibuatPada = ambilTeks(jurnal.created_at);
  const sumberTipe = ambilTeks(jurnal.sumber_tipe);
  const sumberNomor = ambilTeks(jurnal.sumber_nomor);
  const sumberPemicu = ambilTeks(jurnal.sumber_pemicu);
  const akunId = ambilTeks(akun.id);
  const akunNomor = ambilTeks(akun.nomor);
  const akunNama = ambilTeks(akun.nama);
  const akunPeran = ambilTeks(akun.peran);
  const debit = ambilTeks(value.debit);
  const kredit = ambilTeks(value.kredit);

  if (
    !barisId ||
    !jurnalId ||
    !tanggal ||
    !dibuatPada ||
    !sumberTipe ||
    !sumberNomor ||
    !sumberPemicu ||
    !akunId ||
    !akunNomor ||
    !akunNama ||
    !akunPeran ||
    !debit ||
    !kredit
  ) {
    return null;
  }

  return {
    barisId,
    jurnalId,
    tanggal,
    dibuatPada,
    sumberTipe,
    sumberNomor,
    sumberPemicu,
    akunId,
    akunNomor,
    akunNama,
    akunPeran,
    debit,
    kredit,
  };
}

/**
 * Reads journal lines for a report. Uses keyset-free paging because PostgREST
 * caps a response at `max_rows`; a report must never show a silently truncated
 * ledger.
 */
export async function listBarisJurnal(
  supabase: SupabaseClient,
  filter: FilterBarisJurnal = {},
): Promise<Result<BarisLaporan[]>> {
  const hasil: BarisLaporan[] = [];

  for (let offset = 0; ; offset += UKURAN_HALAMAN) {
    let query = supabase
      .from("detail_jurnal")
      .select(SELECT_BARIS)
      .order("tanggal", { referencedTable: "jurnal", ascending: true })
      .order("id", { ascending: true })
      .range(offset, offset + UKURAN_HALAMAN - 1);

    if (filter.mulai) query = query.gte("jurnal.tanggal", filter.mulai);
    if (filter.selesai) query = query.lt("jurnal.tanggal", filter.selesai);
    if (filter.akunId) query = query.eq("akun_id", filter.akunId);

    const { data, error } = await query;
    if (error) {
      return fail(`Gagal membaca jurnal: ${error.message}`);
    }

    if (!Array.isArray(data)) {
      return fail("Respons jurnal tidak valid.");
    }

    for (const item of data) {
      const baris = petakanBaris(item);
      if (!baris) {
        return fail("Data jurnal tidak lengkap.");
      }
      hasil.push(baris);
    }

    if (data.length < UKURAN_HALAMAN) break;
  }

  return ok(hasil);
}

export async function listAkunAktif(
  supabase: SupabaseClient,
): Promise<Result<AkunRingkas[]>> {
  const { data, error } = await supabase
    .from("akun")
    .select("id, nomor, nama, peran")
    .eq("aktif", true)
    .order("nomor", { ascending: true });

  if (error) {
    return fail(`Gagal membaca akun: ${error.message}`);
  }
  if (!Array.isArray(data)) {
    return fail("Respons akun tidak valid.");
  }

  const hasil: AkunRingkas[] = [];
  for (const item of data) {
    if (!isRecord(item)) return fail("Data akun tidak lengkap.");
    const id = ambilTeks(item.id);
    const nomor = ambilTeks(item.nomor);
    const nama = ambilTeks(item.nama);
    const peran = ambilTeks(item.peran);
    if (!id || !nomor || !nama || !peran) {
      return fail("Data akun tidak lengkap.");
    }
    hasil.push({ id, nomor, nama, peran });
  }

  return ok(hasil);
}

export async function listPeriodeAkuntansi(
  supabase: SupabaseClient,
): Promise<Result<PeriodeLaporan[]>> {
  const { data, error } = await supabase
    .from("periode_akuntansi")
    .select("tahun, bulan")
    .order("tahun", { ascending: false })
    .order("bulan", { ascending: false });

  if (error) {
    return fail(`Gagal membaca periode akuntansi: ${error.message}`);
  }
  if (!Array.isArray(data)) {
    return fail("Respons periode akuntansi tidak valid.");
  }

  const hasil: PeriodeLaporan[] = [];
  for (const item of data) {
    if (!isRecord(item)) continue;
    const tahun = Number(item.tahun);
    const bulan = Number(item.bulan);
    if (!Number.isInteger(tahun) || !Number.isInteger(bulan)) continue;
    if (bulan < 1 || bulan > 12) continue;
    hasil.push(buatPeriode(tahun, bulan));
  }

  return ok(hasil);
}
