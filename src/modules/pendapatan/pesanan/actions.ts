"use server";

import { revalidatePath } from "next/cache";

import {
  batalkanDokumen,
  buatDokumen,
  getDokumen,
  pindahStatusDokumen,
  revisiDokumen,
} from "@/core/dokumen";
import {
  alokasiStokPesanan,
  lepasAlokasiPesanan,
  listAlokasiPesanan,
  listGudangAktif,
} from "@/core/inventory";
import { getPelanggan } from "@/core/pelanggan";
import { requireIzin } from "@/lib/auth/server";
import { fail, ok, type Result } from "@/lib/result";
import { createAdminClient } from "@/lib/supabase/admin";

import {
  cekMelewatiBatasKredit,
  hitungBarisPesanan,
  hitungTotalPesanan,
} from "./calc";
import { PATH_PESANAN } from "./constants";
import { getTarifPpnAktif, hitungExposurePelanggan } from "./queries";
import { isValidUuid, pesananFormSchema, type PesananFormInput } from "./schema";

export async function createPesananAction(
  input: PesananFormInput,
): Promise<Result<{ id: string; nomor: string }>> {
  let profile;
  try {
    const sesi = await requireIzin("buat_pesanan");
    profile = sesi.profile;
  } catch (err: unknown) {
    return fail(err instanceof Error ? err.message : "Akses ditolak.");
  }

  const parsed = pesananFormSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Data pesanan tidak valid.");
  }

  const supabase = createAdminClient();
  if (!supabase) return fail("Layanan basis data tidak tersedia.");

  // PRE-03: Pastikan pelanggan aktif
  const pelRes = await getPelanggan(supabase, parsed.data.pelangganId);
  if (!pelRes.ok) return fail("Pelanggan tidak ditemukan.");
  if (pelRes.data.status !== "aktif") {
    return fail("Pelanggan tidak aktif dan tidak bisa dipakai untuk pesanan baru.");
  }

  const tarifPpn = await getTarifPpnAktif(supabase, parsed.data.tanggal);
  const totals = hitungTotalPesanan(parsed.data.items, tarifPpn);

  // PRE-04: Dapatkan nomor dokumen & riwayat awal dari core/dokumen
  const dokRes = await buatDokumen(supabase, {
    tipe: "SO",
    actorId: profile.id,
    nominal: totals.total.toFixed(2),
    tanggal: parsed.data.tanggal,
  });

  if (!dokRes.ok) {
    return fail(dokRes.message);
  }

  const dokumen = dokRes.data.dokumen;

  const { data: pesananData, error: insertErr } = await supabase
    .from("pesanan")
    .insert({
      dokumen_id: dokumen.id,
      nomor: dokumen.nomor,
      tanggal: parsed.data.tanggal,
      pelanggan_id: parsed.data.pelangganId,
      termin_hari: parsed.data.terminHari,
      status: "DRAFT",
      nilai_kotor: totals.nilaiKotor,
      diskon_total: totals.diskonTotal,
      dpp: totals.dpp,
      ppn: totals.ppn,
      total: totals.total,
      tarif_ppn: tarifPpn,
      created_by: profile.id,
      updated_by: profile.id,
    })
    .select("id, nomor")
    .single();

  if (insertErr || !pesananData) {
    return fail("Gagal menyimpan header pesanan.");
  }

  if (parsed.data.items.length > 0) {
    const rows = parsed.data.items.map((item, idx) => {
      const calc = hitungBarisPesanan(
        item.qty,
        item.hargaSatuan,
        item.diskonPersen,
        tarifPpn,
      );
      return {
        pesanan_id: pesananData.id,
        produk_id: item.produkId,
        urutan: idx + 1,
        qty: item.qty,
        harga_satuan: item.hargaSatuan,
        diskon_persen: item.diskonPersen,
        nilai_kotor: calc.nilaiKotor,
        diskon_nilai: calc.diskonNilai,
        dpp: calc.dpp,
        ppn: calc.ppn,
        total: calc.total,
      };
    });

    const { error: itemsErr } = await supabase.from("pesanan_item").insert(rows);
    if (itemsErr) {
      return fail("Pesanan tersimpan, namun gagal menyimpan rincian barang.");
    }
  }

  revalidatePath(PATH_PESANAN);
  return ok({ id: String(pesananData.id), nomor: String(pesananData.nomor) });
}

