"use server";

import { revalidatePath } from "next/cache";

import {
  batalkanDokumen,
  buatDokumen,
  getDokumen,
  pindahStatusDokumen,
} from "@/core/dokumen";
import {
  catatMutasi,
  getSaldoStok,
  lepasAlokasiItemSebagian,
  listAlokasiPesanan,
} from "@/core/inventory";
import { requireIzin } from "@/lib/auth/server";
import { fail, ok, type Result } from "@/lib/result";
import { createAdminClient } from "@/lib/supabase/admin";

import { PATH_PENGIRIMAN } from "./constants";
import {
  buktiTerimaSchema,
  isValidUuid,
  pengirimanFormSchema,
  type PengirimanFormInput,
} from "./schema";

type Row = Record<string, unknown>;

export async function createPengirimanAction(
  input: PengirimanFormInput,
): Promise<Result<{ id: string; nomor: string }>> {
  let profile;
  try {
    const sesi = await requireIzin("buat_pengiriman");
    profile = sesi.profile;
  } catch (err: unknown) {
    return fail(err instanceof Error ? err.message : "Akses ditolak.");
  }

  const parsed = pengirimanFormSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Data pengiriman tidak valid.");
  }

  const supabase = createAdminClient();
  if (!supabase) return fail("Layanan basis data tidak tersedia.");

  const { data: pesanan, error: pesErr } = await supabase
    .from("pesanan")
    .select("id, status")
    .eq("id", parsed.data.pesananId)
    .maybeSingle();

  if (pesErr || !pesanan) return fail("Pesanan tidak ditemukan.");

  // AC-01: Hanya dari SIAP_KIRIM atau TERKIRIM_SEBAGIAN
  if (pesanan.status !== "SIAP_KIRIM" && pesanan.status !== "TERKIRIM_SEBAGIAN") {
    return fail("Pesanan belum terverifikasi. Pengiriman tidak dapat dibuat.");
  }

  const allocRes = await listAlokasiPesanan(supabase, parsed.data.pesananId);
  if (!allocRes.ok) return fail(allocRes.message);

  const { data: pesItems } = await supabase
    .from("pesanan_item")
    .select("id, qty::text")
    .eq("pesanan_id", parsed.data.pesananId);

  const pesQtyMap = new Map<string, number>();
  for (const r of pesItems ?? []) {
    pesQtyMap.set(String(r.id), Number(r.qty ?? 0));
  }

  // Hitung qty terkirim sebelumnya per item
  const { data: shippedRows } = await supabase
    .from("pengiriman_item")
    .select("pesanan_item_id, qty::text, pengiriman:pengiriman_id!inner(status)")
    .eq("pengiriman.pesanan_id", parsed.data.pesananId)
    .in("pengiriman.status", ["DIKIRIM", "DITERIMA"]);

  const shippedMap = new Map<string, number>();
  for (const sr of (shippedRows ?? []) as unknown as Row[]) {
    const k = String(sr.pesanan_item_id);
    shippedMap.set(k, (shippedMap.get(k) ?? 0) + Number(sr.qty ?? 0));
  }

  for (const item of parsed.data.items) {
    const qtyPesanan = pesQtyMap.get(item.pesananItemId) ?? 0;
    const sudahKirim = shippedMap.get(item.pesananItemId) ?? 0;
    const sisaPesanan = Math.max(0, qtyPesanan - sudahKirim);

    // AC-10: Qty kirim <= sisa pesanan
    if (item.qty > sisaPesanan + 0.0001) {
      return fail("Qty kirim melebihi sisa jumlah pesanan.");
    }

    // AC-02: Qty kirim <= alokasi aktif baris di gudang terkait
    let alokasiAktif = 0;
    for (const a of allocRes.data) {
      if (
        a.pesanan_item_id === item.pesananItemId &&
        a.gudang_id === item.gudangId &&
        a.status === "teralokasi"
      ) {
        alokasiAktif += Number(a.qty);
      }
    }

    if (item.qty > alokasiAktif + 0.0001) {
      return fail("Qty kirim melebihi stok yang dialokasikan untuk pesanan.");
    }
  }

  const dokRes = await buatDokumen(supabase, {
    tipe: "SJ",
    actorId: profile.id,
    tanggal: parsed.data.tanggalPengiriman,
  });

  if (!dokRes.ok) return fail(dokRes.message);

  const dokumen = dokRes.data.dokumen;

  const { data: header, error: insertErr } = await supabase
    .from("pengiriman")
    .insert({
      dokumen_id: dokumen.id,
      nomor: dokumen.nomor,
      pesanan_id: parsed.data.pesananId,
      tanggal_pengiriman: parsed.data.tanggalPengiriman,
      status: "DRAFT",
      keterangan: parsed.data.keterangan?.trim() || null,
      created_by: profile.id,
      updated_by: profile.id,
    })
    .select("id, nomor")
    .single();

  if (insertErr || !header) {
    return fail("Gagal menyimpan draf pengiriman.");
  }

  const itemRows = parsed.data.items.map((it) => ({
    pengiriman_id: header.id,
    pesanan_item_id: it.pesananItemId,
    produk_id: it.produkId,
    gudang_id: it.gudangId,
    qty: it.qty,
  }));

  const { error: itemErr } = await supabase
    .from("pengiriman_item")
    .insert(itemRows);

  if (itemErr) {
    return fail("Gagal menyimpan rincian barang pengiriman.");
  }

  revalidatePath(PATH_PENGIRIMAN);
  return ok({ id: String(header.id), nomor: String(header.nomor) });
}

