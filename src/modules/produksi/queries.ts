"use server";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  getBomVersi,
  getProduksiExecutionContext,
  kunciQcHasil,
  listBomVersi,
  listHasilProduksi,
  listPengeluaranBahan,
  listPerintahProduksi,
  listRiwayatSpk,
  type KonteksProduksi,
} from "@/core/produksi";
import type { BomVersiView, SpkView } from "@/core/produksi/queries";
import { getSaldoStok } from "@/core/inventory";
import { listGudang, listProduk, listSatuan } from "@/core/master";
import { listNamaProfil } from "@/lib/auth";
import { fail, ok, type Result } from "@/lib/result";
import { createClient } from "@/lib/supabase/server";
import type { BomFormData, BomItem } from "@/modules/produksi/bom-produk/types";
import type { HasilDetailData, HasilProduksiSpkItem, RiwayatHasilData } from "@/modules/produksi/hasil-produksi/types";
import type { SpkDetailData, SpkFormData, SpkItem } from "@/modules/produksi/perintah-produksi/types";

type Master = {
  produk: Map<string, { id: string; kode: string; nama: string; tipe: string; satuan_dasar_id: string }>;
  gudang: Map<string, { id: string; kode: string; nama: string }>;
  satuan: Map<string, { id: string; kode: string; nama: string }>;
};

async function konteks(): Promise<Result<KonteksProduksi>> {
  const hasil = await getProduksiExecutionContext();
  if (!hasil.ok) return fail(hasil.message);
  const sesi = await createClient();
  return ok({ ...hasil.data, supabase: sesi });
}

async function muatMaster(client: SupabaseClient): Promise<Result<Master>> {
  const [produk, gudang, satuan] = await Promise.all([
    listProduk(client),
    listGudang(client),
    listSatuan(client),
  ]);
  const error = produk.error ?? gudang.error ?? satuan.error;
  if (error) return fail(error);
  return ok({
    produk: new Map(produk.data.map((item) => [item.id, item])),
    gudang: new Map(gudang.data.map((item) => [item.id, item])),
    satuan: new Map(satuan.data.map((item) => [item.id, item])),
  });
}