export async function updatePesananAction(
  id: string,
  input: PesananFormInput,
): Promise<Result<{ id: string }>> {
  if (!isValidUuid(id)) return fail("ID pesanan tidak valid.");

  let profile;
  try {
    const sesi = await requireIzin("buat_pesanan");
    profile = sesi.profile;
  } catch (err: unknown) {
    return fail(err instanceof Error ? err.message : "Akses ditolak.");
  }

  const parsed = pesananFormSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Data pesanan tidak valid.");
  }

  const supabase = createAdminClient();
  if (!supabase) return fail("Layanan basis data tidak tersedia.");

  const { data: existing, error: fetchErr } = await supabase
    .from("pesanan")
    .select("id, status, created_by")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr || !existing) return fail("Pesanan tidak ditemukan.");

  if (existing.status !== "DRAFT" && existing.status !== "REVISI") {
    return fail(
      "Pesanan yang sudah diverifikasi tidak dapat diubah. Batalkan lalu buat pesanan baru.",
    );
  }

  if (existing.created_by !== profile.id) {
    return fail("Hanya pembuat pesanan yang dapat mengubah draf ini.");
  }

  const pelRes = await getPelanggan(supabase, parsed.data.pelangganId);
  if (!pelRes.ok) return fail("Pelanggan tidak ditemukan.");
  if (pelRes.data.status !== "aktif") {
    return fail("Pelanggan tidak aktif dan tidak bisa dipakai untuk pesanan baru.");
  }

  const tarifPpn = await getTarifPpnAktif(supabase, parsed.data.tanggal);
  const totals = hitungTotalPesanan(parsed.data.items, tarifPpn);

  const { error: updateErr } = await supabase
    .from("pesanan")
    .update({
      tanggal: parsed.data.tanggal,
      pelanggan_id: parsed.data.pelangganId,
      termin_hari: parsed.data.terminHari,
      nilai_kotor: totals.nilaiKotor,
      diskon_total: totals.diskonTotal,
      dpp: totals.dpp,
      ppn: totals.ppn,
      total: totals.total,
      tarif_ppn: tarifPpn,
      updated_by: profile.id,
    })
    .eq("id", id)
    .in("status", ["DRAFT", "REVISI"]);

  if (updateErr) {
    return fail("Gagal memperbarui pesanan.");
  }

  await supabase.from("pesanan_item").delete().eq("pesanan_id", id);

  if (parsed.data.items.length > 0) {
    const rows = parsed.data.items.map((item, idx) => {
      const calc = hitungBarisPesanan(
        item.qty,
        item.hargaSatuan,
        item.diskonPersen,
        tarifPpn,
      );
      return {
        pesanan_id: id,
        produk_id: item.produkId,
        urutan: idx + 1,
        qty: item.qty,
        harga_satuan: item.hargaSatuan,
        diskon_persen: item.diskonPersen,
        nilai_kotor: calc.nilaiKotor,
        diskon_nilai: calc.diskonNilai,
        dpp: calc.dpp,
        ppn: calc.ppn,
        total: calc.total,
      };
    });

    const { error: itemsErr } = await supabase.from("pesanan_item").insert(rows);
    if (itemsErr) return fail("Gagal menyimpan rincian barang.");
  }

  revalidatePath(PATH_PESANAN);
  revalidatePath(`${PATH_PESANAN}/${id}`);
  return ok({ id });
}

