import { formatTanggal } from "@/modules/penggajian/karyawan/format";
import type {
  DaftarAktif,
  DataKaryawanInput,
  GajiPokok,
  GajiPokokInput,
  KaryawanBaruInput,
  KeadaanGajiPokok,
  TipeKaryawan,
} from "@/modules/penggajian/karyawan/types";

export type FieldErrors = Record<string, string>;

export const TIPE_KARYAWAN: readonly { value: TipeKaryawan; label: string }[] = [
  { value: "PRODUKSI", label: "Produksi" },
  { value: "NON_PRODUKSI", label: "Non-Produksi" },
];

const NIK_PATTERN = /^\d{16}$/;
const DIGITS_PATTERN = /^\d+$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isTanggalValid(value: string) {
  if (!ISO_DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

/** Accepts "2500000" or "2.500.000"; anything else is not a valid salary. */
export function parseNominal(value: string): number | null {
  const cleaned = value.replace(/[.\s]/g, "");
  if (!DIGITS_PATTERN.test(cleaned)) return null;
  const nominal = Number(cleaned);
  return Number.isSafeInteger(nominal) && nominal > 0 ? nominal : null;
}

export function validateNik(nik: string, nikTerpakai: readonly string[]): string | null {
  if (!nik) return "NIK wajib diisi.";
  if (!NIK_PATTERN.test(nik)) return "NIK harus 16 digit angka.";
  if (nikTerpakai.includes(nik)) return `NIK ${nik} sudah dipakai karyawan lain.`;
  return null;
}

function validateRekening(input: DataKaryawanInput, errors: FieldErrors) {
  const { namaBank, nomor, namaPemilik } = input.rekening;
  if (!namaBank) errors.rekeningNamaBank = "Nama bank rekening wajib diisi.";
  if (!nomor) errors.rekeningNomor = "Nomor rekening wajib diisi.";
  else if (!DIGITS_PATTERN.test(nomor)) {
    errors.rekeningNomor = "Nomor rekening hanya boleh berisi angka.";
  }
  if (!namaPemilik) errors.rekeningNamaPemilik = "Nama pemilik rekening wajib diisi.";
}

export function validateDataKaryawan(
  input: DataKaryawanInput,
  daftar: DaftarAktif,
): FieldErrors {
  const errors: FieldErrors = {};

  if (!input.nama) errors.nama = "Nama lengkap wajib diisi.";
  if (!daftar.jabatan.some((item) => item.id === input.jabatanId)) {
    errors.jabatanId = "Pilih jabatan dari daftar.";
  }
  if (!daftar.departemen.some((item) => item.id === input.departemenId)) {
    errors.departemenId = "Pilih departemen dari daftar.";
  }
  if (!TIPE_KARYAWAN.some((item) => item.value === input.tipe)) {
    errors.tipe = "Pilih tipe Produksi atau Non-Produksi.";
  }
  if (!daftar.ptkp.some((item) => item.kode === input.ptkpKode)) {
    const dikenal = daftar.ptkp.map((item) => item.kode).join(", ");
    errors.ptkpKode = input.ptkpKode
      ? `Kategori PTKP "${input.ptkpKode}" tidak dikenal. Kategori yang berlaku: ${dikenal}.`
      : `Status PTKP wajib dipilih. Kategori yang berlaku: ${dikenal}.`;
  }
  if (!input.tanggalMasuk) errors.tanggalMasuk = "Tanggal masuk wajib diisi.";
  else if (!isTanggalValid(input.tanggalMasuk)) {
    errors.tanggalMasuk = "Tanggal masuk tidak valid.";
  }
  validateRekening(input, errors);

  return errors;
}

export function validateGajiPokok(
  input: GajiPokokInput,
  riwayat: readonly GajiPokok[],
): FieldErrors {
  const errors: FieldErrors = {};

  if (!input.nominal) errors.nominal = "Gaji pokok wajib diisi.";
  else if (parseNominal(input.nominal) === null) {
    errors.nominal = "Gaji pokok harus berupa angka bulat lebih dari 0.";
  }

  if (!input.tanggalBerlaku) errors.tanggalBerlaku = "Tanggal berlaku wajib diisi.";
  else if (!isTanggalValid(input.tanggalBerlaku)) {
    errors.tanggalBerlaku = "Tanggal berlaku tidak valid.";
  } else if (riwayat.some((entri) => entri.tanggalBerlaku === input.tanggalBerlaku)) {
    errors.tanggalBerlaku = `Sudah ada gaji pokok yang berlaku pada ${formatTanggal(input.tanggalBerlaku)}. Pilih tanggal lain.`;
  }

  return errors;
}

export function validateKaryawanBaru(
  input: KaryawanBaruInput,
  daftar: DaftarAktif,
  nikTerpakai: readonly string[],
): FieldErrors {
  const errors = validateDataKaryawan(input, daftar);
  const nikError = validateNik(input.nik, nikTerpakai);
  if (nikError) errors.nik = nikError;

  const gajiErrors = validateGajiPokok(
    { nominal: input.gajiPokok, tanggalBerlaku: input.tanggalBerlaku },
    [],
  );
  if (gajiErrors.nominal) errors.gajiPokok = gajiErrors.nominal;
  if (gajiErrors.tanggalBerlaku) errors.tanggalBerlaku = gajiErrors.tanggalBerlaku;

  return errors;
}

export function validateNonaktif(tanggalKeluar: string): FieldErrors {
  if (!tanggalKeluar) return { tanggalKeluar: "Tanggal keluar wajib diisi." };
  if (!isTanggalValid(tanggalKeluar)) return { tanggalKeluar: "Tanggal keluar tidak valid." };
  return {};
}

/**
 * The newest entry whose date has been reached is in force; older reached
 * entries are superseded; future entries are scheduled.
 */
export function deriveKeadaanGaji(
  riwayat: readonly GajiPokok[],
  hariIni: string,
): Map<string, KeadaanGajiPokok> {
  const sudahBerlaku = riwayat
    .filter((entri) => entri.tanggalBerlaku <= hariIni)
    .sort((a, b) => b.tanggalBerlaku.localeCompare(a.tanggalBerlaku));
  const berlakuId = sudahBerlaku[0]?.id;

  return new Map(
    riwayat.map((entri) => [
      entri.id,
      entri.tanggalBerlaku > hariIni
        ? "dijadwalkan"
        : entri.id === berlakuId
          ? "berlaku"
          : "digantikan",
    ]),
  );
}

export function ringkasError(errors: FieldErrors): string {
  const jumlah = Object.keys(errors).length;
  return `Data belum bisa disimpan. Periksa ${jumlah} isian yang ditandai.`;
}
