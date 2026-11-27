import { createClient } from "@/lib/supabase/server";
import type { DataKaryawanHitung } from "@/modules/penggajian/payroll/hitung";
import { gagalBaca } from "@/modules/penggajian/periode/queries";
import type { PeriodeGaji } from "@/modules/penggajian/periode/types";

type BarisKaryawan = {
  id: string;
  nama: string;
  nik: string;
  departemen_id: string;
  jabatan_id: string;
  ptkp_kode: string;
  status: "AKTIF" | "NONAKTIF";
  tanggal_masuk: string;
  tanggal_keluar: string | null;
};

/** Active at any point of the period: joined before it ends and left after it starts. */
function aktifDalamPeriode(k: BarisKaryawan, periode: PeriodeGaji): boolean {
  if (k.tanggal_masuk > periode.selesai) return false;
  if (k.tanggal_keluar && k.tanggal_keluar < periode.mulai) return false;
  return k.status === "AKTIF" || Boolean(k.tanggal_keluar);
}

/**
 * Collects the validated inputs for one period from the HR views (0016, 0017);
 * the calculation itself stays pure in hitung.ts.
 */
export async function dataHitung(periode: PeriodeGaji): Promise<DataKaryawanHitung[]> {
  const supabase = await createClient();
  const [k, dep, gaji, presensi, lembur] = await Promise.all([
    supabase
      .from("karyawan_aman")
      .select("id, nama, nik, departemen_id, jabatan_id, ptkp_kode, status, tanggal_masuk, tanggal_keluar")
      .returns<BarisKaryawan[]>(),
    supabase.from("departemen").select("id, nama"),
    supabase.from("gaji_pokok_aman").select("karyawan_id, nominal::text, tanggal_berlaku").lte("tanggal_berlaku", periode.selesai),
    supabase
      .from("presensi_aman")
      .select("karyawan_id, kehadiran")
      .eq("status", "TERVALIDASI")
      .gte("tanggal", periode.mulai)
      .lte("tanggal", periode.selesai),
    supabase
      .from("lembur_aman")
      .select("karyawan_id, tanggal, menit")
      .eq("status", "TERVALIDASI")
      .gte("tanggal", periode.mulai)
      .lte("tanggal", periode.selesai),
  ]);
  const error = k.error ?? dep.error ?? gaji.error ?? presensi.error ?? lembur.error;
  if (error || !k.data || !dep.data || !gaji.data || !presensi.data || !lembur.data) gagalBaca(error);
  const [depData, gajiData, presensiData, lemburData] = [dep.data, gaji.data, presensi.data, lembur.data];
  return k.data
    .filter((row) => aktifDalamPeriode(row, periode))
    .sort((a, b) => a.nik.localeCompare(b.nik))
    .map((row) => {
      const milik = presensiData.filter((p) => p.karyawan_id === row.id);
      const berlaku = gajiData
        .filter((g) => g.karyawan_id === row.id)
        .sort((a, b) => String(b.tanggal_berlaku).localeCompare(String(a.tanggal_berlaku)))[0];
      return {
        id: row.id,
        nama: row.nama,
        nik: row.nik,
        departemen: depData.find((d) => d.id === row.departemen_id)?.nama ?? "—",
        jabatanId: row.jabatan_id,
        ptkpKode: row.ptkp_kode,
        tanggalMasuk: row.tanggal_masuk,
        tanggalKeluar: row.tanggal_keluar,
        // A monthly salary is far below 2^53; it travels as text (ISSUE-001 F13).
        gajiPokok: berlaku ? Number(berlaku.nominal) : null,
        hariHadir: milik.filter((p) => p.kehadiran === "HADIR").length,
        hariAlpha: milik.filter((p) => p.kehadiran === "ALPHA").length,
        adaPresensiTervalidasi: milik.length > 0,
        lembur: lemburData.filter((l) => l.karyawan_id === row.id).map((l) => ({ tanggal: l.tanggal as string, menit: l.menit as number })),
      };
    });
}
