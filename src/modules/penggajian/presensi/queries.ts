import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import type { SesiPenggajian } from "@/modules/penggajian/akun/akun";
import { hariIniJakarta } from "@/modules/penggajian/karyawan/format";
import { gagalBaca, periodeUntukTanggal, riwayatDokumen, semuaPeriode } from "@/modules/penggajian/periode/queries";
import type { PeriodeGaji } from "@/modules/penggajian/periode/types";
import { aksesPresensi } from "@/modules/penggajian/presensi/akses";
import type { KaryawanRingkas, Kehadiran, Lembur, Presensi, StatusEntri, SumberEntri } from "@/modules/penggajian/presensi/types";

/*
 * Reads go through presensi_aman, lembur_aman, karyawan_saya, and karyawan_aman
 * (migrations 0016 and 0017). The database returns only the rows the role may
 * see: HR everything, a Karyawan their own rows.
 */

export type OrangView = { id: string; nama: string; nik: string; departemen: string; jabatan: string };
export type PresensiView = Presensi & { orang: OrangView };
export type LemburView = Lembur & { orang: OrangView; periode: PeriodeGaji | undefined };

type BarisPresensi = {
  id: string;
  dokumen_id: string;
  status: Exclude<StatusEntri, "DIBATALKAN">;
  karyawan_id: string;
  tanggal: string;
  kehadiran: Kehadiran;
  jam_masuk: string | null;
  jam_pulang: string | null;
  keterangan: string | null;
  sumber: SumberEntri;
  created_by: string | null;
  created_by_nama: string;
  created_at: string;
};

type BarisLembur = {
  id: string;
  dokumen_id: string;
  status: StatusEntri;
  karyawan_id: string;
  tanggal: string;
  menit: number;
  nomor_spl: string;
  keterangan: string;
  sumber: SumberEntri;
  created_by: string;
  created_by_nama: string;
  created_at: string;
};

const KOLOM_PRESENSI =
  "id, dokumen_id, status, karyawan_id, tanggal, kehadiran, jam_masuk, jam_pulang, keterangan, sumber, created_by, created_by_nama, created_at";
const KOLOM_LEMBUR =
  "id, dokumen_id, status, karyawan_id, tanggal, menit, nomor_spl, keterangan, sumber, created_by, created_by_nama, created_at";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function orang(k: KaryawanRingkas): OrangView {
  return { id: k.id, nama: k.nama, nik: k.nik, departemen: k.departemen, jabatan: k.jabatan };
}

/** Employees the session may see, in NIK order: HR all, a Karyawan only themself. */
export async function listKaryawanTerlihat(sesi: SesiPenggajian, client?: SupabaseClient): Promise<KaryawanRingkas[]> {
  const supabase = client ?? (await createClient());
  if (aksesPresensi(sesi).mandiri) {
    const { data, error } = await supabase
      .from("karyawan_saya")
      .select("id, nik, nama, status, departemen, jabatan")
      .returns<KaryawanRingkas[]>();
    if (error) gagalBaca(error);
    return data;
  }
  if (sesi.peran !== "HR") return [];
  const [k, dep, jab] = await Promise.all([
    supabase
      .from("karyawan_aman")
      .select("id, nik, nama, status, departemen_id, jabatan_id")
      .returns<{ id: string; nik: string; nama: string; status: KaryawanRingkas["status"]; departemen_id: string; jabatan_id: string }[]>(),
    supabase.from("departemen").select("id, nama"),
    supabase.from("jabatan").select("id, nama"),
  ]);
  if (k.error || dep.error || jab.error) gagalBaca(k.error ?? dep.error ?? jab.error);
  const nama = (daftar: { id: string; nama: string }[], id: string) => daftar.find((row) => row.id === id)?.nama ?? "—";
  return k.data
    .map((row) => ({
      id: row.id,
      nik: row.nik,
      nama: row.nama,
      status: row.status,
      departemen: nama(dep.data, row.departemen_id),
      jabatan: nama(jab.data, row.jabatan_id),
    }))
    .sort((a, b) => a.nik.localeCompare(b.nik));
}

export async function listKaryawanAktifUntukCatat(sesi: SesiPenggajian): Promise<OrangView[]> {
  return (await listKaryawanTerlihat(sesi)).filter((k) => k.status === "AKTIF").map(orang);
}

export async function cariKaryawanTerlihat(sesi: SesiPenggajian, id: string, client?: SupabaseClient): Promise<KaryawanRingkas | undefined> {
  return (await listKaryawanTerlihat(sesi, client)).find((k) => k.id === id);
}

export async function listPeriode(): Promise<PeriodeGaji[]> {
  return (await semuaPeriode()).reverse();
}

export async function getPeriodeDipilih(id: string | undefined, now: Date = new Date()): Promise<PeriodeGaji | undefined> {
  const semua = await semuaPeriode();
  return (id && semua.find((p) => p.id === id)) || periodeUntukTanggal(semua, hariIniJakarta(now)) || semua.at(-1);
}

