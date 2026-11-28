const ZONA_WAKTU = "Asia/Jakarta";

/** Current wall-clock time in Asia/Jakarta as `HH:MM`. */
export function jamSekarangJakarta(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: ZONA_WAKTU,
  }).format(now);
}

/** `HH:MM` → minutes after midnight, or null when the value is not a time. */
export function menitDariJam(jam: string): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(jam);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

/** Minutes → `2 jam 30 menit`. */
export function formatDurasi(menit: number): string {
  const jam = Math.floor(menit / 60);
  const sisa = menit % 60;
  if (jam === 0) return `${sisa} menit`;
  return sisa === 0 ? `${jam} jam` : `${jam} jam ${sisa} menit`;
}

/** `07:58` → `07.58`, the Indonesian time notation used on screen. */
export function formatJam(jam: string | null): string {
  return jam ? jam.replace(":", ".") : "Belum tercatat";
}
