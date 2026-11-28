import type { SupabaseClient } from "@supabase/supabase-js";

import { totalJurnalPersediaanCents } from "@/core/ledger/report";
import { listBarisJurnal } from "@/core/ledger/report-queries";
import { ok, type Result } from "@/lib/result";
import {
  hitungTotalNilaiMutasiCents,
  rekonsiliasiPersediaan,
  type RekonsiliasiPersediaan,
} from "./report";
import { listMutasiPeriode, type FilterMutasiPeriode } from "./report-queries";

/**
 * Reads the two aggregate control totals and compares them. Callers render the
 * result; no report screen has to coordinate the two core reads itself.
 */
export async function muatRekonsiliasiPersediaan(
  supabase: SupabaseClient,
  filter: FilterMutasiPeriode,
): Promise<Result<RekonsiliasiPersediaan>> {
  const [mutasi, jurnal] = await Promise.all([
    listMutasiPeriode(supabase, filter),
    listBarisJurnal(supabase, filter),
  ]);

  if (!mutasi.ok) return mutasi;
  if (!jurnal.ok) return jurnal;

  return ok(
    rekonsiliasiPersediaan(
      hitungTotalNilaiMutasiCents(mutasi.data),
      totalJurnalPersediaanCents(jurnal.data),
    ),
  );
}