export async function verifikasiPesananAction(
  id: string,
): Promise<Result<{ status: string; message: string }>> {
  if (!isValidUuid(id)) return fail("ID pesanan tidak valid.");

  let profile;
  try {
    const sesi = await requireIzin("verifikasi_pesanan");
    profile = sesi.profile;
  } catch (err: unknown) {
    return fail(err instanceof Error ? err.message : "Akses ditolak.");
  }

  const supabase = createAdminClient();
  if (!supabase) return fail("Layanan basis data tidak tersedia.");

  const { data: pesanan, error: fetchErr } = await supabase
    .from("pesanan")
    .select(
      "id, dokumen_id, pelanggan_id, status, created_by, tanggal, total::text",
    )
    .eq("id", id)
    .maybeSingle();

  if (fetchErr || !pesanan) return fail("Pesanan tidak ditemukan.");

  if (pesanan.status === "DIBATALKAN") {
    return fail("Pesanan dibatalkan tidak dapat diverifikasi.");
  }

  if (pesanan.status !== "DRAFT" && pesanan.status !== "REVISI") {
    return fail("Pesanan ini tidak dalam status yang bisa diverifikasi.");
  }

  // PRE-05 / PQ-09: Pembuat pesanan tidak boleh memverifikasi pesanannya sendiri
  if (pesanan.created_by === profile.id) {
    return fail("Pembuat pesanan tidak dapat memverifikasi pesanannya sendiri.");
  }

  const { data: items } = await supabase
    .from("pesanan_item")
    .select("id, qty::text, harga_satuan::text, diskon_persen::text")
    .eq("pesanan_id", id);

  // PRE-01: Minimal satu baris, qty > 0
  if (!items || items.length === 0) {
    return fail("Pesanan belum punya barang. Tambahkan minimal satu baris.");
  }

  const parsedItems = items.map((it) => ({
    qty: Number(it.qty ?? 0),
    hargaSatuan: Number(it.harga_satuan ?? 0),
    diskonPersen: Number(it.diskon_persen ?? 0),
  }));

  if (parsedItems.some((it) => it.qty <= 0)) {
    return fail("Jumlah harus lebih dari nol.");
  }

  // Hitung ulang menggunakan tarif T yang berlaku pada tanggal verifikasi (POST-01)
  const todayStr = new Date().toISOString().split("T")[0];
  const tarifPpn = await getTarifPpnAktif(supabase, todayStr);
  const totals = hitungTotalPesanan(parsedItems, tarifPpn);

  const pelRes = await getPelanggan(supabase, String(pesanan.pelanggan_id));
  if (!pelRes.ok) return fail("Pelanggan tidak ditemukan.");
  const batasKredit = Number(pelRes.data.batasKredit ?? 0);

  // Hitung exposure pelanggan sebelum pesanan ini (D-16)
  const exposureSebelumnya = await hitungExposurePelanggan(
    supabase,
    String(pesanan.pelanggan_id),
    id,
  );
  const overLimit = cekMelewatiBatasKredit(
    exposureSebelumnya,
    totals.total,
    batasKredit,
  );

  if (!pesanan.dokumen_id) {
    return fail("Referensi dokumen inti tidak ditemukan.");
  }

  const dokRes = await getDokumen(supabase, String(pesanan.dokumen_id));
  if (!dokRes.ok || !dokRes.data) {
    return fail("Dokumen inti tidak ditemukan.");
  }

  // Conditional update untuk mencegah race condition (Failure semantics)
  const { data: lockedRow, error: lockErr } = await supabase
    .from("pesanan")
    .update({
      status: "VERIFIED",
      nilai_kotor: totals.nilaiKotor,
      diskon_total: totals.diskonTotal,
      dpp: totals.dpp,
      ppn: totals.ppn,
      total: totals.total,
      tarif_ppn: tarifPpn,
      verified_by: profile.id,
      verified_at: new Date().toISOString(),
      updated_by: profile.id,
    })
    .eq("id", id)
    .in("status", ["DRAFT", "REVISI"])
    .select("id")
    .maybeSingle();

  if (lockErr || !lockedRow) {
    return fail("Dokumen sudah diproses. Muat ulang halaman.");
  }

  // Catat VERIFIED di riwayat_status via core/dokumen
  const transVerified = await pindahStatusDokumen(supabase, {
    dokumenId: String(pesanan.dokumen_id),
    versi: dokRes.data.versi,
    statusTujuan: "VERIFIED",
    aksi: "VERIFIKASI",
    actorId: profile.id,
  });

  if (!transVerified.ok) {
    return fail(transVerified.message);
  }

  let statusAkhir = "VERIFIED";
  let pesanHasil = "Pesanan berhasil diverifikasi.";

  if (overLimit) {
    const transKredit = await pindahStatusDokumen(supabase, {
      dokumenId: String(pesanan.dokumen_id),
      versi: transVerified.data.dokumen.versi,
      statusTujuan: "MENUNGGU_PERSETUJUAN_KREDIT",
      aksi: "CEK_KREDIT",
      actorId: profile.id,
      alasan: "Exposure pelanggan melewati batas kredit.",
    });

    if (transKredit.ok) {
      await supabase
        .from("pesanan")
        .update({
          status: "MENUNGGU_PERSETUJUAN_KREDIT",
          updated_by: profile.id,
        })
        .eq("id", id);

      statusAkhir = "MENUNGGU_PERSETUJUAN_KREDIT";
      pesanHasil =
        "Pelanggan melewati batas kredit. Pesanan menunggu persetujuan Manajemen.";
    }
  }

  revalidatePath(PATH_PESANAN);
  revalidatePath(`${PATH_PESANAN}/${id}`);
  return ok({ status: statusAkhir, message: pesanHasil });
}

