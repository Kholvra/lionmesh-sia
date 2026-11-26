const ZONA_WAKTU = "Asia/Jakarta";

export function formatWaktu(iso: string): string {
  const waktu = Date.parse(iso);
  if (Number.isNaN(waktu)) return "—";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: ZONA_WAKTU,
  }).format(new Date(waktu));
}

export function formatPeriode(tanggal: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: ZONA_WAKTU,
  }).format(tanggal);
}
