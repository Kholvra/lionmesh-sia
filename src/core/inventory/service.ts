import type { SupabaseClient } from "@supabase/supabase-js";
import { fail, ok, type Result } from "@/lib/result";
import { isDecimal } from "./decimal";
import type {
  AlokasiStok,
  AlokasiStokItemInput,
  CatatMutasiInput,
  CatatMutasiResult,
  OpnameStokInput,
  OpnameStokResult,
  TransferStokInput,
  TransferStokResult,
} from "./types";
import { getKetersediaanProdukGudang } from "./queries";

/**
 * Mencatat mutasi stok dan memperbarui saldo stok dalam satu transaksi (ARCH-04).
 * Menegakkan PRE-01, PRE-02, PRE-03, PRE-04.
 */
export async function catatMutasi(
  supabase: SupabaseClient,
  input: CatatMutasiInput,
): Promise<Result<CatatMutasiResult>> {
  if (!isDecimal(input.qty, false)) {
    return fail("Qty harus bukan nol.");
  }

  if (input.hargaSatuan !== undefined && !isDecimal(input.hargaSatuan, true, false)) {
    return fail("Harga satuan tidak valid.");
  }

  if (input.tipe === "MASUK" && (input.hargaSatuan === undefined || !isDecimal(input.hargaSatuan, false, false))) {
    return fail("Harga satuan harus lebih dari nol.");
  }

  if (input.tipe === "PENYESUAIAN" && (!input.alasan || input.alasan.trim().length === 0)) {
    return fail("Isi alasan penyesuaian stok.");
  }

  const tanggalStr =
    typeof input.tanggal === "string"
      ? input.tanggal
      : input.tanggal.toISOString();

  const { data, error } = await supabase.rpc("catat_mutasi_stok", {
    p_produk_id: input.produkId,
    p_gudang_id: input.gudangId,
    p_tanggal: tanggalStr,
    p_tipe: input.tipe,
    p_qty: input.qty,
    p_harga_satuan: input.hargaSatuan ?? null,
    p_sumber_tipe: input.sumberTipe ?? "MANUAL",
    p_sumber_id: input.sumberId ?? null,
    p_alasan: input.alasan ?? null,
    p_actor_id: input.actorId ?? null,
  });

  if (error) {
    return fail(error.message);
  }

  return ok({
    mutasiId: data.mutasi_id,
    tipe: data.tipe,
    qty: data.qty,
    hargaSatuan: data.harga_satuan,
    nilai: data.nilai,
    saldo: {
      qty: data.saldo.qty,
      nilai: data.saldo.nilai,
      hargaRata: data.saldo.harga_rata,
    },
  });
}

/**
 * Transfer stok antar gudang dalam satu transaksi (D-52, AC-12).
 * Menghasilkan TRANSFER_KELUAR di gudang asal dan TRANSFER_MASUK di gudang tujuan.
 */
export async function transferStok(
  supabase: SupabaseClient,
  input: TransferStokInput,
): Promise<Result<TransferStokResult>> {
  if (!isDecimal(input.qty, false, false)) {
    return fail("Qty harus bukan nol.");
  }

  if (input.gudangAsalId === input.gudangTujuanId) {
    return fail("Gudang asal dan tujuan tidak boleh sama.");
  }

  const tanggalStr = input.tanggal
    ? typeof input.tanggal === "string"
      ? input.tanggal
      : input.tanggal.toISOString()
    : new Date().toISOString();

  const { data, error } = await supabase.rpc("transfer_stok", {
    p_produk_id: input.produkId,
    p_gudang_asal_id: input.gudangAsalId,
    p_gudang_tujuan_id: input.gudangTujuanId,
    p_qty: input.qty,
    p_tanggal: tanggalStr,
    p_sumber_id: input.sumberId ?? null,
    p_actor_id: input.actorId ?? null,
  });

  if (error) {
    return fail(error.message);
  }

  return ok({
    transferId: data.transfer_id,
    mutasiKeluarId: data.mutasi_keluar_id,
    mutasiMasukId: data.mutasi_masuk_id,
    nilaiTransfer: data.nilai_transfer,
    saldoAsal: {
      qty: data.saldo_asal.qty,
      nilai: data.saldo_asal.nilai,
      hargaRata: data.saldo_asal.harga_rata,
    },
    saldoTujuan: {
      qty: data.saldo_tujuan.qty,
      nilai: data.saldo_tujuan.nilai,
      hargaRata: data.saldo_tujuan.harga_rata,
    },
  });
}

/**
 * Stock opname fisik vs saldo (D-52, AC-13).
 * Menghasilkan mutasi PENYESUAIAN sebesar selisih fisik dan saldo buku.
 */