export async function revisiPesananAction(
  id: string,
  alasan: string,
): Promise<Result<{ status: string }>> {
  if (!isValidUuid(id)) return fail("ID pesanan tidak valid.");
  if (!alasan || !alasan.trim()) {
    return fail("Alasan pengembalian wajib diisi.");
  }

  let profile;
  try {
    const sesi = await requireIzin("verifikasi_pesanan");
    profile = sesi.profile;
  } catch (err: unknown) {
    return fail(err instanceof Error ? err.message : "Akses ditolak.");
  }

  const supabase = createAdminClient();
  if (!supabase) return fail("Layanan basis data tidak tersedia.");

  const { data: pesanan } = await supabase
    .from("pesanan")
    .select("id, dokumen_id, status, created_by")
    .eq("id", id)
    .maybeSingle();

  if (!pesanan) return fail("Pesanan tidak ditemukan.");
  if (pesanan.status !== "DRAFT") {
    return fail("Hanya pesanan DRAFT yang dapat dikembalikan untuk revisi.");
  }
  if (pesanan.created_by === profile.id) {
    return fail("Pembuat pesanan tidak dapat mengembalikan pesanannya sendiri.");
  }
  if (!pesanan.dokumen_id) return fail("Dokumen inti tidak ditemukan.");

  const dokRes = await getDokumen(supabase, String(pesanan.dokumen_id));
  if (!dokRes.ok || !dokRes.data) return fail("Dokumen inti tidak ditemukan.");

  const transRes = await revisiDokumen(supabase, {
    dokumenId: String(pesanan.dokumen_id),
    versi: dokRes.data.versi,
    actorId: profile.id,
    alasan: alasan.trim(),
  });

  if (!transRes.ok) return fail(transRes.message);

  await supabase
    .from("pesanan")
    .update({
      status: "REVISI",
      alasan_revisi: alasan.trim(),
      updated_by: profile.id,
    })
    .eq("id", id);

  revalidatePath(PATH_PESANAN);
  revalidatePath(`${PATH_PESANAN}/${id}`);
  return ok({ status: "REVISI" });
}

export async function overrideKreditAction(
  id: string,
  alasan: string,
): Promise<Result<{ status: string }>> {
  if (!isValidUuid(id)) return fail("ID pesanan tidak valid.");
  if (!alasan || !alasan.trim()) {
    return fail("Alasan override batas kredit wajib diisi.");
  }

  let profile;
  try {
    const sesi = await requireIzin("override_batas_kredit");
    profile = sesi.profile;
  } catch {
    return fail("Hanya Manajemen yang dapat menyetujui melewati batas kredit.");
  }

  const supabase = createAdminClient();
  if (!supabase) return fail("Layanan basis data tidak tersedia.");

  const { data: pesanan } = await supabase
    .from("pesanan")
    .select("id, dokumen_id, status")
    .eq("id", id)
    .maybeSingle();

  if (!pesanan) return fail("Pesanan tidak ditemukan.");
  if (pesanan.status !== "MENUNGGU_PERSETUJUAN_KREDIT") {
    return fail("Pesanan ini tidak sedang menunggu persetujuan kredit.");
  }
  if (!pesanan.dokumen_id) return fail("Dokumen inti tidak ditemukan.");

  const dokRes = await getDokumen(supabase, String(pesanan.dokumen_id));
  if (!dokRes.ok || !dokRes.data) return fail("Dokumen inti tidak ditemukan.");

  const transRes = await pindahStatusDokumen(supabase, {
    dokumenId: String(pesanan.dokumen_id),
    versi: dokRes.data.versi,
    statusTujuan: "VERIFIED",
    aksi: "OVERRIDE",
    actorId: profile.id,
    alasan: alasan.trim(),
  });

  if (!transRes.ok) return fail(transRes.message);

  await supabase
    .from("pesanan")
    .update({
      status: "VERIFIED",
      alasan_override: alasan.trim(),
      verified_by: profile.id,
      verified_at: new Date().toISOString(),
      updated_by: profile.id,
    })
    .eq("id", id);

  revalidatePath(PATH_PESANAN);
  revalidatePath(`${PATH_PESANAN}/${id}`);
  return ok({ status: "VERIFIED" });
}

