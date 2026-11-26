export function formatTanggal(iso: string): string {
  // A date column ("2026-11-24") is a calendar day, not an instant. Parsing it
  // as local midnight keeps the printed day identical in every timezone.
  const tanggal = iso.length === 10 ? `${iso}T00:00:00` : iso;
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(
    new Date(tanggal),
  );
}

export function formatTanggalWaktu(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}