export async function opnameStok(
  supabase: SupabaseClient,
  input: OpnameStokInput,
): Promise<Result<OpnameStokResult>> {
  if (!input.alasan || input.alasan.trim().length === 0) {
    return fail("Isi alasan penyesuaian stok.");
  }

  if (!isDecimal(input.qtyFisik, true, false)) {
    return fail("Qty fisik tidak boleh negatif.");
  }

  const tanggalStr = input.tanggal
    ? typeof input.tanggal === "string"
      ? input.tanggal
      : input.tanggal.toISOString()
    : new Date().toISOString();

  const { data, error } = await supabase.rpc("opname_stok", {
    p_produk_id: input.produkId,
    p_gudang_id: input.gudangId,
    p_qty_fisik: input.qtyFisik,
    p_alasan: input.alasan,
    p_tanggal: tanggalStr,
    p_sumber_id: input.sumberId ?? null,
    p_actor_id: input.actorId ?? null,
  });

  if (error) {
    return fail(error.message);
  }

  return ok({
    opnameId: data.opname_id,
    mutasiId: data.mutasi_id,
    selisih: data.selisih,
    nilaiPenyesuaian: data.nilai_penyesuaian,
    saldo: {
      qty: data.saldo.qty,
      nilai: data.saldo.nilai,
      hargaRata: data.saldo.harga_rata,
    },
  });
}

/**
 * PD-003: Alokasi stok untuk baris pesanan tanpa mengubah saldo_stok maupun mutasi_stok.
 * Menjamin total alokasi aktif <= saldo fisik (INV-01) dan <= sisa qty pesanan (INV-04).
 */
export async function alokasiStokPesanan(
  supabase: SupabaseClient,
  input: AlokasiStokItemInput,
): Promise<Result<AlokasiStok>> {
  if (!Number.isFinite(input.qtyAlokasi) || input.qtyAlokasi <= 0) {
    return fail("Jumlah alokasi harus lebih dari nol.");
  }

  // Hitung sisa kebutuhan baris pesanan
  const { data: existingItemAlloc, error: allocErr } = await supabase
    .from("alokasi_stok")
    .select("qty::text")
    .eq("pesanan_item_id", input.pesananItemId)
    .eq("status", "teralokasi");

  if (allocErr) return fail(allocErr.message);

  let sudahTeralokasi = 0;
  for (const row of existingItemAlloc ?? []) {
    sudahTeralokasi += Number(row.qty ?? 0);
  }

  const sisaKebutuhan =
    Math.round(
      (input.qtyDimintaBaris -
        (input.qtyTerkirimBaris ?? 0) -
        sudahTeralokasi +
        Number.EPSILON) *
        10000,
    ) / 10000;

  if (input.qtyAlokasi > sisaKebutuhan) {
    return fail("Alokasi melebihi jumlah yang dipesan.");
  }

  // Periksa ketersediaan di gudang
  const ketersediaanRes = await getKetersediaanProdukGudang(
    supabase,
    input.produkId,
    input.gudangId,
  );
  if (!ketersediaanRes.ok) return fail(ketersediaanRes.message);

  const tersedia = ketersediaanRes.data.tersediaQty;
  if (input.qtyAlokasi > tersedia) {
    return fail(
      `Stok tersedia hanya ${tersedia}. Alokasi tidak boleh melebihi stok tersedia.`,
    );
  }

  const { data: inserted, error: insertErr } = await supabase
    .from("alokasi_stok")
    .insert({
      pesanan_id: input.pesananId,
      pesanan_item_id: input.pesananItemId,
      produk_id: input.produkId,
      gudang_id: input.gudangId,
      qty: input.qtyAlokasi,
      status: "teralokasi",
      created_by: input.actorId,
      updated_by: input.actorId,
    })
    .select(
      "id, pesanan_id, pesanan_item_id, produk_id, gudang_id, qty::text, status, created_by, created_at, updated_by, updated_at",
    )
    .single();

  if (insertErr || !inserted) {
    return fail(insertErr?.message ?? "Gagal menyimpan alokasi stok.");
  }

  // Race condition guard (AC-04): pastikan tidak melebihi saldo fisik setelah insert
  const postCheck = await getKetersediaanProdukGudang(
    supabase,
    input.produkId,
    input.gudangId,
  );
  if (postCheck.ok && postCheck.data.alokasiAktifQty > postCheck.data.saldoQty) {
    await supabase.from("alokasi_stok").delete().eq("id", inserted.id);
    return fail("Stok tersedia berubah. Muat ulang dan coba lagi.");
  }

  return ok({
    id: String(inserted.id),
    pesanan_id: String(inserted.pesanan_id),
    pesanan_item_id: String(inserted.pesanan_item_id),
    produk_id: String(inserted.produk_id),
    gudang_id: String(inserted.gudang_id),
    qty: String(inserted.qty),
    status: inserted.status as AlokasiStok["status"],
    created_by: inserted.created_by ? String(inserted.created_by) : null,
    created_at: String(inserted.created_at),
    updated_by: inserted.updated_by ? String(inserted.updated_by) : null,
    updated_at: String(inserted.updated_at),
  });
}

/**
 * PD-003 (AC-05): Melepas seluruh alokasi aktif milik pesanan (mis. saat pembatalan).
 */
export async function lepasAlokasiPesanan(
  supabase: SupabaseClient,
  pesananId: string,
  actorId: string,
): Promise<Result<{ dilepasCount: number }>> {
  const { data, error } = await supabase
    .from("alokasi_stok")
    .update({
      status: "dilepas",
      updated_by: actorId,
      updated_at: new Date().toISOString(),
    })
    .eq("pesanan_id", pesananId)
    .eq("status", "teralokasi")
    .select("id");

  if (error) return fail(error.message);
  return ok({ dilepasCount: (data ?? []).length });
}
