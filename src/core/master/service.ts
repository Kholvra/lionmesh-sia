import type { SupabaseClient } from "@supabase/supabase-js";

import { fail, ok, type Result } from "@/lib/result";
import type {
  EntitasMaster,
  GudangInput,
  KategoriProdukInput,
  KonversiSatuanInput,
  KursInput,
  MataUangInput,
  ProdukInput,
  SatuanInput,
} from "./types";

function pesanKesalahan(
  error: { message?: string } | null,
  fallback: string,
): string {
  const message = error?.message?.trim();
  return message && message.length > 0 ? message : fallback;
}

async function panggilSimpan(
  client: SupabaseClient,
  rpc: string,
  args: Record<string, unknown>,
  pesanGagal: string,
): Promise<Result<{ id: string }>> {
  const { data, error } = await client.rpc(rpc, args);

  if (error) return fail(pesanKesalahan(error, pesanGagal));

  if (typeof data !== "string") return fail(pesanGagal);

  return ok({ id: data });
}

async function panggilStatus(
  client: SupabaseClient,
  entitas: EntitasMaster,
  id: string,
  aktif: boolean,
): Promise<Result<void>> {
  const { error } = await client.rpc("set_status_master", {
    p_entitas: entitas,
    p_id: id,
    p_aktif: aktif,
  });

  if (error) {
    return fail(pesanKesalahan(error, "Gagal mengubah status master."));
  }

  return ok(undefined);
}

export function createProduk(
  client: SupabaseClient,
  input: ProdukInput,
): Promise<Result<{ id: string }>> {
  return panggilSimpan(
    client,
    "simpan_produk",
    {
      p_id: null,
      p_kode: input.kode,
      p_nama: input.nama,
      p_tipe: input.tipe,
      p_satuan_dasar_id: input.satuanDasarId,
      p_kategori_id: input.kategoriId,
    },
    "Gagal menyimpan produk.",
  );
}

export function updateProduk(
  client: SupabaseClient,
  id: string,
  input: ProdukInput,
): Promise<Result<{ id: string }>> {
  return panggilSimpan(
    client,
    "simpan_produk",
    {
      p_id: id,
      p_kode: input.kode,
      p_nama: input.nama,
      p_tipe: input.tipe,
      p_satuan_dasar_id: input.satuanDasarId,
      p_kategori_id: input.kategoriId,
    },
    "Gagal memperbarui produk.",
  );
}

export function setStatusProduk(
  client: SupabaseClient,
  id: string,
  aktif: boolean,
): Promise<Result<void>> {
  return panggilStatus(client, "produk", id, aktif);
}

export function createKategoriProduk(
  client: SupabaseClient,
  input: KategoriProdukInput,
): Promise<Result<{ id: string }>> {
  return panggilSimpan(
    client,
    "simpan_kategori_produk",
    { p_id: null, p_kode: input.kode, p_nama: input.nama },
    "Gagal menyimpan kategori produk.",
  );
}

export function updateKategoriProduk(
  client: SupabaseClient,
  id: string,
  input: KategoriProdukInput,
): Promise<Result<{ id: string }>> {
  return panggilSimpan(
    client,
    "simpan_kategori_produk",
    { p_id: id, p_kode: input.kode, p_nama: input.nama },
    "Gagal memperbarui kategori produk.",
  );
}

export function setStatusKategoriProduk(
  client: SupabaseClient,
  id: string,
  aktif: boolean,
): Promise<Result<void>> {
  return panggilStatus(client, "kategori_produk", id, aktif);
}

export function createGudang(
  client: SupabaseClient,
  input: GudangInput,
): Promise<Result<{ id: string }>> {
  return panggilSimpan(
    client,
    "simpan_gudang",
    { p_id: null, p_kode: input.kode, p_nama: input.nama },
    "Gagal menyimpan gudang.",
  );
}