async function muatPresensi(supabase: SupabaseClient, filter: (q: ReturnType<typeof dasarPresensi>) => ReturnType<typeof dasarPresensi>) {
  const { data: mentah, error } = await filter(dasarPresensi(supabase));
  if (error) gagalBaca(error);
  const data = (mentah ?? []) as unknown as BarisPresensi[];
  const riwayat = await riwayatDokumen(supabase, data.map((row) => row.dokumen_id));
  return data.map((row): Presensi => ({
    id: row.id,
    karyawanId: row.karyawan_id,
    tanggal: row.tanggal,
    kehadiran: row.kehadiran,
    jamMasuk: row.jam_masuk,
    jamPulang: row.jam_pulang,
    ...(row.keterangan ? { keterangan: row.keterangan } : {}),
    status: row.status,
    sumber: row.sumber,
    pencatatProfileId: row.created_by ?? "impor",
    dicatatOleh: row.created_by_nama,
    dicatatPada: row.created_at,
    riwayat: riwayat.get(row.dokumen_id) ?? [],
  }));
}

function dasarPresensi(supabase: SupabaseClient) {
  return supabase.from("presensi_aman").select(KOLOM_PRESENSI);
}

async function muatLembur(supabase: SupabaseClient, filter: (q: ReturnType<typeof dasarLembur>) => ReturnType<typeof dasarLembur>) {
  const { data: mentah, error } = await filter(dasarLembur(supabase));
  if (error) gagalBaca(error);
  const data = (mentah ?? []) as unknown as BarisLembur[];
  const riwayat = await riwayatDokumen(supabase, data.map((row) => row.dokumen_id));
  return data.map((row): Lembur => ({
    id: row.id,
    karyawanId: row.karyawan_id,
    tanggal: row.tanggal,
    menit: row.menit,
    nomorSpl: row.nomor_spl,
    keterangan: row.keterangan,
    status: row.status,
    sumber: row.sumber,
    pencatatProfileId: row.created_by,
    pemohonProfileId: row.created_by,
    dicatatOleh: row.created_by_nama,
    dicatatPada: row.created_at,
    riwayat: riwayat.get(row.dokumen_id) ?? [],
  }));
}

function dasarLembur(supabase: SupabaseClient) {
  return supabase.from("lembur_aman").select(KOLOM_LEMBUR);
}

export async function listPresensi(sesi: SesiPenggajian, periode: PeriodeGaji): Promise<PresensiView[]> {
  const supabase = await createClient();
  const [rows, orangList] = await Promise.all([
    muatPresensi(supabase, (q) => q.gte("tanggal", periode.mulai).lte("tanggal", periode.selesai)),
    listKaryawanTerlihat(sesi, supabase),
  ]);
  return rows
    .flatMap((row) => {
      const k = orangList.find((o) => o.id === row.karyawanId);
      return k ? [{ ...row, orang: orang(k) }] : [];
    })
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal) || a.orang.nik.localeCompare(b.orang.nik));
}

export async function listLembur(sesi: SesiPenggajian, periode?: PeriodeGaji): Promise<LemburView[]> {
  const supabase = await createClient();
  const [rows, orangList, semua] = await Promise.all([
    muatLembur(supabase, (q) => (periode ? q.gte("tanggal", periode.mulai).lte("tanggal", periode.selesai) : q)),
    listKaryawanTerlihat(sesi, supabase),
    semuaPeriode(supabase),
  ]);
  return rows
    .flatMap((row) => {
      const k = orangList.find((o) => o.id === row.karyawanId);
      return k ? [{ ...row, orang: orang(k), periode: periodeUntukTanggal(semua, row.tanggal) }] : [];
    })
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal));
}

export async function getLembur(sesi: SesiPenggajian, id: string): Promise<LemburView | null> {
  if (!UUID.test(id)) return null;
  const supabase = await createClient();
  const [rows, orangList, semua] = await Promise.all([
    muatLembur(supabase, (q) => q.eq("id", id)),
    listKaryawanTerlihat(sesi, supabase),
    semuaPeriode(supabase),
  ]);
  const row = rows[0];
  const k = row && orangList.find((o) => o.id === row.karyawanId);
  return row && k ? { ...row, orang: orang(k), periode: periodeUntukTanggal(semua, row.tanggal) } : null;
}

/** Overtime already on that date, for the daily cap message before the database checks it. */
export async function lemburPadaTanggal(karyawanId: string, tanggal: string): Promise<Lembur[]> {
  const supabase = await createClient();
  return muatLembur(supabase, (q) => q.eq("karyawan_id", karyawanId).eq("tanggal", tanggal));
}

export async function cariPresensi(karyawanId: string, tanggal: string): Promise<Presensi | undefined> {
  const supabase = await createClient();
  return (await muatPresensi(supabase, (q) => q.eq("karyawan_id", karyawanId).eq("tanggal", tanggal)))[0];
}

export type PresensiHariIni = {
  tanggal: string;
  orang: OrangView;
  periode: PeriodeGaji | undefined;
  presensi: Presensi | undefined;
  riwayat: Presensi[];
};

export async function getPresensiHariIni(sesi: SesiPenggajian, now: Date = new Date()): Promise<PresensiHariIni | null> {
  if (!sesi.karyawanId) return null;
  const supabase = await createClient();
  const [diri, semua, riwayat] = await Promise.all([
    listKaryawanTerlihat(sesi, supabase),
    semuaPeriode(supabase),
    muatPresensi(supabase, (q) => q.eq("karyawan_id", sesi.karyawanId as string).order("tanggal", { ascending: false }).limit(10)),
  ]);
  const karyawan = diri.find((k) => k.id === sesi.karyawanId);
  if (!karyawan) return null;
  const tanggal = hariIniJakarta(now);
  return {
    tanggal,
    orang: orang(karyawan),
    periode: periodeUntukTanggal(semua, tanggal),
    presensi: riwayat.find((row) => row.tanggal === tanggal),
    riwayat,
  };
}
