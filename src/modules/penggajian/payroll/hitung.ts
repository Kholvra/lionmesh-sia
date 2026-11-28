import type { Result } from "@/lib/result";
import { formatTanggal } from "@/modules/penggajian/karyawan/format";
import type { PeriodeGaji } from "@/modules/penggajian/periode/types";
import { cariTarifTer, KATEGORI_PTKP } from "@/modules/penggajian/payroll/tarif-ter";
import { versiBerlaku } from "@/modules/penggajian/payroll/tarif";
import type { TabelTarif } from "@/modules/penggajian/payroll/tarif";
import type { BarisGaji, KaryawanDitandai, Komponen, KodeKomponen } from "@/modules/penggajian/payroll/types";
import { hariKerja, hariLibur } from "@/modules/penggajian/shared/kalender";

/** Everything the calculation reads, already filtered to validated rows. Pure input, no I/O. */
export type DataKaryawanHitung = {
  id: string;
  nama: string;
  nik: string;
  departemen: string;
  jabatanId: string;
  ptkpKode: string;
  tanggalMasuk: string;
  tanggalKeluar: string | null;
  gajiPokok: number | null;
  hariHadir: number;
  hariAlpha: number;
  adaPresensiTervalidasi: boolean;
  lembur: readonly { tanggal: string; menit: number }[];
};

export type HasilHitung = {
  baris: BarisGaji[];
  ditandai: KaryawanDitandai[];
  versiTarif: Record<string, string>;
};

const LABEL: Record<KodeKomponen, string> = {
  GAJI_POKOK: "Gaji pokok",
  TUNJANGAN_TETAP: "Tunjangan tetap",
  TUNJANGAN_KEHADIRAN: "Tunjangan kehadiran",
  LEMBUR: "Uang lembur",
  POTONGAN_KETIDAKHADIRAN: "Potongan ketidakhadiran",
  BPJS_JHT: "BPJS Ketenagakerjaan JHT",
  BPJS_JP: "BPJS Ketenagakerjaan JP",
  BPJS_KESEHATAN: "BPJS Kesehatan",
  PPH21: "PPh Pasal 21 (TER)",
};

const JENIS: Record<KodeKomponen, "tambah" | "kurang"> = {
  GAJI_POKOK: "tambah", TUNJANGAN_TETAP: "tambah", TUNJANGAN_KEHADIRAN: "tambah", LEMBUR: "tambah",
  POTONGAN_KETIDAKHADIRAN: "kurang", BPJS_JHT: "kurang", BPJS_JP: "kurang", BPJS_KESEHATAN: "kurang", PPH21: "kurang",
};

function komponen(kode: KodeKomponen, nilaiMentah: number, dasar: string, versiTarif: string | null): Komponen {
  return { kode, label: LABEL[kode], jenis: JENIS[kode], nilaiMentah, nilai: Math.round(nilaiMentah), dasar, versiTarif };
}

const rp = (n: number) => `Rp${Math.round(n).toLocaleString("id-ID")}`;

/** Totals and rounding difference are always derived from the components, never stored apart. */
export function rangkum(baris: Omit<BarisGaji, "bruto" | "totalTambah" | "totalKurang" | "neto" | "selisihPembulatan">): BarisGaji {
  const jumlah = (jenis: "tambah" | "kurang", nilai: (k: Komponen) => number) =>
    baris.komponen.filter((k) => k.jenis === jenis).reduce((t, k) => t + nilai(k), 0);
  const totalTambah = jumlah("tambah", (k) => k.nilai);
  const totalKurang = jumlah("kurang", (k) => k.nilai);
  const neto = totalTambah - totalKurang;
  const netoMentah = jumlah("tambah", (k) => k.nilaiMentah) - jumlah("kurang", (k) => k.nilaiMentah);
  return {
    ...baris,
    bruto: totalTambah,
    totalTambah,
    totalKurang,
    neto,
    selisihPembulatan: Math.round((netoMentah - neto) * 100) / 100,
  };
}

function hariAktif(k: DataKaryawanHitung, periode: PeriodeGaji): number {
  const mulai = k.tanggalMasuk > periode.mulai ? k.tanggalMasuk : periode.mulai;
  const selesai = k.tanggalKeluar && k.tanggalKeluar < periode.selesai ? k.tanggalKeluar : periode.selesai;
  return mulai > selesai ? 0 : hariKerja(mulai, selesai).length;
}

/**
 * GJ-004 calculation. Fails as a whole when a table, PTKP category, base
 * salary, or overtime rate is missing (AC-04, AC-14); an employee without
 * validated attendance is flagged and gets no numbers (AC-10).
 */
