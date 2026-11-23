const BULAN_SINGKAT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

const OFFSET_JAKARTA_MS = 7 * 60 * 60 * 1000;

interface BagianTanggal {
  hari: string;
  bulan: string;
  tahun: string;
  jam: string;
  menit: string;
}

function bagianTanggal(value: string | Date): BagianTanggal | null {
  const waktu = value instanceof Date ? value.getTime() : Date.parse(value);
  if (Number.isNaN(waktu)) return null;

  const tanggal = new Date(waktu + OFFSET_JAKARTA_MS);
  return {
    hari: String(tanggal.getUTCDate()).padStart(2, "0"),
    bulan: BULAN_SINGKAT[tanggal.getUTCMonth()] ?? "—",
    tahun: String(tanggal.getUTCFullYear()),
    jam: String(tanggal.getUTCHours()).padStart(2, "0"),
    menit: String(tanggal.getUTCMinutes()).padStart(2, "0"),
  };
}

export function formatTanggal(value: string | Date): string {
  const bagian = bagianTanggal(value);
  if (!bagian) return "—";
  return `${bagian.hari} ${bagian.bulan} ${bagian.tahun}`;
}

export function formatTanggalWaktu(value: string | Date): string {
  const bagian = bagianTanggal(value);
  if (!bagian) return "—";
  return `${bagian.hari} ${bagian.bulan} ${bagian.tahun} ${bagian.jam}.${bagian.menit}`;
}
