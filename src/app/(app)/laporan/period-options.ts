import { buatPeriode, type PeriodeLaporan } from "@/core/ledger";

/**
 * The selector offers the current month and the previous eleven months even
 * before a period row exists, so an empty month still opens as zero (AC edge
 * case). Period rows that already exist are merged in.
 */
export function susunOpsiPeriode(
  dariDatabase: readonly PeriodeLaporan[],
  sekarang: PeriodeLaporan,
): PeriodeLaporan[] {
  const hasil = new Map<string, PeriodeLaporan>();

  let tahun = sekarang.tahun;
  let bulan = sekarang.bulan;
  for (let mundur = 0; mundur < 12; mundur += 1) {
    const periode = buatPeriode(tahun, bulan);
    hasil.set(periode.kunci, periode);
    bulan -= 1;
    if (bulan === 0) {
      bulan = 12;
      tahun -= 1;
    }
  }

  for (const periode of dariDatabase) {
    hasil.set(periode.kunci, periode);
  }

  return [...hasil.values()].sort(
    (a, b) => b.tahun - a.tahun || b.bulan - a.bulan,
  );
}
