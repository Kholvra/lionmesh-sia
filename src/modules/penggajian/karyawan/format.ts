const ZONA_WAKTU = "Asia/Jakarta";

const tanggalFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const waktuFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: ZONA_WAKTU,
});

const rupiahFormatter = new Intl.NumberFormat("id-ID");

/** `2026-11-02` → `02 Nov 2026`. Dates are calendar days, so read them as UTC. */
export function formatTanggal(isoDate: string): string {
  return tanggalFormatter.format(new Date(`${isoDate}T00:00:00Z`));
}

/** ISO timestamp → `02 Nov 2026, 14.30` in Asia/Jakarta. */
export function formatWaktu(isoTimestamp: string): string {
  return waktuFormatter.format(new Date(isoTimestamp));
}

export function formatRupiah(nominal: number): string {
  return `Rp ${rupiahFormatter.format(nominal)}`;
}

/** Today's calendar date in Asia/Jakarta as `YYYY-MM-DD`. */
export function hariIniJakarta(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONA_WAKTU }).format(now);
}

/** Show only the last four digits of an account number. */
export function samarkanRekening(nomor: string): string {
  return nomor.length <= 4 ? nomor : `••••${nomor.slice(-4)}`;
}