function formatTanggal(iso: string): string {
  if (!iso) return "—";
  const tanggal = new Date(iso);
  if (Number.isNaN(tanggal.getTime())) return iso;
  return tanggal.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatRentang(mulai: string, selesai: string): string {
  if (!mulai || !selesai) return "—";
  const m = formatTanggal(mulai).replace(/\s\d{4}$/, "");
  const s = formatTanggal(selesai);
  return m === formatTanggal(mulai) ? `${m} – ${s}` : `${m} – ${s}`;
}

function formatPersen(nilai: string): string {
  return `${Number(nilai).toLocaleString("id-ID", {
    maximumFractionDigits: 2,
  })}%`;
}

function angka(nilai: string): number {
  const hasil = Number(nilai);
  return Number.isFinite(hasil) ? hasil : 0;
}

async function stokKomponen(
  client: SupabaseClient,
  produkId: string,
  gudangId: string,
): Promise<Result<number | null>> {
  const hasil = await getSaldoStok(client, produkId, gudangId);
  return hasil.ok ? ok(hasil.data === null ? null : angka(hasil.data.qty)) : hasil;
}

function keBomItem(
  versi: BomVersiView,
  master: Master,
): BomItem {
  const komponen = [...versi.komponen].sort((a, b) => a.urutan - b.urutan)[0];
  const produk = master.produk.get(versi.produk_id);
  const bahan = komponen ? master.produk.get(komponen.komponen_produk_id) : null;
  return {
    id: versi.id,
    bomId: versi.bom_id,
    produkId: versi.produk_id,
    produkNama: produk?.nama ?? "Produk tidak ditemukan",
    produkKode: produk?.kode ?? "—",
    versiNumber: versi.versi,
    berlakuDari: formatTanggal(versi.berlaku_dari),
    berlakuDariISO: versi.berlaku_dari,
    toleransiScrap: formatPersen(versi.toleransi_scrap),
    toleransiReject: formatPersen(versi.toleransi_reject),
    jumlahPerLembarKg: komponen ? angka(komponen.qty_per_unit) : 0,
    komponenKode: bahan?.kode ?? "—",
    komponenNama: bahan?.nama ?? "Komponen tidak ditemukan",
    komponenProdukId: komponen?.komponen_produk_id ?? "",
    satuanId: komponen?.satuan_id ?? "",
    status: versi.status,
  };
}

const STATUS_UI: Record<string, SpkItem["status"]> = {
  DIRENCANAKAN: "DIRENCANAKAN",
  CEK_BAHAN: "MENUNGGU_BAHAN",
  BAHAN_CUKUP: "MENUNGGU_BAHAN",
  BAHAN_KURANG: "MENUNGGU_BAHAN",
  MENUNGGU_PEMBELIAN: "MENUNGGU_BAHAN",
  BAHAN_SIAP: "MENUNGGU_BAHAN",
  BERJALAN: "DIPROSES",
  REWORK: "DIPROSES",
  HASIL_DICATAT: "MENUNGGU_QC",
  QC_PASSED: "MENUNGGU_QC",
  SELESAI: "BARANG_JADI",
};

function statusUi(status: string): SpkItem["status"] {
  return STATUS_UI[status] ?? "DIRENCANAKAN";
}

function kategoriSpk(status: string): SpkItem["filterCategory"] {
  if (["DIRENCANAKAN", "CEK_BAHAN"].includes(status)) return "direncanakan";
  if (
    ["BAHAN_CUKUP", "BAHAN_KURANG", "MENUNGGU_PEMBELIAN", "BAHAN_SIAP"].includes(status)
  ) return "menunggu_bahan";
  if (["BERJALAN", "REWORK"].includes(status)) return "diproses";
  return "hasil_dicatat";
}

function keSpkItem(
  spk: SpkView,
  master: Master,
  versiBom: number | null,
): SpkItem {
  const produk = master.produk.get(spk.produk_id);
  return {
    id: spk.dokumen_id,
    woId: spk.dokumen_id,
    nomorSpk: spk.nomor,
    sumberInfo: spk.keterangan ?? "—",
    produkNama: produk?.nama ?? "Produk tidak ditemukan",
    produkKode: produk?.kode ?? "—",
    produkId: spk.produk_id,
    bomVersiId: spk.bom_versi_id,
    gudangId: spk.gudang_id,
    versiBom: versiBom === null ? "—" : `v${versiBom}`,
    versiDokumen: spk.versi,
    statusInti: spk.status as SpkItem["statusInti"],
    jumlahLembar: angka(spk.target_qty),
    jadwalText: formatRentang(spk.tanggal_perintah, spk.tgl_target_selesai),
    tanggalMulaiISO: spk.tanggal_perintah,
    tanggalSelesaiISO: spk.tgl_target_selesai,
    status: statusUi(spk.status),
    filterCategory: kategoriSpk(spk.status),
  };
}

async function daftarSpk(
  ctx: KonteksProduksi,
): Promise<Result<{ items: SpkItem[]; master: Master }>> {
  const [spk, master, versi] = await Promise.all([
    listPerintahProduksi(ctx.supabase),
    muatMaster(ctx.supabase),
    listBomVersi(ctx.supabase),
  ]);
  if (!spk.ok) return fail(spk.message);
  if (!master.ok) return fail(master.message);
  if (!versi.ok) return fail(versi.message);
  const petaVersi = new Map(versi.data.map((item) => [item.id, item.versi]));
  return ok({
    items: spk.data.map((item) =>
      keSpkItem(item, master.data, petaVersi.get(item.bom_versi_id) ?? null),
    ),
    master: master.data,
  });
}

export async function muatBomProduk(): Promise<Result<BomItem[]>> {
  const ctx = await konteks();
  if (!ctx.ok) return fail(ctx.message);
  const [daftar, master] = await Promise.all([
    listBomVersi(ctx.data.supabase),
    muatMaster(ctx.data.supabase),
  ]);
  if (!daftar.ok) return fail(daftar.message);
  if (!master.ok) return fail(master.message);
  return ok(daftar.data.map((versi) => keBomItem(versi, master.data)));
}

export async function muatBomForm(): Promise<Result<BomFormData>> {
  const bomList = await muatBomProduk();
  if (!bomList.ok) return fail(bomList.message);
  const ctx = await konteks();
  if (!ctx.ok) return fail(ctx.message);
  const master = await muatMaster(ctx.data.supabase);
  if (!master.ok) return fail(master.message);
  return ok({
    bomList: bomList.data,
    produkOptions: [...master.data.produk.values()]
      .filter((produk) => produk.tipe === "barang_jadi")
      .map(({ id, kode, nama }) => ({ id, kode, nama })),
    bahanOptions: [...master.data.produk.values()]
      .filter((produk) => produk.tipe === "bahan")
      .map(({ id, kode, nama, satuan_dasar_id }) => ({
        id,
        kode,
        nama,
        satuanId: satuan_dasar_id,
      })),
  });
}

export async function muatSpkList(): Promise<Result<SpkItem[]>> {
  const ctx = await konteks();
  if (!ctx.ok) return fail(ctx.message);
  const daftar = await daftarSpk(ctx.data);
  return daftar.ok ? ok(daftar.data.items) : fail(daftar.message);
}

export async function muatSpkDetail(
  nomor: string,
): Promise<Result<SpkDetailData>> {
  const ctx = await konteks();
  if (!ctx.ok) return fail(ctx.message);
  const daftar = await daftarSpk(ctx.data);
  if (!daftar.ok) return fail(daftar.message);
  const spk = daftar.data.items.find(
    (item) => item.nomorSpk.toLowerCase() === nomor.toLowerCase(),
  );
  if (!spk) return ok({ spk: null, bom: null, stokTon: null });
  const versi = await getBomVersi(ctx.data.supabase, spk.bomVersiId);
  if (!versi.ok) return fail(versi.message);
  if (!versi.data) return ok({ spk, bom: null, stokTon: null });
  const bom = keBomItem(versi.data, daftar.data.master);
  const stok = await stokKomponen(
    ctx.data.supabase,
    bom.komponenProdukId,
    spk.gudangId,
  );
  return stok.ok
    ? ok({ spk, bom, stokTon: stok.data })
    : fail(stok.message);
}

export async function muatSpkForm(): Promise<Result<SpkFormData>> {
  const ctx = await konteks();
  if (!ctx.ok) return fail(ctx.message);
  const [bomList, master] = await Promise.all([
    muatBomProduk(),
    muatMaster(ctx.data.supabase),
  ]);
  if (!bomList.ok) return fail(bomList.message);
  if (!master.ok) return fail(master.message);
  return ok({
    bomList: bomList.data.filter((item) => item.status === "BERLAKU"),
    gudangOptions: [...master.data.gudang.values()].map(({ id, nama }) => ({
      id,
      nama,
    })),
  });
}

export async function muatHasilList(): Promise<Result<HasilProduksiSpkItem[]>> {
  const ctx = await konteks();
  if (!ctx.ok) return fail(ctx.message);
  const daftar = await daftarSpk(ctx.data);
  if (!daftar.ok) return fail(daftar.message);
  const hasil: HasilProduksiSpkItem[] = [];
  for (const spk of daftar.data.items.filter((item) =>
    ["BERJALAN", "REWORK", "HASIL_DICATAT", "QC_PASSED", "SELESAI"].includes(item.statusInti),
  )) {
    const keluar = await listPengeluaranBahan(ctx.data.supabase, spk.woId);
    if (!keluar.ok) return fail(keluar.message);
    const ton = keluar.data.reduce((jumlah, item) => jumlah + angka(item.qty_keluar), 0);
    hasil.push({
      id: spk.woId,
      woId: spk.woId,
      nomorSpk: spk.nomorSpk,
      jadwalText: spk.jadwalText,
      produkNama: spk.produkNama,
      produkKode: spk.produkKode,
      produkId: spk.produkId,
      gudangId: spk.gudangId,
      targetLembar: spk.jumlahLembar,
      bahanDiterimaText:
        keluar.data.length === 0
          ? "Belum ada bahan dikeluarkan"
          : `${ton.toLocaleString("id-ID", { maximumFractionDigits: 2 })} ton · ${keluar.data.length} pengeluaran`,
      statusInti: spk.statusInti,
      status: spk.statusInti === "REWORK" ? "REWORK" : "DIPROSES",
    });
  }
  return ok(hasil);
}

export async function muatHasilDetail(
  nomor: string,
): Promise<Result<HasilDetailData | null>> {
  const daftar = await muatHasilList();
  if (!daftar.ok) return fail(daftar.message);
  const spk = daftar.data.find(
    (item) => item.nomorSpk.toLowerCase() === nomor.toLowerCase(),
  );
  if (!spk) return ok(null);
  const ctx = await konteks();
  if (!ctx.ok) return fail(ctx.message);
  const [keluar, hasil] = await Promise.all([
    listPengeluaranBahan(ctx.data.supabase, spk.woId),
    listHasilProduksi(ctx.data.supabase, spk.woId),
  ]);
  if (!keluar.ok) return fail(keluar.message);
  if (!hasil.ok) return fail(hasil.message);
  return ok({
    spk,
    pengeluaran: keluar.data.map((item) => ({
      id: item.id,
      qtyKeluar: item.qty_keluar,
      produkId: item.produk_id,
      satuanId: item.satuan_id,
      sudahDikonfirmasi: item.pemakaian !== null,
    })),
    hasil: hasil.data.map((item) => ({
      id: item.id,
      percobaan: item.percobaan,
      qtyDiproses: item.qty_diproses,
      createdBy: item.created_by,
      tanggal: item.tanggal,
      qc: item.qc
        ? {
            keputusan: item.qc.keputusan,
            qtyLulus: item.qc.qty_lulus,
            qtyRework: item.qc.qty_rework,
            qtyReject: item.qc.qty_reject,
          }
        : null,
      kunciQc: item.qc?.keputusan === "QC_PASSED"
        ? kunciQcHasil(item.id, spk.woId)
        : null,
    })),
  });
}

export async function muatRiwayatHasil(
  nomor: string,
): Promise<Result<RiwayatHasilData | null>> {
  const ctx = await konteks();
  if (!ctx.ok) return fail(ctx.message);
  const daftar = await daftarSpk(ctx.data);
  if (!daftar.ok) return fail(daftar.message);
  const spk = daftar.data.items.find(
    (item) => item.nomorSpk.toLowerCase() === nomor.toLowerCase(),
  );
  if (!spk) return ok(null);
  const [hasil, riwayat] = await Promise.all([
    listHasilProduksi(ctx.data.supabase, spk.woId),
    listRiwayatSpk(ctx.data.supabase, spk.woId),
  ]);
  if (!hasil.ok) return fail(hasil.message);
  const nama = await listNamaProfil(
    ctx.data.supabase,
    hasil.data.map((item) => item.created_by ?? ""),
  );
  if (!nama.ok) return fail(nama.message);
  const terakhir = hasil.data[hasil.data.length - 1] ?? null;
  const jumlahJadi = terakhir?.qc
    ? angka(terakhir.qc.qty_lulus)
    : terakhir
      ? angka(terakhir.qty_diproses)
      : 0;
  const scrap = terakhir?.qc ? angka(terakhir.qc.qty_reject) : 0;
  return ok({
    nomorSpk: spk.nomorSpk,
    produkNama: spk.produkNama,
    jumlahJadi,
    scrapText: `${scrap.toLocaleString("id-ID", { maximumFractionDigits: 2 })} ton`,
    selesaiPada: terakhir ? formatTanggal(terakhir.tanggal) : "—",
    kejadian: hasil.data.map((item) => ({
      waktu: formatTanggal(item.tanggal),
      kejadian: `Hasil ${angka(item.qty_diproses).toLocaleString("id-ID")} lembar dicatat${
        item.qc ? ` · ${item.qc.keputusan}` : ""
      }`,
      oleh: nama.data.get(item.created_by ?? "") ?? "Produksi",
    })),
  });
}

export async function muatStokBahan(
  produkId: string,
  gudangId: string,
): Promise<Result<number | null>> {
  const ctx = await konteks();
  if (!ctx.ok) return fail(ctx.message);
  return stokKomponen(ctx.data.supabase, produkId, gudangId);
}
