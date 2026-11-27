export interface AgingBucketSpec {
  key: string;
  label: string;
  minDays: number | null;
  maxDays: number | null;
}

export const AGING_BUCKETS: readonly AgingBucketSpec[] = [
  {
    key: "BELUM_JATUH_TEMPO",
    label: "Belum Jatuh Tempo",
    minDays: null,
    maxDays: 0,
  },
  { key: "1_30", label: "1–30 Hari", minDays: 1, maxDays: 30 },
  { key: "31_60", label: "31–60 Hari", minDays: 31, maxDays: 60 },
  { key: "61_90", label: "61–90 Hari", minDays: 61, maxDays: 90 },
  { key: "OVER_90", label: "> 90 Hari", minDays: 91, maxDays: null },
];

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function hitungUmurDanBucket(
  jatuhTempo: string,
  tanggalLaporan: string,
): { umurHari: number; bucket: AgingBucketSpec } {
  const pJt = jatuhTempo.slice(0, 10).split("-").map(Number);
  const pLap = tanggalLaporan.slice(0, 10).split("-").map(Number);
  const dtJt = Date.UTC(pJt[0], pJt[1] - 1, pJt[2]);
  const dtLap = Date.UTC(pLap[0], pLap[1] - 1, pLap[2]);

  const umurHari = Math.floor((dtLap - dtJt) / (1000 * 60 * 60 * 24));

  for (const b of AGING_BUCKETS) {
    const geMin = b.minDays === null || umurHari >= b.minDays;
    const leMax = b.maxDays === null || umurHari <= b.maxDays;
    if (geMin && leMax) {
      return { umurHari, bucket: b };
    }
  }

  return { umurHari, bucket: AGING_BUCKETS[0] };
}

export function validasiPeriodeBulan(
  periode: string | undefined | null,
  todayIso: string,
): string | null {
  if (!periode || !/^\d{4}-\d{2}$/.test(periode)) {
    return "Pilih periode laporan.";
  }
  const currentMonth = todayIso.slice(0, 7);
  if (periode > currentMonth) {
    return "Periode tidak boleh melebihi hari ini.";
  }
  return null;
}

export function validasiTanggalLaporan(
  tanggal: string | undefined | null,
  todayIso: string,
): string | null {
  if (!tanggal || !/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) {
    return "Pilih periode laporan.";
  }
  if (tanggal > todayIso.slice(0, 10)) {
    return "Tanggal laporan tidak boleh melebihi hari ini.";
  }
  return null;
}

export function getRentangBulan(periode: string): {
  startDate: string;
  endDate: string;
} {
  const [tahun, bulan] = periode.split("-").map(Number);
  const lastDay = new Date(Date.UTC(tahun, bulan, 0)).getUTCDate();
  const mm = String(bulan).padStart(2, "0");
  const dd = String(lastDay).padStart(2, "0");
  return {
    startDate: `${tahun}-${mm}-01`,
    endDate: `${tahun}-${mm}-${dd}`,
  };
}
