export interface AgingBucketParam {
  key: "belum_jatuh_tempo" | "1_30" | "31_60" | "61_90" | "lebih_90";
  label: string;
  minDays: number | null;
  maxDays: number | null;
}

const DEFAULT_AGING_BUCKETS: readonly AgingBucketParam[] = [
  { key: "belum_jatuh_tempo", label: "Belum Jatuh Tempo", minDays: null, maxDays: 0 },
  { key: "1_30", label: "1–30 Hari", minDays: 1, maxDays: 30 },
  { key: "31_60", label: "31–60 Hari", minDays: 31, maxDays: 60 },
  { key: "61_90", label: "61–90 Hari", minDays: 61, maxDays: 90 },
  { key: "lebih_90", label: "> 90 Hari", minDays: 91, maxDays: null },
];

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export interface BarisFakturCalc {
  nilaiKotor: number;
  nilaiDiskon: number;
  dpp: number;
  ppn: number;
  total: number;
}

export function hitungBarisFaktur(
  qty: number,
  hargaSatuan: number,
  diskonPersen: number,
  tarifPpn: number,
): BarisFakturCalc {
  const nilaiKotor = round2(qty * hargaSatuan);
  const nilaiDiskon = round2(nilaiKotor * (diskonPersen / 100));
  const dpp = round2(nilaiKotor - nilaiDiskon);
  const ppn = round2(dpp * tarifPpn);
  const total = round2(dpp + ppn);

  return { nilaiKotor, nilaiDiskon, dpp, ppn, total };
}

export function hitungTotalFaktur(
  items: Array<{ qty: number; hargaSatuan: number; diskonPersen: number }>,
  tarifPpn: number,
): { dpp: number; ppn: number; total: number } {
  let dpp = 0;
  let ppn = 0;
  let total = 0;

  for (const it of items) {
    const baris = hitungBarisFaktur(
      it.qty,
      it.hargaSatuan,
      it.diskonPersen,
      tarifPpn,
    );
    dpp = round2(dpp + baris.dpp);
    ppn = round2(ppn + baris.ppn);
    total = round2(total + baris.total);
  }

  return { dpp, ppn, total };
}

/** AC-04: Jatuh tempo = tanggal faktur + termin hari */
export function hitungJatuhTempo(
  tanggalFaktur: string,
  terminHari: number,
): string {
  const parts = tanggalFaktur.split("-").map(Number);
  const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  date.setUTCDate(date.getUTCDate() + terminHari);
  return date.toISOString().split("T")[0];
}

/** AC-08 / D-51(f): Hitung umur hari lewat jatuh tempo & klasifikasi bucket */
export function hitungUmurDanBucket(
  jatuhTempo: string,
  tanggalLaporan: string,
  buckets: readonly AgingBucketParam[] = DEFAULT_AGING_BUCKETS,
): { umurHari: number; bucket: AgingBucketParam } {
  const pJt = jatuhTempo.split("-").map(Number);
  const pLap = tanggalLaporan.split("-").map(Number);
  const dtJt = Date.UTC(pJt[0], pJt[1] - 1, pJt[2]);
  const dtLap = Date.UTC(pLap[0], pLap[1] - 1, pLap[2]);

  const diffDays = Math.floor((dtLap - dtJt) / (1000 * 60 * 60 * 24));

  for (const b of buckets) {
    const geMin = b.minDays === null || diffDays >= b.minDays;
    const leMax = b.maxDays === null || diffDays <= b.maxDays;
    if (geMin && leMax) {
      return { umurHari: diffDays, bucket: b };
    }
  }

  return { umurHari: diffDays, bucket: buckets[0] };
}