export function hitungPayroll(periode: PeriodeGaji, data: readonly DataKaryawanHitung[], tarif: TabelTarif): Result<HasilHitung> {
  const akhir = periode.selesai;
  const ter = versiBerlaku(tarif.ter, akhir);
  const bpjs = versiBerlaku(tarif.bpjs, akhir);
  const lembur = versiBerlaku(tarif.lemburHariKerja, akhir);
  const perusahaan = versiBerlaku(tarif.perusahaan, akhir);
  const hilang = [!ter && "tarif_ter", !bpjs && "tarif_bpjs", !lembur && "tarif_lembur", !perusahaan && "parameter perusahaan"].filter(Boolean);
  if (!ter || !bpjs || !lembur || !perusahaan) {
    return { ok: false, message: `Tidak ada versi ${hilang.join(", ")} yang berlaku sampai ${formatTanggal(akhir)} (periode ${periode.nama}). Draft tidak disimpan.` };
  }

  const hariPeriode = hariKerja(periode.mulai, periode.selesai).length;
  const pajakAkhirTahun = periode.selesai.slice(5, 7) === "12";
  const baris: BarisGaji[] = [];
  const ditandai: KaryawanDitandai[] = [];

  for (const k of data) {
    if (!k.adaPresensiTervalidasi) {
      ditandai.push({ karyawanId: k.id, nama: k.nama, nik: k.nik, alasan: "Tidak ada presensi tervalidasi pada periode ini." });
      continue;
    }
    if (k.gajiPokok === null) return { ok: false, message: `Gaji pokok ${k.nama} (NIK ${k.nik}) tidak ada untuk periode ${periode.nama}. Draft tidak disimpan.` };
    const kategori = KATEGORI_PTKP[k.ptkpKode];
    if (!kategori) return { ok: false, message: `Kategori PTKP ${k.ptkpKode} milik ${k.nama} tidak ada di tabel TER. Draft tidak disimpan.` };
    const libur = k.lembur.find((l) => hariLibur(l.tanggal));
    if (libur) {
      return { ok: false, message: `Lembur ${k.nama} pada ${formatTanggal(libur.tanggal)} jatuh di hari istirahat; tabel tarif lembur hari istirahat belum ada. Draft tidak disimpan.` };
    }

    const tunjanganPenuh = perusahaan.nilai.tunjanganTetapPerJabatan[k.jabatanId] ?? 0;
    const upahPenuh = k.gajiPokok + tunjanganPenuh;
    const aktif = hariAktif(k, periode);
    const faktor = aktif / hariPeriode;
    const prorata = aktif < hariPeriode ? `, prorata ${aktif}/${hariPeriode} hari kerja` : "";
    const gaji = k.gajiPokok * faktor;
    const tunjangan = tunjanganPenuh * faktor;
    const dasar = gaji + tunjangan;
    const upahSejam = upahPenuh / lembur.nilai.pembagiUpahSejam;
    const nilaiLembur = k.lembur.reduce((total, l) => {
      const pertama = Math.min(l.menit, 60);
      return total + upahSejam * ((pertama / 60) * lembur.nilai.pengaliJamPertama + ((l.menit - pertama) / 60) * lembur.nilai.pengaliJamBerikutnya);
    }, 0);
    const menitLembur = k.lembur.reduce((t, l) => t + l.menit, 0);
    const b = bpjs.nilai;

    const tambah = [
      komponen("GAJI_POKOK", gaji, `${rp(k.gajiPokok)}${prorata}`, null),
      komponen("TUNJANGAN_TETAP", tunjangan, `${rp(tunjanganPenuh)}${prorata}`, perusahaan.versi),
      komponen("TUNJANGAN_KEHADIRAN", k.hariHadir * perusahaan.nilai.tunjanganKehadiranPerHari, `${k.hariHadir} hari hadir × ${rp(perusahaan.nilai.tunjanganKehadiranPerHari)}`, perusahaan.versi),
      komponen("LEMBUR", nilaiLembur, `${menitLembur} menit, upah sejam ${rp(upahSejam)} (1/${lembur.nilai.pembagiUpahSejam})`, lembur.versi),
    ];
    const bruto = tambah.reduce((t, c) => t + c.nilai, 0);
    const persenTer = cariTarifTer(ter.nilai[kategori], bruto);
    const kurang = [
      komponen("POTONGAN_KETIDAKHADIRAN", (upahPenuh / hariPeriode) * k.hariAlpha, `${k.hariAlpha} hari Alpha × upah harian`, perusahaan.versi),
      komponen("BPJS_JHT", (dasar * b.jhtPekerjaPersen) / 100, `${b.jhtPekerjaPersen}% × ${rp(dasar)}`, bpjs.versi),
      komponen("BPJS_JP", (Math.min(dasar, b.jpBatasUpah) * b.jpPekerjaPersen) / 100, `${b.jpPekerjaPersen}% × min(${rp(dasar)}, ${rp(b.jpBatasUpah)})`, bpjs.versi),
      komponen("BPJS_KESEHATAN", (Math.min(dasar, b.kesehatanBatasUpah) * b.kesehatanPekerjaPersen) / 100, `${b.kesehatanPekerjaPersen}% × min(${rp(dasar)}, ${rp(b.kesehatanBatasUpah)})`, bpjs.versi),
      komponen("PPH21", (bruto * persenTer) / 100, `Kategori ${kategori} (${k.ptkpKode}), ${persenTer}% × bruto ${rp(bruto)}`, ter.versi),
    ];
    baris.push(
      rangkum({
        karyawanId: k.id, nama: k.nama, nik: k.nik, departemen: k.departemen,
        komponen: [...tambah, ...kurang], perluPenyesuaianTahunan: pajakAkhirTahun,
      }),
    );
  }

  return {
    ok: true,
    data: {
      baris,
      ditandai,
      versiTarif: { tarif_ter: ter.versi, tarif_bpjs: bpjs.versi, tarif_lembur: lembur.versi, parameter_perusahaan: perusahaan.versi },
    },
  };
}
