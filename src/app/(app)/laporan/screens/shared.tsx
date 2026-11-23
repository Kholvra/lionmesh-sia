import type { SupabaseClient } from "@supabase/supabase-js";

import {
  listPeriodeAkuntansi,
  periodeSekarang,
  type PeriodeLaporan,
} from "@/core/ledger";
import type { Result } from "@/lib/result";
import { susunOpsiPeriode } from "../period-options";
import { Pesan } from "../components/laporan-shell";

export type LaporanParams = {
  periode?: string | string[];
  akun?: string | string[];
  produk?: string | string[];
  gudang?: string | string[];
};

export function parameterTunggal(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) return value.length === 1 ? value[0] : undefined;
  return value;
}

export async function muatOpsiPeriode(
  supabase: SupabaseClient,
): Promise<Result<PeriodeLaporan[]>> {
  const hasil = await listPeriodeAkuntansi(supabase);
  if (!hasil.ok) return hasil;
  return {
    ok: true,
    data: susunOpsiPeriode(hasil.data, periodeSekarang()),
  };
}

export function GagalMemuat({ pesan }: { pesan: string }) {
  return <Pesan nada="bahaya">Laporan gagal dimuat: {pesan}</Pesan>;
}
