import { daftarAktif, semuaKaryawan } from "@/modules/penggajian/karyawan/store";
import type { DataKaryawanHitung } from "@/modules/penggajian/payroll/hitung";
import type { PeriodeGaji } from "@/modules/penggajian/periode/types";
import { semuaLembur, semuaPresensi } from "@/modules/penggajian/presensi/store";
import { aktifDalamPeriode } from "@/modules/penggajian/rekap/queries";

/** Collects the validated inputs for one period; the calculation itself stays pure. */
export function dataHitung(periode: PeriodeGaji): DataKaryawanHitung[] {
  const dalam = (row: { karyawanId: string; tanggal: string; status: string }, id: string) =>
    row.karyawanId === id && row.tanggal >= periode.mulai && row.tanggal <= periode.selesai && row.status === "TERVALIDASI";
  return semuaKaryawan()
    .filter((k) => aktifDalamPeriode(k, periode))
    .sort((a, b) => a.nik.localeCompare(b.nik))
    .map((k) => {
      const presensi = semuaPresensi().filter((p) => dalam(p, k.id));
      const gaji = [...k.gajiPokok]
        .filter((g) => g.tanggalBerlaku <= periode.selesai)
        .sort((a, b) => b.tanggalBerlaku.localeCompare(a.tanggalBerlaku))[0];
      return {
        id: k.id,
        nama: k.nama,
        nik: k.nik,
        departemen: daftarAktif().departemen.find((d) => d.id === k.departemenId)?.nama ?? "—",
        jabatanId: k.jabatanId,
        ptkpKode: k.ptkpKode,
        tanggalMasuk: k.tanggalMasuk,
        tanggalKeluar: k.tanggalKeluar,
        gajiPokok: gaji?.nominal ?? null,
        hariHadir: presensi.filter((p) => p.kehadiran === "HADIR").length,
        hariAlpha: presensi.filter((p) => p.kehadiran === "ALPHA").length,
        adaPresensiTervalidasi: presensi.length > 0,
        lembur: semuaLembur().filter((l) => dalam(l, k.id)).map((l) => ({ tanggal: l.tanggal, menit: l.menit })),
      };
    });
}
