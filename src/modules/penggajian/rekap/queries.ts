import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import type { SesiPenggajian } from "@/modules/penggajian/akun/akun";
import { gagalBaca, riwayatDokumen } from "@/modules/penggajian/periode/queries";
import type { PeriodeGaji, ValidasiDepartemen } from "@/modules/penggajian/periode/types";
import type { Kehadiran, Lembur, Presensi } from "@/modules/penggajian/presensi/types";

/*
 * Recap from karyawan_rekap, presensi_aman and lembur_aman (migrations 0017,
 * 0018). The database returns every employee to HR and only the assigned
 * departments to a Supervisor; NIK stays hidden from the Supervisor.
 */

export type RekapKaryawan = {
  id: string;
  nama: string;
  nik: string;
  departemenId: string;
  jumlah: Record<Kehadiran, number>;
  lemburMenit: number;
  nomorSpl: string[];
  /** Hadir rows without a clock-out: the recap cannot be saved with them. */
  belumLengkap: string[];
  tanpaEntri: boolean;
  presensi: Presensi[];
  lembur: Lembur[];
};

export type RekapDepartemen = {
  id: string;
  nama: string;
  karyawan: RekapKaryawan[];
  validasi: ValidasiDepartemen | undefined;
};

export type AksesRekap = { bolehMembaca: boolean; hr: boolean; departemenIds: readonly string[] };

type BarisKaryawan = {
  id: string;
  nama: string;
  nik: string | null;
  departemen_id: string;
  departemen: string;
  status: "AKTIF" | "NONAKTIF";
  tanggal_masuk: string;
  tanggal_keluar: string | null;
};

/** HR reads every department; a Supervisor the departments assigned to them (Q-01). */
export async function aksesRekap(sesi: SesiPenggajian): Promise<AksesRekap> {
  const hr = sesi.peran === "HR";
  if (sesi.peran !== "Supervisor Lapangan") return { bolehMembaca: hr, hr, departemenIds: [] };
  const supabase = await createClient();
  const { data, error } = await supabase.from("departemen").select("id").eq("supervisor_id", sesi.profileId);
  if (error) gagalBaca(error);
  const departemenIds = data.map((row) => row.id as string);
  return { bolehMembaca: departemenIds.length > 0, hr: false, departemenIds };
}

/** Active at any point of the period: joined before it ends and left after it starts. */
function aktifDalamPeriode(k: BarisKaryawan, periode: PeriodeGaji): boolean {
  if (k.tanggal_masuk > periode.selesai) return false;
  if (k.tanggal_keluar && k.tanggal_keluar < periode.mulai) return false;
  return k.status === "AKTIF" || Boolean(k.tanggal_keluar);
}

async function muatEntri(supabase: SupabaseClient, periode: PeriodeGaji) {
  const [p, l] = await Promise.all([
    supabase
      .from("presensi_aman")
      .select("id, dokumen_id, status, karyawan_id, tanggal, kehadiran, jam_masuk, jam_pulang, keterangan, sumber, created_by, created_by_nama, created_at")
      .gte("tanggal", periode.mulai)
      .lte("tanggal", periode.selesai),
    supabase
      .from("lembur_aman")
      .select("id, dokumen_id, status, karyawan_id, tanggal, menit, nomor_spl, keterangan, sumber, created_by, created_by_nama, created_at")
      .gte("tanggal", periode.mulai)
      .lte("tanggal", periode.selesai),
  ]);
  if (p.error || l.error) gagalBaca(p.error ?? l.error);
  const riwayat = await riwayatDokumen(supabase, [...p.data, ...l.data].map((row) => row.dokumen_id as string));
  const presensi: Presensi[] = p.data.map((r) => ({
    id: r.id, karyawanId: r.karyawan_id, tanggal: r.tanggal, kehadiran: r.kehadiran, jamMasuk: r.jam_masuk, jamPulang: r.jam_pulang,
    ...(r.keterangan ? { keterangan: r.keterangan } : {}),
    status: r.status, sumber: r.sumber, pencatatProfileId: r.created_by ?? "impor", dicatatOleh: r.created_by_nama, dicatatPada: r.created_at,
    riwayat: riwayat.get(r.dokumen_id) ?? [],
  }));
  const lembur: Lembur[] = l.data.map((r) => ({
    id: r.id, karyawanId: r.karyawan_id, tanggal: r.tanggal, menit: r.menit, nomorSpl: r.nomor_spl, keterangan: r.keterangan,
    status: r.status, sumber: r.sumber, pencatatProfileId: r.created_by, pemohonProfileId: r.created_by,
    dicatatOleh: r.created_by_nama, dicatatPada: r.created_at, riwayat: riwayat.get(r.dokumen_id) ?? [],
  }));
  return { presensi, lembur };
}

function rekapKaryawan(k: BarisKaryawan, presensiSemua: Presensi[], lemburSemua: Lembur[]): RekapKaryawan {
  const presensi = presensiSemua.filter((row) => row.karyawanId === k.id).sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  const lembur = lemburSemua.filter((row) => row.karyawanId === k.id && row.status !== "DIBATALKAN");
  const jumlah = { HADIR: 0, IZIN: 0, SAKIT: 0, ALPHA: 0, CUTI: 0 };
  for (const row of presensi) jumlah[row.kehadiran] += 1;
  return {
    id: k.id,
    nama: k.nama,
    nik: k.nik ?? "",
    departemenId: k.departemen_id,
    jumlah,
    lemburMenit: lembur.reduce((total, row) => total + row.menit, 0),
    nomorSpl: lembur.map((row) => row.nomorSpl),
    belumLengkap: presensi.filter((row) => row.kehadiran === "HADIR" && !row.jamPulang).map((row) => row.tanggal),
    tanpaEntri: presensi.length === 0,
    presensi,
    lembur,
  };
}

/** Departments with at least one active employee in the period (AC-11), as the session may see them. */
export async function getRekap(sesi: SesiPenggajian, periode: PeriodeGaji): Promise<RekapDepartemen[]> {
  const akses = await aksesRekap(sesi);
  if (!akses.bolehMembaca) return [];
  const supabase = await createClient();
  const [k, entri] = await Promise.all([
    supabase
      .from("karyawan_rekap")
      .select("id, nama, nik, departemen_id, departemen, status, tanggal_masuk, tanggal_keluar")
      .returns<BarisKaryawan[]>(),
    muatEntri(supabase, periode),
  ]);
  if (k.error) gagalBaca(k.error);
  const aktif = k.data.filter((row) => aktifDalamPeriode(row, periode)).sort((a, b) => (a.nik ?? a.nama).localeCompare(b.nik ?? b.nama));
  const departemen = new Map<string, string>();
  for (const row of aktif) departemen.set(row.departemen_id, row.departemen);
  return [...departemen.entries()]
    .sort((a, b) => a[1].localeCompare(b[1]))
    .map(([id, nama]) => ({
      id,
      nama,
      karyawan: aktif.filter((row) => row.departemen_id === id).map((row) => rekapKaryawan(row, entri.presensi, entri.lembur)),
      validasi: periode.validasi.find((v) => v.departemenId === id),
    }));
}

export async function getRekapKaryawan(sesi: SesiPenggajian, periode: PeriodeGaji, karyawanId: string) {
  for (const dep of await getRekap(sesi, periode)) {
    const row = dep.karyawan.find((k) => k.id === karyawanId);
    if (row) return { departemen: dep, karyawan: row };
  }
  return null;
}
