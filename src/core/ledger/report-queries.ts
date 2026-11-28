import type { SupabaseClient } from "@supabase/supabase-js";

import { readAllPages } from "@/core/dashboard/pagination";
import { ambilTeks } from "@/lib/ambil-teks";
import { fail, ok, type Result } from "@/lib/result";
import { isRecord } from "@/lib/validation";
import { buatPeriode, type PeriodeLaporan } from "./periode";
import type { AkunRingkas, BarisLaporan } from "./report";

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

const OPSI_TEKS_LAPORAN = { coerceNumber: true, onlyFiniteNumbers: true } as const;

function petakanBaris(value: unknown): BarisLaporan | null {
  if (!isRecord(value) || !isRecord(value.jurnal) || !isRecord(value.akun)) {
    return null;
  }

  const jurnal = value.jurnal;
  const akun = value.akun;

  const barisId = ambilTeks(value.id, OPSI_TEKS_LAPORAN);
  const jurnalId = ambilTeks(jurnal.id, OPSI_TEKS_LAPORAN);
  const tanggal = ambilTeks(jurnal.tanggal, OPSI_TEKS_LAPORAN);
  const dibuatPada = ambilTeks(jurnal.created_at, OPSI_TEKS_LAPORAN);
  const sumberTipe = ambilTeks(jurnal.sumber_tipe, OPSI_TEKS_LAPORAN);
  const sumberNomor = ambilTeks(jurnal.sumber_nomor, OPSI_TEKS_LAPORAN);
  const sumberPemicu = ambilTeks(jurnal.sumber_pemicu, OPSI_TEKS_LAPORAN);
  const akunId = ambilTeks(akun.id, OPSI_TEKS_LAPORAN);
  const akunNomor = ambilTeks(akun.nomor, OPSI_TEKS_LAPORAN);
  const akunNama = ambilTeks(akun.nama, OPSI_TEKS_LAPORAN);
  const akunPeran = ambilTeks(akun.peran, OPSI_TEKS_LAPORAN);
  const debit = ambilTeks(value.debit, OPSI_TEKS_LAPORAN);
  const kredit = ambilTeks(value.kredit, OPSI_TEKS_LAPORAN);

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
  let kegagalanHalaman: "respons" | "data" | null = null;

  const { data, error } = await readAllPages(async (from, to) => {
    let query = supabase
      .from("detail_jurnal")
      .select(SELECT_BARIS)
      .order("tanggal", { referencedTable: "jurnal", ascending: true })
      .order("id", { ascending: true })
      .range(from, to);

    if (filter.mulai) query = query.gte("jurnal.tanggal", filter.mulai);
    if (filter.selesai) query = query.lt("jurnal.tanggal", filter.selesai);
    if (filter.akunId) query = query.eq("akun_id", filter.akunId);

    const halaman = await query;
    if (halaman.error) {
      return { data: null, error: { message: halaman.error.message } };
    }
    if (!Array.isArray(halaman.data)) {
      kegagalanHalaman = "respons";
      return { data: null, error: { message: "Respons jurnal tidak valid." } };
    }

    const barisHalaman: BarisLaporan[] = [];
    for (const item of halaman.data) {
      const baris = petakanBaris(item);
      if (!baris) {
        kegagalanHalaman = "data";
        return { data: null, error: { message: "Data jurnal tidak lengkap." } };
      }
      barisHalaman.push(baris);
    }
    return { data: barisHalaman, error: null };
  });

  if (error) {
    if (kegagalanHalaman === "respons") {
      return fail("Respons jurnal tidak valid.");
    }
    if (kegagalanHalaman === "data") {
      return fail("Data jurnal tidak lengkap.");
    }
    return fail(`Gagal membaca jurnal: ${error}`);
  }

  return ok(data as BarisLaporan[]);
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
    const id = ambilTeks(item.id, OPSI_TEKS_LAPORAN);
    const nomor = ambilTeks(item.nomor, OPSI_TEKS_LAPORAN);
    const nama = ambilTeks(item.nama, OPSI_TEKS_LAPORAN);
    const peran = ambilTeks(item.peran, OPSI_TEKS_LAPORAN);
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
