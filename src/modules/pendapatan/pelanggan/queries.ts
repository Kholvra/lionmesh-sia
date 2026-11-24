import {
  canReadKontak,
  getPelanggan,
  getPelangganDenganKontak,
  listPelanggan,
  type Pelanggan,
  type PelangganRingkas,
} from "@/core/pelanggan";
import type { Profile } from "@/lib/auth/types";
import { createAdminClient } from "@/lib/supabase/admin";

export type PelangganPageData = {
  items: PelangganRingkas[];
  total: number;
  terpilih: Pelanggan | null;
  canReadKontak: boolean;
};

export async function getPelangganPageData(
  profile: Profile,
  pelangganId?: string,
  cari?: string
): Promise<PelangganPageData> {
  const supabase = createAdminClient();
  if (!supabase) {
    return {
      items: [],
      total: 0,
      terpilih: null,
      canReadKontak: false,
    };
  }

  const aktor = { id: profile.id, peran: profile.peran };
  const bolehBacaKontak = canReadKontak(aktor);

  const listRes = await listPelanggan(supabase, {
    cari,
    limit: 100,
    offset: 0,
    urutkan: "nama",
    arah: "ascending",
  });

  const items = listRes.ok ? listRes.data.baris : [];
  const total = listRes.ok ? listRes.data.total : 0;

  let terpilih: Pelanggan | null = null;
  if (pelangganId) {
    if (bolehBacaKontak) {
      const detailRes = await getPelangganDenganKontak(supabase, pelangganId, aktor);
      if (detailRes.ok) terpilih = detailRes.data;
    } else {
      const detailRes = await getPelanggan(supabase, pelangganId);
      if (detailRes.ok) terpilih = detailRes.data;
    }
  }

  return {
    items,
    total,
    terpilih,
    canReadKontak: bolehBacaKontak,
  };
}
