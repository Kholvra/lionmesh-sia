"use server";

import { revalidatePath } from "next/cache";

import {
  buatDokumen,
  getDokumen,
  pindahStatusDokumen,
} from "@/core/dokumen";
import { catatMutasi, getSaldoStok } from "@/core/inventory";
import { postJournal } from "@/core/ledger";
import { cekIzin } from "@/lib/auth/permissions";
import { requireIzin, requireSesi } from "@/lib/auth/server";
import { fail, ok, type Result } from "@/lib/result";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  hitungKreditMemoBaris,
  hitungNilaiMasukStok,
  hitungSisaBolehRetur,
  round2,
} from "./calc";
import { PATH_RETUR } from "./constants";
import {
  createReturSchema,
  isValidUuid,
  qcReturSchema,
  type CreateReturInput,
  type QcReturInput,
} from "./schema";

type Row = Record<string, unknown>;

const NAMA_BULAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

async function isPeriodeTerkunci(
  supabase: ReturnType<typeof createAdminClient>,
  tanggal: string,
): Promise<string | null> {
  if (!supabase) return null;
  const parts = tanggal.split("-").map(Number);
  const tahun = parts[0];
  const bulan = parts[1];

  const { data } = await supabase
    .from("periode_akuntansi")
    .select("status")
    .eq("tahun", tahun)
    .eq("bulan", bulan)
    .maybeSingle();

  if (data && data.status === "kunci") {
    const namaBulan = NAMA_BULAN[bulan - 1] ?? String(bulan);
    return `Periode ${namaBulan} ${tahun} sudah ditutup. Retur tidak dapat diproses.`;
  }
  return null;
}

