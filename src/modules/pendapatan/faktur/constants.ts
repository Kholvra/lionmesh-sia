export const PATH_FAKTUR = "/pendapatan/faktur";
export const PATH_FAKTUR_BARU = "/pendapatan/faktur/baru";
export const PATH_PIUTANG = "/pendapatan/piutang";

export interface AgingBucketDef {
  key: "belum_jatuh_tempo" | "1_30" | "31_60" | "61_90" | "lebih_90";
  label: string;
  minDays: number | null;
  maxDays: number | null;
}

/** Parameterized aging buckets (D-51(f)) */
export const AGING_BUCKETS: readonly AgingBucketDef[] = [
  { key: "belum_jatuh_tempo", label: "Belum Jatuh Tempo", minDays: null, maxDays: 0 },
  { key: "1_30", label: "1–30 Hari", minDays: 1, maxDays: 30 },
  { key: "31_60", label: "31–60 Hari", minDays: 31, maxDays: 60 },
  { key: "61_90", label: "61–90 Hari", minDays: 61, maxDays: 90 },
  { key: "lebih_90", label: "> 90 Hari", minDays: 91, maxDays: null },
];