export async function batalkanPesananAction(
  id: string,
  alasan: string,
): Promise<Result<{ status: string }>> {
  if (!isValidUuid(id)) return fail("ID pesanan tidak valid.");
  if (!alasan || !alasan.trim()) {
    return fail("Alasan pembatalan wajib diisi.");
  }

  let profile;
  try {
    const sesi = await requireIzin("batalkan_pesanan");
    profile = sesi.profile;
  } catch (err: unknown) {
    return fail(err instanceof Error ? err.message : "Akses ditolak.");
  }

  const supabase = createAdminClient();
  if (!supabase) return fail("Layanan basis data tidak tersedia.");

  const { data: pesanan } = await supabase
    .from("pesanan")
    .select("id, dokumen_id, status, created_by")
    .eq("id", id)
    .maybeSingle();

  if (!pesanan) return fail("Pesanan tidak ditemukan.");

  if (
    ["TERKIRIM_SEBAGIAN", "TERKIRIM", "DIFAKTURKAN", "SELESAI"].includes(
      String(pesanan.status),
    )
  ) {
    return fail(
      "Pesanan sudah memiliki pengiriman dan tidak dapat dibatalkan.",
    );
  }

  if (pesanan.status === "DIBATALKAN") {
    return fail("Pesanan sudah dibatalkan.");
  }

  if (
    pesanan.status !== "MENUNGGU_PERSETUJUAN_KREDIT" &&
    profile.peran === "Manajemen"
  ) {
    return fail("Manajemen hanya dapat membatalkan pesanan yang menunggu kredit.");
  }

  if (!pesanan.dokumen_id) return fail("Dokumen inti tidak ditemukan.");

  const dokRes = await getDokumen(supabase, String(pesanan.dokumen_id));
  if (!dokRes.ok || !dokRes.data) return fail("Dokumen inti tidak ditemukan.");

  const transRes = await batalkanDokumen(supabase, {
    dokumenId: String(pesanan.dokumen_id),
    versi: dokRes.data.versi,
    actorId: profile.id,
    alasan: alasan.trim(),
  });

  if (!transRes.ok) return fail(transRes.message);

  // Lepas alokasi aktif jika pesanan sudah memiliki alokasi stok (PD-003 AC-05)
  await lepasAlokasiPesanan(supabase, id, profile.id);

  await supabase
    .from("pesanan")
    .update({
      status: "DIBATALKAN",
      alasan_batal: alasan.trim(),
      updated_by: profile.id,
    })
    .eq("id", id);

  revalidatePath(PATH_PESANAN);
  revalidatePath(`${PATH_PESANAN}/${id}`);
  revalidatePath("/pendapatan/ketersediaan");
  return ok({ status: "DIBATALKAN" });
}

export interface AlokasiBarisRequest {
  pesananItemId: string;
  produkId: string;
  gudangId?: string;
  qtyAlokasi: number;
}