export function updateGudang(
  client: SupabaseClient,
  id: string,
  input: GudangInput,
): Promise<Result<{ id: string }>> {
  return panggilSimpan(
    client,
    "simpan_gudang",
    { p_id: id, p_kode: input.kode, p_nama: input.nama },
    "Gagal memperbarui gudang.",
  );
}

export function setStatusGudang(
  client: SupabaseClient,
  id: string,
  aktif: boolean,
): Promise<Result<void>> {
  return panggilStatus(client, "gudang", id, aktif);
}

export function createSatuan(
  client: SupabaseClient,
  input: SatuanInput,
): Promise<Result<{ id: string }>> {
  return panggilSimpan(
    client,
    "simpan_satuan",
    { p_id: null, p_kode: input.kode, p_nama: input.nama },
    "Gagal menyimpan satuan.",
  );
}

export function updateSatuan(
  client: SupabaseClient,
  id: string,
  input: SatuanInput,
): Promise<Result<{ id: string }>> {
  return panggilSimpan(
    client,
    "simpan_satuan",
    { p_id: id, p_kode: input.kode, p_nama: input.nama },
    "Gagal memperbarui satuan.",
  );
}

export function setStatusSatuan(
  client: SupabaseClient,
  id: string,
  aktif: boolean,
): Promise<Result<void>> {
  return panggilStatus(client, "satuan", id, aktif);
}

export function createKonversiSatuan(
  client: SupabaseClient,
  input: KonversiSatuanInput,
): Promise<Result<{ id: string }>> {
  return panggilSimpan(
    client,
    "simpan_konversi_satuan",
    {
      p_id: null,
      p_satuan_dari_id: input.satuanDariId,
      p_satuan_ke_id: input.satuanKeId,
      p_faktor: input.faktor,
    },
    "Gagal menyimpan konversi satuan.",
  );
}

export function updateKonversiSatuan(
  client: SupabaseClient,
  id: string,
  input: KonversiSatuanInput,
): Promise<Result<{ id: string }>> {
  return panggilSimpan(
    client,
    "simpan_konversi_satuan",
    {
      p_id: id,
      p_satuan_dari_id: input.satuanDariId,
      p_satuan_ke_id: input.satuanKeId,
      p_faktor: input.faktor,
    },
    "Gagal memperbarui konversi satuan.",
  );
}

export function createMataUang(
  client: SupabaseClient,
  input: MataUangInput,
): Promise<Result<{ id: string }>> {
  return panggilSimpan(
    client,
    "simpan_mata_uang",
    { p_id: null, p_kode: input.kode, p_nama: input.nama, p_simbol: input.simbol },
    "Gagal menyimpan mata uang.",
  );
}

export function updateMataUang(
  client: SupabaseClient,
  id: string,
  input: MataUangInput,
): Promise<Result<{ id: string }>> {
  return panggilSimpan(
    client,
    "simpan_mata_uang",
    { p_id: id, p_kode: input.kode, p_nama: input.nama, p_simbol: input.simbol },
    "Gagal memperbarui mata uang.",
  );
}

export function setStatusMataUang(
  client: SupabaseClient,
  id: string,
  aktif: boolean,
): Promise<Result<void>> {
  return panggilStatus(client, "mata_uang", id, aktif);
}

export function createKurs(
  client: SupabaseClient,
  input: KursInput,
): Promise<Result<{ id: string }>> {
  return panggilSimpan(
    client,
    "simpan_kurs",
    {
      p_id: null,
      p_mata_uang_id: input.mataUangId,
      p_tanggal: input.tanggal,
      p_nilai: input.nilai,
    },
    "Gagal menyimpan kurs.",
  );
}

export function updateKurs(
  client: SupabaseClient,
  id: string,
  input: KursInput,
): Promise<Result<{ id: string }>> {
  return panggilSimpan(
    client,
    "simpan_kurs",
    {
      p_id: id,
      p_mata_uang_id: input.mataUangId,
      p_tanggal: input.tanggal,
      p_nilai: input.nilai,
    },
    "Gagal memperbarui kurs.",
  );
}
