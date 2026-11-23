import {
  getPemasok,
  listPemasok,
  listRiwayatStatusPemasok,
  type Pemasok,
  type RiwayatStatusPemasok,
} from "@/core/pemasok";
import { createClient } from "@/lib/supabase/server";

export interface PemasokPageData {
  daftar: Pemasok[];
  terpilih: Pemasok | null;
  riwayat: RiwayatStatusPemasok[];
  daftarError: string | null;
  terpilihError: string | null;
  riwayatError: string | null;
}

export async function getPemasokPageData(
  pemasokId?: string,
): Promise<PemasokPageData> {
  const supabase = await createClient();

  if (!pemasokId) {
    const daftar = await listPemasok(supabase);
    return {
      daftar: daftar.data,
      terpilih: null,
      riwayat: [],
      daftarError: daftar.error,
      terpilihError: null,
      riwayatError: null,
    };
  }

  const [daftar, terpilih, riwayat] = await Promise.all([
    listPemasok(supabase),
    getPemasok(supabase, pemasokId),
    listRiwayatStatusPemasok(supabase, pemasokId),
  ]);

  return {
    daftar: daftar.data,
    terpilih: terpilih.data,
    riwayat: riwayat.data,
    daftarError: daftar.error,
    terpilihError: terpilih.error,
    riwayatError: riwayat.error,
  };
}
