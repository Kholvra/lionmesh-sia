import type { SupabaseClient } from "@supabase/supabase-js";

import { fail, ok, type Result } from "@/lib/result";
import type { PemasokInput } from "./types";

function pesanKesalahan(
  error: { message?: string } | null,
  fallback: string,
): string {
  const message = error?.message?.trim();
  return message && message.length > 0 ? message : fallback;
}

export async function createPemasok(
  client: SupabaseClient,
  input: PemasokInput,
): Promise<Result<{ id: string }>> {
  const { data, error } = await client.rpc("create_pemasok", {
    p_nama: input.nama,
    p_alamat: input.alamat,
    p_npwp: input.npwp,
    p_kontak_perusahaan: input.kontakPerusahaan,
    p_kontak_pic_nama: input.kontakPicNama,
    p_kontak_pic_telepon: input.kontakPicTelepon,
    p_termin_hari: input.terminHari,
    p_toleransi_persen: input.toleransiPersen,
    p_toleransi_nominal: input.toleransiNominal,
  });

  if (error) {
    return fail(pesanKesalahan(error, "Gagal menyimpan data pemasok."));
  }

  if (typeof data !== "string") {
    return fail("Gagal menyimpan data pemasok.");
  }

  return ok({ id: data });
}

export async function updatePemasok(
  client: SupabaseClient,
  id: string,
  input: PemasokInput,
): Promise<Result<void>> {
  const { error } = await client.rpc("update_pemasok", {
    p_id: id,
    p_nama: input.nama,
    p_alamat: input.alamat,
    p_npwp: input.npwp,
    p_kontak_perusahaan: input.kontakPerusahaan,
    p_kontak_pic_nama: input.kontakPicNama,
    p_kontak_pic_telepon: input.kontakPicTelepon,
    p_termin_hari: input.terminHari,
    p_toleransi_persen: input.toleransiPersen,
    p_toleransi_nominal: input.toleransiNominal,
  });

  if (error) {
    return fail(pesanKesalahan(error, "Gagal memperbarui data pemasok."));
  }

  return ok(undefined);
}

export async function setStatusPemasok(
  client: SupabaseClient,
  id: string,
  aktif: boolean,
): Promise<Result<void>> {
  const { error } = await client.rpc("set_status_pemasok", {
    p_id: id,
    p_aktif: aktif,
  });

  if (error) {
    return fail(pesanKesalahan(error, "Gagal mengubah status pemasok."));
  }

  return ok(undefined);
}
