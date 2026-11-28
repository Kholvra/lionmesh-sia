const HARI_MS = 86_400_000;

/** Monday–Friday dates from `mulai` to `selesai`, both inclusive. */
export function hariKerja(mulai: string, selesai: string): string[] {
  const hasil: string[] = [];
  for (let t = Date.parse(`${mulai}T00:00:00Z`); t <= Date.parse(`${selesai}T00:00:00Z`); t += HARI_MS) {
    const hari = new Date(t).getUTCDay();
    if (hari !== 0 && hari !== 6) hasil.push(new Date(t).toISOString().slice(0, 10));
  }
  return hasil;
}

export function hariLibur(tanggal: string): boolean {
  const hari = new Date(`${tanggal}T00:00:00Z`).getUTCDay();
  return hari === 0 || hari === 6;
}
