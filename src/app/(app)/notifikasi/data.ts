import {
  bacaKonfigurasiEmail,
  getNotifikasiQueueContext,
  hitungBelumDibaca,
  listNotifikasiPenerima,
  prosesAntreanEmail,
  type Notifikasi,
} from "@/core/notifikasi";
import { createClient } from "@/lib/supabase/server";

export interface HalamanNotifikasiData {
  daftar: Notifikasi[];
  belumDibaca: number;
  error: string | null;
}

/**
 * Antrean email diproses saat layar dibuka: belum ada penjadwal di lingkungan
 * ini. Hasil pengiriman yang belum pasti menunggu pemeriksaan manusia;
 * transaksi pemicu tetap tidak terpengaruh (INV-02).
 */
async function prosesAntreanYangJatuhTempo(): Promise<void> {
  const konteks = await getNotifikasiQueueContext();
  if (!konteks.ok) return;

  const konfigurasi = bacaKonfigurasiEmail();
  await prosesAntreanEmail(konteks.data.supabase, {
    basisUrl: konfigurasi.basisUrl,
    batas: 5,
  });
}

export async function muatHalamanNotifikasi(
  penerimaId: string,
): Promise<HalamanNotifikasiData> {
  await prosesAntreanYangJatuhTempo();

  const supabase = await createClient();
  const hasil = await listNotifikasiPenerima(supabase, penerimaId);

  return {
    belumDibaca: hitungBelumDibaca(hasil.data),
    daftar: hasil.data,
    error: hasil.error,
  };
}
