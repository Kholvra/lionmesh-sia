import {
  getProduk,
  listGudang,
  listKategoriProduk,
  listKonversiSatuan,
  listKurs,
  listMataUang,
  listProduk,
  listRiwayatMaster,
  listSatuan,
  type Gudang,
  type KategoriProduk,
  type KonversiSatuan,
  type Kurs,
  type MataUang,
  type Produk,
  type RiwayatStatusMaster,
  type Satuan,
} from "@/core/master";
import { createClient } from "@/lib/supabase/server";

export interface ProdukPageData {
  daftar: Produk[];
  satuanAktif: Satuan[];
  kategori: KategoriProduk[];
  terpilih: Produk | null;
  riwayat: RiwayatStatusMaster[];
  daftarError: string | null;
  pilihanError: string | null;
  terpilihError: string | null;
  riwayatError: string | null;
}

export async function getProdukPageData(
  produkId?: string,
): Promise<ProdukPageData> {
  const supabase = await createClient();

  const [daftar, satuan, kategori] = await Promise.all([
    listProduk(supabase),
    // Picker dokumen baru hanya berisi entri aktif (AC-04).
    listSatuan(supabase, { aktif: true }),
    listKategoriProduk(supabase),
  ]);

  const pilihanError = daftar.error ?? satuan.error ?? kategori.error;

  if (!produkId) {
    return {
      daftar: daftar.data,
      satuanAktif: satuan.data,
      kategori: kategori.data,
      terpilih: null,
      riwayat: [],
      daftarError: daftar.error,
      pilihanError,
      terpilihError: null,
      riwayatError: null,
    };
  }

  const [terpilih, riwayat] = await Promise.all([
    getProduk(supabase, produkId),
    listRiwayatMaster(supabase, "produk", produkId),
  ]);

  return {
    daftar: daftar.data,
    satuanAktif: satuan.data,
    kategori: kategori.data,
    terpilih: terpilih.data,
    riwayat: riwayat.data,
    daftarError: daftar.error,
    pilihanError,
    terpilihError: terpilih.error,
    riwayatError: riwayat.error,
  };
}

export interface SatuanPageData {
  daftar: Satuan[];
  satuanAktif: Satuan[];
  konversi: KonversiSatuan[];
  terpilih: Satuan | null;
  riwayat: RiwayatStatusMaster[];
  daftarError: string | null;
  konversiError: string | null;
  riwayatError: string | null;
}

export async function getSatuanPageData(
  satuanId?: string,
): Promise<SatuanPageData> {
  const supabase = await createClient();

  const [daftar, konversi] = await Promise.all([
    listSatuan(supabase),
    listKonversiSatuan(supabase),
  ]);

  const terpilih = satuanId
    ? (daftar.data.find((item) => item.id === satuanId) ?? null)
    : null;

  const riwayat =
    satuanId && terpilih
      ? await listRiwayatMaster(supabase, "satuan", satuanId)
      : { data: [], error: null };

  return {
    daftar: daftar.data,
    satuanAktif: daftar.data.filter((item) => item.aktif),
    konversi: konversi.data,
    terpilih,
    riwayat: riwayat.data,
    daftarError: daftar.error,
    konversiError: konversi.error,
    riwayatError: riwayat.error,
  };
}

export interface GudangPageData {
  daftar: Gudang[];
  terpilih: Gudang | null;
  riwayat: RiwayatStatusMaster[];
  daftarError: string | null;
  riwayatError: string | null;
}

export async function getGudangPageData(
  gudangId?: string,
): Promise<GudangPageData> {
  const supabase = await createClient();
  const daftar = await listGudang(supabase);

  const terpilih = gudangId
    ? (daftar.data.find((item) => item.id === gudangId) ?? null)
    : null;

  const riwayat =
    gudangId && terpilih
      ? await listRiwayatMaster(supabase, "gudang", gudangId)
      : { data: [], error: null };

  return {
    daftar: daftar.data,
    terpilih,
    riwayat: riwayat.data,
    daftarError: daftar.error,
    riwayatError: riwayat.error,
  };
}

export interface MataUangPageData {
  daftar: MataUang[];
  mataUangAktif: MataUang[];
  kurs: Kurs[];
  terpilih: MataUang | null;
  riwayat: RiwayatStatusMaster[];
  daftarError: string | null;
  kursError: string | null;
  riwayatError: string | null;
}

export async function getMataUangPageData(
  mataUangId?: string,
): Promise<MataUangPageData> {
  const supabase = await createClient();

  const [daftar, kurs] = await Promise.all([
    listMataUang(supabase),
    listKurs(supabase),
  ]);

  const terpilih = mataUangId
    ? (daftar.data.find((item) => item.id === mataUangId) ?? null)
    : null;

  const riwayat =
    mataUangId && terpilih
      ? await listRiwayatMaster(supabase, "mata_uang", mataUangId)
      : { data: [], error: null };

  return {
    daftar: daftar.data,
    mataUangAktif: daftar.data.filter((item) => item.aktif),
    kurs: kurs.data,
    terpilih,
    riwayat: riwayat.data,
    daftarError: daftar.error,
    kursError: kurs.error,
    riwayatError: riwayat.error,
  };
}
