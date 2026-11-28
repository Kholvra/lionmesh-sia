import { isoWaktuJakarta } from "../../lib/format/date.ts";
import type { Result } from "@/lib/result";

export const NAMA_BULAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
] as const;

export interface PeriodeLaporan {
  tahun: number;
  bulan: number;
  kunci: string;
  mulai: string;
  selesai: string;
  label: string;
}

export type HasilPeriode = Result<PeriodeLaporan>;

function duaDigit(value: number): string {
  return String(value).padStart(2, "0");
}

export function buatPeriode(tahun: number, bulan: number): PeriodeLaporan {
  const bulanBerikut = bulan === 12 ? 1 : bulan + 1;
  const tahunBerikut = bulan === 12 ? tahun + 1 : tahun;

  return {
    tahun,
    bulan,
    kunci: `${tahun}-${duaDigit(bulan)}`,
    mulai: isoWaktuJakarta(`${tahun}-${duaDigit(bulan)}-01T00:00:00`),
    selesai: isoWaktuJakarta(`${tahunBerikut}-${duaDigit(bulanBerikut)}-01T00:00:00`),
    label: `${NAMA_BULAN[bulan - 1]} ${tahun}`,
  };
}

export function periodeSekarang(now: Date = new Date()): PeriodeLaporan {
  const bagian = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);

  const tahun = Number(bagian.find((item) => item.type === "year")?.value);
  const bulan = Number(bagian.find((item) => item.type === "month")?.value);

  if (!tahun || !bulan) {
    throw new Error("Tanggal sistem tidak valid untuk menentukan periode.");
  }

  return buatPeriode(tahun, bulan);
}

export function parsePeriode(
  value: string | string[] | undefined,
): HasilPeriode {
  if (Array.isArray(value)) {
    if (value.length !== 1) {
      return {
        ok: false,
        message: "Pilih tepat satu bulan kalender untuk laporan (D-50).",
      };
    }
    return parsePeriode(value[0]);
  }

  const teks = value?.trim();
  if (!teks) {
    return { ok: false, message: "Pilih periode laporan terlebih dahulu." };
  }

  if (/[,/]|\.\./.test(teks)) {
    return {
      ok: false,
      message: "Pilih tepat satu bulan kalender untuk laporan (D-50).",
    };
  }

  const cocok = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(teks);
  if (!cocok) {
    return {
      ok: false,
      message: "Format periode tidak valid. Pilih satu bulan kalender (YYYY-MM).",
    };
  }

  const tahun = Number(cocok[1]);
  const bulan = Number(cocok[2]);
  if (tahun < 2000 || tahun > 9999) {
    return {
      ok: false,
      message: "Tahun periode di luar rentang bulan kalender yang didukung (2000–9999).",
    };
  }

  return { ok: true, data: buatPeriode(tahun, bulan) };
}