export async function createReturAction(
  input: CreateReturInput,
): Promise<Result<{ id: string; nomor: string }>> {
  let profile;
  try {
    const sesi = await requireSesi();
    profile = sesi.profile;
    const bolehAjukan =
      cekIzin(profile.peran, "buat_pesanan") ||
      cekIzin(profile.peran, "buat_pengiriman");
    if (!bolehAjukan) {
      return fail(
        "Hanya peran Penjualan atau Gudang yang dapat mengajukan retur penjualan.",
      );
    }
  } catch (err: unknown) {
    return fail(err instanceof Error ? err.message : "Akses ditolak.");
  }

  const parsed = createReturSchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      parsed.error.issues[0]?.message ?? "Data pengajuan retur tidak valid.",
    );
  }

  const supabase = createAdminClient();
  if (!supabase) return fail("Layanan basis data tidak tersedia.");

  // Cek faktur asal
  const { data: faktur, error: fErr } = await supabase
    .from("faktur")
    .select("id, pelanggan_id, status")
    .eq("id", parsed.data.fakturId)
    .maybeSingle();

  if (fErr || !faktur) {
    return fail("Retur harus merujuk faktur penjualan.");
  }

  if (
    faktur.status !== "DITERBITKAN" &&
    faktur.status !== "SEBAGIAN_LUNAS" &&
    faktur.status !== "LUNAS"
  ) {
    return fail("Retur hanya dapat diajukan untuk faktur yang sudah diterbitkan.");
  }

  // Ambil baris faktur asal beserta gudang dari pengiriman_item
  const { data: fItems } = await supabase
    .from("faktur_item")
    .select(
      `
      id,
      faktur_id,
      produk_id,
      qty::text,
      harga_satuan::text,
      diskon_persen::text,
      pengiriman_item:pengiriman_item_id ( gudang_id )
    `,
    )
    .eq("faktur_id", parsed.data.fakturId);

  const fItemMap = new Map<string, Row>();
  for (const row of (fItems ?? []) as unknown as Row[]) {
    fItemMap.set(String(row.id), row);
  }

  // AC-01: Semua item harus berasal dari faktur yang dirujuk
  for (const reqItem of parsed.data.items) {
    if (!fItemMap.has(reqItem.fakturItemId)) {
      return fail("Retur harus merujuk faktur penjualan.");
    }
  }

  // AC-11: Hitung qty kumulatif yang sudah diretur per baris faktur
  const fakturItemIds = parsed.data.items.map((i) => i.fakturItemId);
  const { data: prevReturs } = await supabase
    .from("retur_penjualan_item")
    .select("faktur_item_id, qty_retur::text, qty_lulus::text, retur:retur_id ( status )")
    .in("faktur_item_id", fakturItemIds);

  const prevMap = new Map<string, number>();
  for (const pr of (prevReturs ?? []) as unknown as Row[]) {
    const ret = (pr.retur ?? {}) as Row;
    const st = String(ret.status ?? "");
    if (st === "DITOLAK" || st === "DIBATALKAN") continue;
    const fId = String(pr.faktur_item_id);
    const qtyPakai =
      st === "SELESAI" ? Number(pr.qty_lulus ?? 0) : Number(pr.qty_retur ?? 0);
    prevMap.set(fId, (prevMap.get(fId) ?? 0) + qtyPakai);
  }

  const itemInserts: Array<{
    faktur_item_id: string;
    produk_id: string;
    gudang_id: string;
    qty_retur: number;
    harga_satuan: number;
    diskon_persen: number;
  }> = [];

  for (const reqItem of parsed.data.items) {
    const fRow = fItemMap.get(reqItem.fakturItemId)!;
    const qtyDikirim = Number(fRow.qty ?? 0);
    const qtySudah = prevMap.get(reqItem.fakturItemId) ?? 0;
    const sisaBoleh = hitungSisaBolehRetur(qtyDikirim, qtySudah);

    if (reqItem.qtyRetur > sisaBoleh + 0.0001) {
      return fail(
        "Jumlah retur melebihi jumlah yang pernah dikirim untuk baris ini.",
      );
    }

    const pengItem = (fRow.pengiriman_item ?? {}) as Row;
    itemInserts.push({
      faktur_item_id: reqItem.fakturItemId,
      produk_id: String(fRow.produk_id),
      gudang_id: String(pengItem.gudang_id),
      qty_retur: reqItem.qtyRetur,
      harga_satuan: Number(fRow.harga_satuan ?? 0),
      diskon_persen: Number(fRow.diskon_persen ?? 0),
    });
  }

  const dokRes = await buatDokumen(supabase, {
    tipe: "RJ",
    actorId: profile.id,
    tanggal: parsed.data.tanggal,
  });
  if (!dokRes.ok) return fail(dokRes.message);
  const dokumen = dokRes.data.dokumen;

  const { data: header, error: insertErr } = await supabase
    .from("retur_penjualan")
    .insert({
      dokumen_id: dokumen.id,
      nomor: dokumen.nomor,
      faktur_id: parsed.data.fakturId,
      pelanggan_id: String(faktur.pelanggan_id),
      tanggal: parsed.data.tanggal,
      alasan: parsed.data.alasan,
      status: "DIAJUKAN",
      created_by: profile.id,
      updated_by: profile.id,
    })
    .select("id, nomor")
    .single();

  if (insertErr || !header) {
    return fail(insertErr?.message ?? "Gagal menyimpan pengajuan retur.");
  }

  const { error: itemsErr } = await supabase
    .from("retur_penjualan_item")
    .insert(
      itemInserts.map((it) => ({
        retur_id: header.id,
        ...it,
      })),
    );

  if (itemsErr) {
    return fail(itemsErr.message);
  }

  revalidatePath(PATH_RETUR);
  return ok({ id: String(header.id), nomor: String(header.nomor) });
}

