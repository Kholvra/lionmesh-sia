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

const ZONA_WAKTU = "Asia/Jakarta";

function offsetZonaMs(zona: string): number {
  const bagian = new Intl.DateTimeFormat("en-US", {
    timeZone: zona,
    timeZoneName: "longOffset",
  }).formatToParts(new Date());
  const nama = bagian.find((item) => item.type === "timeZoneName")?.value ?? "";
  const cocok = /^GMT([+-])(\d{2}):(\d{2})$/.exec(nama);
  if (!cocok) {
    throw new Error(`Zona waktu ${zona} tidak dikenal.`);
  }
  const menit = Number(cocok[2]) * 60 + Number(cocok[3]);
  return (cocok[1] === "-" ? -menit : menit) * 60_000;
}

const OFFSET_JAKARTA_MS = offsetZonaMs(ZONA_WAKTU);

function formatOffset(ms: number): string {
  const menit = Math.round(ms / 60_000);
  const tanda = menit < 0 ? "-" : "+";
  const nilai = Math.abs(menit);
  return `${tanda}${String(Math.floor(nilai / 60)).padStart(2, "0")}:${String(nilai % 60).padStart(2, "0")}`;
}

export function isoWaktuJakarta(waktuLokal: string): string {
  return `${waktuLokal}${formatOffset(OFFSET_JAKARTA_MS)}`;
}

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