export async function alokasiStokAction(
  pesananId: string,
  itemsRequest: AlokasiBarisRequest[],
): Promise<Result<{ status: string; message: string }>> {
  if (!isValidUuid(pesananId)) return fail("ID pesanan tidak valid.");

  let profile;
  try {
    const sesi = await requireIzin("cek_alokasi_stok");
    profile = sesi.profile;
  } catch (err: unknown) {
    return fail(err instanceof Error ? err.message : "Akses ditolak.");
  }

  const supabase = createAdminClient();
  if (!supabase) return fail("Layanan basis data tidak tersedia.");

  const { data: pesanan, error: fetchErr } = await supabase
    .from("pesanan")
    .select("id, dokumen_id, status")
    .eq("id", pesananId)
    .maybeSingle();

  if (fetchErr || !pesanan) return fail("Pesanan tidak ditemukan.");

  if (pesanan.status === "DIBATALKAN") {
    return fail("Pesanan dibatalkan. Stok tidak dapat dialokasikan.");
  }

  if (pesanan.status !== "VERIFIED" && pesanan.status !== "MENUNGGU_STOK") {
    return fail("Pesanan belum terverifikasi. Stok tidak dapat dialokasikan.");
  }

  const gudangRes = await listGudangAktif(supabase);
  if (!gudangRes.ok) return fail(gudangRes.message);
  const gudangList = gudangRes.data;
  if (gudangList.length === 0) {
    return fail("Tidak ada gudang aktif yang tersedia.");
  }

  const { data: pesananItems } = await supabase
    .from("pesanan_item")
    .select("id, produk_id, qty::text")
    .eq("pesanan_id", pesananId);

  const itemMap = new Map<string, { produkId: string; qty: number }>();
  for (const row of pesananItems ?? []) {
    itemMap.set(String(row.id), {
      produkId: String(row.produk_id),
      qty: Number(row.qty ?? 0),
    });
  }

  const positiveRequests = itemsRequest.filter((r) => r.qtyAlokasi > 0);
  if (positiveRequests.length === 0) {
    return fail("Jumlah alokasi harus lebih dari nol.");
  }

  for (const req of positiveRequests) {
    const targetGudangId =
      gudangList.length === 1 ? gudangList[0].id : (req.gudangId ?? "").trim();

    if (!targetGudangId) {
      return fail("Pilih gudang untuk alokasi.");
    }

    const itemInfo = itemMap.get(req.pesananItemId);
    if (!itemInfo) {
      return fail("Baris pesanan tidak ditemukan.");
    }

    const allocRes = await alokasiStokPesanan(supabase, {
      pesananId,
      pesananItemId: req.pesananItemId,
      produkId: itemInfo.produkId,
      gudangId: targetGudangId,
      qtyDimintaBaris: itemInfo.qty,
      qtyAlokasi: req.qtyAlokasi,
      actorId: profile.id,
    });

    if (!allocRes.ok) {
      return fail(allocRes.message);
    }
  }

  // Evaluasi apakah seluruh baris sudah teralokasi penuh (AC-08)
  const allAllocRes = await listAlokasiPesanan(supabase, pesananId);
  if (!allAllocRes.ok) return fail(allAllocRes.message);

  const allocPerItem = new Map<string, number>();
  for (const a of allAllocRes.data) {
    if (a.status === "teralokasi") {
      allocPerItem.set(
        a.pesanan_item_id,
        (allocPerItem.get(a.pesanan_item_id) ?? 0) + Number(a.qty),
      );
    }
  }

  let semuaPenuh = true;
  for (const [itemId, info] of itemMap.entries()) {
    const teralokasi = allocPerItem.get(itemId) ?? 0;
    if (teralokasi + 0.0001 < info.qty) {
      semuaPenuh = false;
      break;
    }
  }

  const statusTujuan = semuaPenuh ? "SIAP_KIRIM" : "MENUNGGU_STOK";

  if (statusTujuan !== pesanan.status && pesanan.dokumen_id) {
    const dokRes = await getDokumen(supabase, String(pesanan.dokumen_id));
    if (dokRes.ok && dokRes.data) {
      const transRes = await pindahStatusDokumen(supabase, {
        dokumenId: String(pesanan.dokumen_id),
        versi: dokRes.data.versi,
        statusTujuan,
        aksi: "CEK_STOK",
        actorId: profile.id,
      });

      if (transRes.ok) {
        await supabase
          .from("pesanan")
          .update({
            status: statusTujuan,
            updated_by: profile.id,
          })
          .eq("id", pesananId);
      }
    }
  }

  revalidatePath(PATH_PESANAN);
  revalidatePath(`${PATH_PESANAN}/${pesananId}`);
  revalidatePath("/pendapatan/ketersediaan");
  return ok({
    status: statusTujuan,
    message:
      statusTujuan === "SIAP_KIRIM"
        ? "Seluruh stok berhasil dialokasikan. Pesanan Siap Kirim."
        : "Alokasi sebagian tersimpan. Pesanan berstatus Menunggu Stok.",
  });
}