export async function setujuiReturAction(
  id: string,
): Promise<Result<{ status: string; message: string }>> {
  if (!isValidUuid(id)) return fail("ID retur tidak valid.");

  let profile;
  try {
    const sesi = await requireIzin("setujui_retur_penjualan");
    profile = sesi.profile;
  } catch {
    return fail("Anda tidak berwenang menyetujui retur.");
  }

  const supabase = createAdminClient();
  if (!supabase) return fail("Layanan basis data tidak tersedia.");

  const { data: retur } = await supabase
    .from("retur_penjualan")
    .select("id, dokumen_id, nomor, status, created_by")
    .eq("id", id)
    .maybeSingle();

  if (!retur) return fail("Retur tidak ditemukan.");
  if (retur.status !== "DIAJUKAN") {
    return fail("Hanya retur berstatus DIAJUKAN yang dapat disetujui.");
  }

  // AC-09: Pemohon tidak boleh menyetujui retur sendiri
  if (retur.created_by === profile.id) {
    return fail("Pemohon retur tidak dapat menyetujui returnya sendiri.");
  }

  if (retur.dokumen_id) {
    const dokRes = await getDokumen(supabase, String(retur.dokumen_id));
    if (dokRes.ok && dokRes.data) {
      const trRes = await pindahStatusDokumen(supabase, {
        dokumenId: String(retur.dokumen_id),
        versi: dokRes.data.versi,
        statusTujuan: "DISETUJUI",
        aksi: "SETUJUI",
        actorId: profile.id,
        alasan: "Disetujui Accounting",
      });
      if (!trRes.ok) return fail(trRes.message);
    }
  }

  const { error: updErr } = await supabase
    .from("retur_penjualan")
    .update({
      status: "DISETUJUI",
      disetujui_oleh: profile.id,
      disetujui_at: new Date().toISOString(),
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "DIAJUKAN");

  if (updErr) return fail(updErr.message);

  revalidatePath(PATH_RETUR);
  revalidatePath(`${PATH_RETUR}/${encodeURIComponent(String(retur.nomor))}`);
  return ok({
    status: "DISETUJUI",
    message: "Retur disetujui dan siap diperiksa QC.",
  });
}

export async function tolakReturAction(
  id: string,
  alasan: string,
): Promise<Result<{ status: string }>> {
  if (!isValidUuid(id)) return fail("ID retur tidak valid.");
  if (!alasan.trim()) return fail("Alasan wajib diisi.");

  let profile;
  try {
    const sesi = await requireIzin("setujui_retur_penjualan");
    profile = sesi.profile;
  } catch {
    return fail("Anda tidak berwenang menyetujui retur.");
  }

  const supabase = createAdminClient();
  if (!supabase) return fail("Layanan basis data tidak tersedia.");

  const { data: retur } = await supabase
    .from("retur_penjualan")
    .select("id, dokumen_id, nomor, status")
    .eq("id", id)
    .maybeSingle();

  if (!retur) return fail("Retur tidak ditemukan.");
  if (retur.status !== "DIAJUKAN") {
    return fail("Hanya retur berstatus DIAJUKAN yang dapat ditolak.");
  }

  if (retur.dokumen_id) {
    const dokRes = await getDokumen(supabase, String(retur.dokumen_id));
    if (dokRes.ok && dokRes.data) {
      const trRes = await pindahStatusDokumen(supabase, {
        dokumenId: String(retur.dokumen_id),
        versi: dokRes.data.versi,
        statusTujuan: "DITOLAK",
        aksi: "TOLAK",
        actorId: profile.id,
        alasan: alasan.trim(),
      });
      if (!trRes.ok) return fail(trRes.message);
    }
  }

  const { error: updErr } = await supabase
    .from("retur_penjualan")
    .update({
      status: "DITOLAK",
      ditolak_oleh: profile.id,
      ditolak_at: new Date().toISOString(),
      alasan_tolak: alasan.trim(),
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "DIAJUKAN");

  if (updErr) return fail(updErr.message);

  revalidatePath(PATH_RETUR);
  revalidatePath(`${PATH_RETUR}/${encodeURIComponent(String(retur.nomor))}`);
  return ok({ status: "DITOLAK" });
}

export async function batalkanReturAction(
  id: string,
  alasan: string,
): Promise<Result<{ status: string }>> {
  if (!isValidUuid(id)) return fail("ID retur tidak valid.");
  if (!alasan.trim()) return fail("Alasan wajib diisi.");

  let profile;
  try {
    const sesi = await requireSesi();
    profile = sesi.profile;
  } catch (err: unknown) {
    return fail(err instanceof Error ? err.message : "Akses ditolak.");
  }

  const supabase = createAdminClient();
  if (!supabase) return fail("Layanan basis data tidak tersedia.");

  const { data: retur } = await supabase
    .from("retur_penjualan")
    .select("id, dokumen_id, nomor, status, created_by")
    .eq("id", id)
    .maybeSingle();

  if (!retur) return fail("Retur tidak ditemukan.");

  if (retur.status !== "DIAJUKAN" && retur.status !== "DISETUJUI") {
    return fail("Retur yang sudah diperiksa QC tidak dapat dibatalkan.");
  }

  if (retur.created_by !== profile.id) {
    return fail("Hanya pengaju retur yang dapat membatalkan pengajuan ini.");
  }

  if (retur.dokumen_id) {
    const dokRes = await getDokumen(supabase, String(retur.dokumen_id));
    if (dokRes.ok && dokRes.data) {
      const trRes = await pindahStatusDokumen(supabase, {
        dokumenId: String(retur.dokumen_id),
        versi: dokRes.data.versi,
        statusTujuan: "DIBATALKAN",
        aksi: "BATAL",
        actorId: profile.id,
        alasan: alasan.trim(),
      });
      if (!trRes.ok) return fail(trRes.message);
    }
  }

  const { error: updErr } = await supabase
    .from("retur_penjualan")
    .update({
      status: "DIBATALKAN",
      alasan_tolak: alasan.trim(),
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updErr) return fail(updErr.message);

  revalidatePath(PATH_RETUR);
  revalidatePath(`${PATH_RETUR}/${encodeURIComponent(String(retur.nomor))}`);
  return ok({ status: "DIBATALKAN" });
}

export async function catatQcReturAction(
  input: QcReturInput,
): Promise<Result<{ status: string; message: string }>> {
  let profile;
  try {
    const sesi = await requireIzin("periksa_qc_barang_retur");
    profile = sesi.profile;
  } catch (err: unknown) {
    return fail(err instanceof Error ? err.message : "Akses ditolak.");
  }

  const parsed = qcReturSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Data QC tidak valid.");
  }

  const supabase = createAdminClient();
  if (!supabase) return fail("Layanan basis data tidak tersedia.");

  const { data: retur } = await supabase
    .from("retur_penjualan")
    .select(
      `
      id,
      dokumen_id,
      nomor,
      faktur_id,
      tanggal,
      status,
      faktur:faktur_id ( dokumen_id, tarif_ppn::text, sisa_piutang::text, total::text, status )
    `,
    )
    .eq("id", parsed.data.returId)
    .maybeSingle();

  if (!retur) return fail("Retur tidak ditemukan.");

  // AC-13: QC hanya boleh pada retur yang sudah disetujui
  if (retur.status !== "DISETUJUI") {
    return fail("Retur harus disetujui sebelum QC.");
  }

  const { data: rItems } = await supabase
    .from("retur_penjualan_item")
    .select(
      "id, produk_id, gudang_id, qty_retur::text, harga_satuan::text, diskon_persen::text",
    )
    .eq("retur_id", parsed.data.returId);

  const itemMap = new Map<string, Row>();
  for (const it of (rItems ?? []) as unknown as Row[]) {
    itemMap.set(String(it.id), it);
  }

  let totalQtyLulus = 0;
  for (const qcItem of parsed.data.items) {
    const dbItem = itemMap.get(qcItem.itemId);
    if (!dbItem) return fail("Item retur tidak ditemukan.");
    const qtyDisetujui = Number(dbItem.qty_retur ?? 0);
    if (qcItem.qtyLulus > qtyDisetujui + 0.0001) {
      return fail("Qty lulus QC tidak boleh melebihi qty yang disetujui.");
    }
    totalQtyLulus += qcItem.qtyLulus;
  }

  const catatan = parsed.data.catatan?.trim() ?? "";

  // AC-04: Jika semua gagal QC (qty lulus = 0) -> DITOLAK tanpa stok & kredit memo
  if (totalQtyLulus <= 0) {
    if (!catatan) return fail("Alasan wajib diisi.");

    if (retur.dokumen_id) {
      const dokRes = await getDokumen(supabase, String(retur.dokumen_id));
      if (dokRes.ok && dokRes.data) {
        const trRes = await pindahStatusDokumen(supabase, {
          dokumenId: String(retur.dokumen_id),
          versi: dokRes.data.versi,
          statusTujuan: "DITOLAK",
          aksi: "TOLAK",
          actorId: profile.id,
          alasan: catatan,
        });
        if (!trRes.ok) return fail(trRes.message);
      }
    }

    const { error: updFailErr } = await supabase
      .from("retur_penjualan")
      .update({
        status: "DITOLAK",
        qc_diperiksa_oleh: profile.id,
        qc_diperiksa_at: new Date().toISOString(),
        qc_catatan: catatan,
        alasan_tolak: catatan,
        updated_by: profile.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.returId)
      .eq("status", "DISETUJUI");

    if (updFailErr) return fail(updFailErr.message);

    revalidatePath(PATH_RETUR);
    revalidatePath(`${PATH_RETUR}/${encodeURIComponent(String(retur.nomor))}`);
    return ok({
      status: "DITOLAK",
      message: "QC selesai: tidak ada barang lulus. Retur ditolak.",
    });
  }

  // AC-14: Cek periode terkunci saat QC lulus
  const lockMsg = await isPeriodeTerkunci(supabase, String(retur.tanggal));
  if (lockMsg) return fail(lockMsg);

  const fakRaw = Array.isArray(retur.faktur) ? retur.faktur[0] : retur.faktur;
  const fak = (fakRaw ?? {}) as unknown as Row;
  const tarifPpn = Number(fak.tarif_ppn ?? 0.11);
  const sisaPiutang = Number(fak.sisa_piutang ?? 0);

  let totalDpp = 0;
  let totalPpn = 0;
  let totalKreditMemo = 0;
  const computedItems: Array<{
    itemId: string;
    produkId: string;
    gudangId: string;
    qtyLulus: number;
    dpp: number;
    ppn: number;
    total: number;
  }> = [];

  for (const qcItem of parsed.data.items) {
    const dbItem = itemMap.get(qcItem.itemId)!;
    const km = hitungKreditMemoBaris({
      qtyLulus: qcItem.qtyLulus,
      hargaSatuan: Number(dbItem.harga_satuan ?? 0),
      diskonPersen: Number(dbItem.diskon_persen ?? 0),
      tarifPpn,
    });
    totalDpp = round2(totalDpp + km.dpp);
    totalPpn = round2(totalPpn + km.ppn);
    totalKreditMemo = round2(totalKreditMemo + km.total);
    computedItems.push({
      itemId: qcItem.itemId,
      produkId: String(dbItem.produk_id),
      gudangId: String(dbItem.gudang_id),
      qtyLulus: qcItem.qtyLulus,
      ...km,
    });
  }

  // AC-05: Total kredit memo tidak boleh melebihi sisa faktur asal
  if (totalKreditMemo > sisaPiutang + 0.01) {
    return fail(
      "Nilai retur melebihi sisa tagihan faktur asal. Pengembalian dana belum didukung.",
    );
  }

  // AC-03 & AC-10: Mutasi stok masuk dengan harga_rata saat retur
  let totalNilaiMasukStok = 0;
  const itemNilaiMasukMap = new Map<string, number>();

  for (const comp of computedItems) {
    if (comp.qtyLulus <= 0) {
      itemNilaiMasukMap.set(comp.itemId, 0);
      continue;
    }

    const saldoRes = await getSaldoStok(supabase, comp.produkId, comp.gudangId);
    const hargaRata =
      saldoRes.ok && saldoRes.data ? Number(saldoRes.data.harga_rata ?? 0) : 0;

    if (hargaRata > 0) {
      const mutRes = await catatMutasi(supabase, {
        produkId: comp.produkId,
        gudangId: comp.gudangId,
        tanggal: String(retur.tanggal),
        tipe: "MASUK",
        qty: comp.qtyLulus.toString(),
        hargaSatuan: hargaRata.toFixed(4),
        sumberTipe: "RETUR",
        sumberId: parsed.data.returId,
        alasan: `Retur penjualan ${retur.nomor}`,
        actorId: profile.id,
      });
      if (!mutRes.ok) return fail(mutRes.message);
      const nilaiMasuk = hitungNilaiMasukStok(comp.qtyLulus, hargaRata);
      totalNilaiMasukStok = round2(totalNilaiMasukStok + nilaiMasuk);
      itemNilaiMasukMap.set(comp.itemId, nilaiMasuk);
    } else {
      itemNilaiMasukMap.set(comp.itemId, 0);
    }
  }

  // AC-06: Jurnal kredit memo (Dr penjualan, Dr ppn_keluaran, Cr piutang_usaha)
  const barisKreditMemo: Array<{
    akunPeran: string;
    debit: string;
    kredit: string;
  }> = [
    {
      akunPeran: "penjualan",
      debit: totalDpp.toFixed(2),
      kredit: "0.00",
    },
  ];
  if (totalPpn > 0) {
    barisKreditMemo.push({
      akunPeran: "ppn_keluaran",
      debit: totalPpn.toFixed(2),
      kredit: "0.00",
    });
  }
  barisKreditMemo.push({
    akunPeran: "piutang_usaha",
    debit: "0.00",
    kredit: totalKreditMemo.toFixed(2),
  });

  const jurnalKmRes = await postJournal(supabase, {
    tanggal: String(retur.tanggal),
    sumberTipe: "RETUR",
    sumberId: parsed.data.returId,
    sumberNomor: String(retur.nomor),
    sumberPemicu: "KREDIT_MEMO_RETUR",
    baris: barisKreditMemo,
    actorId: profile.id,
  });
  if (!jurnalKmRes.ok) return fail(jurnalKmRes.message);

  // AC-06: Jurnal pembalik HPP (Dr persediaan_barang_jadi, Cr hpp)
  let jurnalHppId: string | null = null;
  if (totalNilaiMasukStok > 0) {
    const jurnalHppRes = await postJournal(supabase, {
      tanggal: String(retur.tanggal),
      sumberTipe: "RETUR",
      sumberId: parsed.data.returId,
      sumberNomor: String(retur.nomor),
      sumberPemicu: "PEMBALIK_HPP_RETUR",
      baris: [
        {
          akunPeran: "persediaan_barang_jadi",
          debit: totalNilaiMasukStok.toFixed(2),
          kredit: "0.00",
        },
        {
          akunPeran: "hpp",
          debit: "0.00",
          kredit: totalNilaiMasukStok.toFixed(2),
        },
      ],
      actorId: profile.id,
    });
    if (!jurnalHppRes.ok) return fail(jurnalHppRes.message);
    jurnalHppId = jurnalHppRes.data.jurnalId;
  }

  // Perbarui item retur
  for (const comp of computedItems) {
    await supabase
      .from("retur_penjualan_item")
      .update({
        qty_lulus: comp.qtyLulus,
        dpp: comp.dpp,
        ppn: comp.ppn,
        total: comp.total,
        nilai_masuk_stok: itemNilaiMasukMap.get(comp.itemId) ?? 0,
      })
      .eq("id", comp.itemId);
  }

  // Perbarui sisa_piutang faktur asal
  const sisaBaru = Math.max(0, round2(sisaPiutang - totalKreditMemo));
  const statusFakturBaru =
    sisaBaru <= 0 ? "LUNAS" : String(fak.status ?? "DITERBITKAN");

  await supabase
    .from("faktur")
    .update({
      sisa_piutang: sisaBaru,
      status: statusFakturBaru,
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", String(retur.faktur_id));

  // Transisi dokumen retur ke SELESAI
  if (retur.dokumen_id) {
    const dokRes = await getDokumen(supabase, String(retur.dokumen_id));
    if (dokRes.ok && dokRes.data) {
      await pindahStatusDokumen(supabase, {
        dokumenId: String(retur.dokumen_id),
        versi: dokRes.data.versi,
        statusTujuan: "SELESAI",
        aksi: "SELESAI",
        actorId: profile.id,
        alasan: catatan || "QC Lulus & Kredit Memo diterbitkan",
      });
    }
  }

  await supabase
    .from("retur_penjualan")
    .update({
      status: "SELESAI",
      qc_diperiksa_oleh: profile.id,
      qc_diperiksa_at: new Date().toISOString(),
      qc_catatan: catatan || null,
      total_dpp: totalDpp,
      total_ppn: totalPpn,
      total_kredit_memo: totalKreditMemo,
      jurnal_kredit_memo_id: jurnalKmRes.data.jurnalId,
      jurnal_hpp_id: jurnalHppId,
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.returId)
    .eq("status", "DISETUJUI");

  revalidatePath(PATH_RETUR);
  revalidatePath(`${PATH_RETUR}/${encodeURIComponent(String(retur.nomor))}`);
  return ok({
    status: "SELESAI",
    message:
      "QC selesai: stok masuk, kredit memo, dan jurnal retur berhasil diposting.",
  });
}