export async function kirimPengirimanAction(
  id: string,
): Promise<Result<{ status: string; message: string }>> {
  if (!isValidUuid(id)) return fail("ID pengiriman tidak valid.");

  let profile;
  try {
    const sesi = await requireIzin("buat_pengiriman");
    profile = sesi.profile;
  } catch (err: unknown) {
    return fail(err instanceof Error ? err.message : "Akses ditolak.");
  }

  const supabase = createAdminClient();
  if (!supabase) return fail("Layanan basis data tidak tersedia.");

  const { data: pengiriman, error: fetchErr } = await supabase
    .from("pengiriman")
    .select(
      `
      id, dokumen_id, nomor, pesanan_id, tanggal_pengiriman, status,
      pesanan:pesanan_id (id, dokumen_id, status, created_by)
    `,
    )
    .eq("id", id)
    .maybeSingle();

  if (fetchErr || !pengiriman) return fail("Pengiriman tidak ditemukan.");

  if (pengiriman.status !== "DRAFT") {
    return fail("Dokumen sudah diproses. Muat ulang halaman.");
  }

  const pes = pengiriman.pesanan as unknown as Row | null;
  if (!pes) return fail("Pesanan asal tidak ditemukan.");

  // AC-09 / D-42: Pembuat pesanan tidak boleh mengirim pesanannya sendiri
  if (String(pes.created_by) === profile.id) {
    return fail(
      "Pembuat pesanan tidak dapat mengirim barang untuk pesanannya sendiri.",
    );
  }

  const { data: items } = await supabase
    .from("pengiriman_item")
    .select("id, pesanan_item_id, produk_id, gudang_id, qty::text")
    .eq("pengiriman_id", id);

  if (!items || items.length === 0) {
    return fail("Pengiriman belum memiliki rincian barang.");
  }

  // AC-11: Pastikan saldo fisik di setiap gudang cukup sebelum mutasi apa pun
  for (const item of items) {
    const saldoRes = await getSaldoStok(
      supabase,
      String(item.produk_id),
      String(item.gudang_id),
    );
    if (!saldoRes.ok) return fail(saldoRes.message);
    const saldoQty = saldoRes.data ? Number(saldoRes.data.qty) : 0;
    if (saldoQty < Number(item.qty)) {
      return fail("Saldo fisik tidak cukup untuk pengiriman ini.");
    }
  }

  // Conditional lock pada status DRAFT (Failure semantics)
  const { data: lockedRow, error: lockErr } = await supabase
    .from("pengiriman")
    .update({
      status: "DIKIRIM",
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "DRAFT")
    .select("id")
    .maybeSingle();

  if (lockErr || !lockedRow) {
    return fail("Dokumen sudah diproses. Muat ulang halaman.");
  }

  // AC-03 & AC-12: Catat mutasi keluar via core/inventory & lepas alokasi
  for (const item of items) {
    const mutasiRes = await catatMutasi(supabase, {
      produkId: String(item.produk_id),
      gudangId: String(item.gudang_id),
      tanggal: String(pengiriman.tanggal_pengiriman),
      tipe: "KELUAR",
      qty: String(item.qty),
      sumberTipe: "PENGIRIMAN",
      sumberId: id,
      actorId: profile.id,
    });

    if (!mutasiRes.ok) {
      return fail(mutasiRes.message);
    }

    await lepasAlokasiItemSebagian(
      supabase,
      String(item.pesanan_item_id),
      String(item.gudang_id),
      Number(item.qty),
      profile.id,
    );
  }

  if (pengiriman.dokumen_id) {
    const dokRes = await getDokumen(supabase, String(pengiriman.dokumen_id));
    if (dokRes.ok && dokRes.data) {
      await pindahStatusDokumen(supabase, {
        dokumenId: String(pengiriman.dokumen_id),
        versi: dokRes.data.versi,
        statusTujuan: "DIKIRIM",
        aksi: "KIRIM",
        actorId: profile.id,
      });
    }
  }

  // AC-10: Update status pesanan (TERKIRIM_SEBAGIAN atau TERKIRIM)
  const pesananId = String(pengiriman.pesanan_id);
  const [{ data: pesItems }, { data: allShipped }] = await Promise.all([
    supabase
      .from("pesanan_item")
      .select("id, qty::text")
      .eq("pesanan_id", pesananId),
    supabase
      .from("pengiriman_item")
      .select("pesanan_item_id, qty::text, pengiriman:pengiriman_id!inner(status)")
      .eq("pengiriman.pesanan_id", pesananId)
      .in("pengiriman.status", ["DIKIRIM", "DITERIMA"]),
  ]);

  const shippedMap = new Map<string, number>();
  for (const sr of (allShipped ?? []) as unknown as Row[]) {
    const k = String(sr.pesanan_item_id);
    shippedMap.set(k, (shippedMap.get(k) ?? 0) + Number(sr.qty ?? 0));
  }

  let semuaTerkirim = true;
  for (const pi of pesItems ?? []) {
    const diminta = Number(pi.qty ?? 0);
    const terkirim = shippedMap.get(String(pi.id)) ?? 0;
    if (terkirim + 0.0001 < diminta) {
      semuaTerkirim = false;
      break;
    }
  }

  const nextPesStatus = semuaTerkirim ? "TERKIRIM" : "TERKIRIM_SEBAGIAN";
  if (pes.dokumen_id && String(pes.status) !== nextPesStatus) {
    const pesDokRes = await getDokumen(supabase, String(pes.dokumen_id));
    if (pesDokRes.ok && pesDokRes.data) {
      const transPes = await pindahStatusDokumen(supabase, {
        dokumenId: String(pes.dokumen_id),
        versi: pesDokRes.data.versi,
        statusTujuan: nextPesStatus,
        aksi: "KIRIM",
        actorId: profile.id,
      });
      if (transPes.ok) {
        await supabase
          .from("pesanan")
          .update({
            status: nextPesStatus,
            updated_by: profile.id,
          })
          .eq("id", pesananId);
      }
    }
  }

  revalidatePath(PATH_PENGIRIMAN);
  revalidatePath(`${PATH_PENGIRIMAN}/${pengiriman.nomor}`);
  revalidatePath(`/pendapatan/pesanan/${pesananId}`);
  return ok({
    status: "DIKIRIM",
    message: `Surat jalan ${pengiriman.nomor} terbit. Stok fisik telah dikurangi.`,
  });
}

export async function batalkanPengirimanAction(
  id: string,
  alasan: string,
): Promise<Result<{ status: string }>> {
  if (!isValidUuid(id)) return fail("ID pengiriman tidak valid.");
  if (!alasan || !alasan.trim()) {
    return fail("Alasan pembatalan wajib diisi.");
  }

  let profile;
  try {
    const sesi = await requireIzin("buat_pengiriman");
    profile = sesi.profile;
  } catch (err: unknown) {
    return fail(err instanceof Error ? err.message : "Akses ditolak.");
  }

  const supabase = createAdminClient();
  if (!supabase) return fail("Layanan basis data tidak tersedia.");

  const { data: pengiriman } = await supabase
    .from("pengiriman")
    .select("id, dokumen_id, nomor, status")
    .eq("id", id)
    .maybeSingle();

  if (!pengiriman) return fail("Pengiriman tidak ditemukan.");

  if (pengiriman.status === "DIKIRIM" || pengiriman.status === "DITERIMA") {
    return fail(
      "Pengiriman yang sudah dikirim tidak dapat dibatalkan. Gunakan retur penjualan.",
    );
  }

  if (pengiriman.status === "DIBATALKAN") {
    return fail("Pengiriman sudah dibatalkan.");
  }

  if (pengiriman.dokumen_id) {
    const dokRes = await getDokumen(supabase, String(pengiriman.dokumen_id));
    if (dokRes.ok && dokRes.data) {
      const trans = await batalkanDokumen(supabase, {
        dokumenId: String(pengiriman.dokumen_id),
        versi: dokRes.data.versi,
        actorId: profile.id,
        alasan: alasan.trim(),
      });
      if (!trans.ok) return fail(trans.message);
    }
  }

  await supabase
    .from("pengiriman")
    .update({
      status: "DIBATALKAN",
      alasan_batal: alasan.trim(),
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath(PATH_PENGIRIMAN);
  revalidatePath(`${PATH_PENGIRIMAN}/${pengiriman.nomor}`);
  return ok({ status: "DIBATALKAN" });
}

export async function terimaPengirimanAction(
  id: string,
  tanggalTerima: string,
  namaPenerima: string,
): Promise<Result<{ status: string }>> {
  if (!isValidUuid(id)) return fail("ID pengiriman tidak valid.");

  const parsed = buktiTerimaSchema.safeParse({ tanggalTerima, namaPenerima });
  if (!parsed.success) {
    return fail("Tanggal terima dan nama penerima wajib diisi.");
  }

  let profile;
  try {
    const sesi = await requireIzin("buat_pengiriman");
    profile = sesi.profile;
  } catch (err: unknown) {
    return fail(err instanceof Error ? err.message : "Akses ditolak.");
  }

  const supabase = createAdminClient();
  if (!supabase) return fail("Layanan basis data tidak tersedia.");

  const { data: pengiriman } = await supabase
    .from("pengiriman")
    .select("id, dokumen_id, nomor, status")
    .eq("id", id)
    .maybeSingle();

  if (!pengiriman) return fail("Pengiriman tidak ditemukan.");
  if (pengiriman.status !== "DIKIRIM") {
    return fail("Bukti terima hanya dapat dicatat untuk pengiriman berstatus DIKIRIM.");
  }

  if (pengiriman.dokumen_id) {
    const dokRes = await getDokumen(supabase, String(pengiriman.dokumen_id));
    if (dokRes.ok && dokRes.data) {
      const trans = await pindahStatusDokumen(supabase, {
        dokumenId: String(pengiriman.dokumen_id),
        versi: dokRes.data.versi,
        statusTujuan: "DITERIMA",
        aksi: "TERIMA",
        actorId: profile.id,
        alasan: `Diterima oleh ${parsed.data.namaPenerima} pada ${parsed.data.tanggalTerima}`,
      });
      if (!trans.ok) return fail(trans.message);
    }
  }

  const { error: updErr } = await supabase
    .from("pengiriman")
    .update({
      status: "DITERIMA",
      tanggal_terima: parsed.data.tanggalTerima,
      nama_penerima: parsed.data.namaPenerima,
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updErr) return fail("Gagal menyimpan bukti penerimaan.");

  revalidatePath(PATH_PENGIRIMAN);
  revalidatePath(`${PATH_PENGIRIMAN}/${pengiriman.nomor}`);
  return ok({ status: "DITERIMA" });
}
