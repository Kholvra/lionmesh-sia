"use server";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  getBomVersi,
  getHppProduksi,
  getProduksiExecutionContext,
  listBiayaEvent,
  listHasilProduksi,
  listPengeluaranBahan,
  listPerintahProduksi,
  type KonteksProduksi,
} from "@/core/produksi";
import { listSaldoStok } from "@/core/inventory";
import type { SaldoStok } from "@/core/inventory/types";
import { listGudang, listProduk, listSatuan } from "@/core/master";
import { cekIzin } from "@/lib/auth/permissions";
import { getPermintaanPembelian, listPermintaanPembelian } from "@/core/pengadaan";
import { fail, ok, type Result } from "@/lib/result";
import { createClient } from "@/lib/supabase/server";
import type { LaporanData, RekapPersediaanRow } from "@/modules/produksi/laporan/types";
import type {
  PembelianFormData,
  PurchaseRequestItem,
} from "@/modules/produksi/pembelian-bahan/types";
import { muatSpkDetail } from "@/modules/produksi/queries";

function angka(nilai: unknown): number {
  const hasil = Number(nilai ?? 0);
  return Number.isFinite(hasil) ? hasil : 0;
}

function formatTanggal(nilai: string): string {
  if (!nilai) return "—";
  const tanggal = new Date(nilai);
  if (Number.isNaN(tanggal.getTime())) return nilai;
  return tanggal.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

async function konteks(): Promise<Result<KonteksProduksi>> {
  const hasil = await getProduksiExecutionContext();
  if (!hasil.ok) return fail(hasil.message);
  const sesi = await createClient();
  return ok({ ...hasil.data, supabase: sesi });
}

async function master(client: SupabaseClient) {
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

export async function muatPrList(): Promise<Result<PurchaseRequestItem[]>> {
  const ctx = await konteks();
  if (!ctx.ok) return fail(ctx.message);
  const [pr, spk, dataMaster] = await Promise.all([
    listPermintaanPembelian(ctx.data.supabase),
    listPerintahProduksi(ctx.data.supabase),
    master(ctx.data.supabase),
  ]);
  if (!pr.ok) return fail(pr.message);
  if (!spk.ok) return fail(spk.message);
  if (!dataMaster.ok) return fail(dataMaster.message);
  const detail = await Promise.all(
    pr.data.map((item) =>
      getPermintaanPembelian(ctx.data.supabase, item.dokumenId),
    ),
  );
  const gagal = detail.find((hasil) => !hasil.ok);
  if (gagal && !gagal.ok) return fail(gagal.message);
  const items = detail.flatMap((hasil) =>
    hasil.ok ? (hasil.data?.detail ?? []) : [],
  );
  return ok<PurchaseRequestItem[]>(
    pr.data.map((item) => {
      const wo = spk.data.find((candidate) => candidate.dokumen_id === item.woId);
      const barisPr = items.filter((candidate) => candidate.permintaan_id === item.dokumenId);
      const bahan = barisPr[0] ? dataMaster.data.produk.get(barisPr[0].produk_id) : null;
      const totalTon = barisPr.reduce((jumlah, candidate) => jumlah + angka(candidate.qty), 0);
      const status: PurchaseRequestItem["status"] =
        item.status === "SELESAI" || item.status === "TERKIRIM"
          ? "DIKELUARKAN"
          : item.status === "DISETUJUI"
            ? "MENUNGGU_PEMBELIAN"
            : "DIPERIKSA_PURCHASING";
      return {
        id: item.dokumenId,
        dokumenId: item.dokumenId,
        woId: item.woId ?? "",
        gudangId: item.gudangId,
        nomorPr: item.nomor,
        nomorSpk: wo?.nomor ?? "—",
        produkLabel: wo
          ? `${wo.nomor} · ${dataMaster.data.produk.get(wo.produk_id)?.nama ?? "—"} · ${angka(wo.target_qty).toLocaleString("id-ID")} lembar`
          : item.keterangan ?? "—",
        bahanNama: bahan?.nama ?? "—",
        bahanKode: bahan?.kode ?? "—",
        jumlahDimintaTon: totalTon,
        dibutuhkanPalingLambat: `${formatTanggal(item.tanggalButuh)} · 07.00`,
        statusDokumen: item.status,
        status,
      };
    }) as PurchaseRequestItem[],
  );
}

export async function muatFormBahan(
  spk: string,
): Promise<Result<PembelianFormData>> {
  const [detail, pr, gudang] = await Promise.all([
    muatSpkDetail(spk),
    muatPrList(),
    (async () => {
      const ctx = await konteks();
      return ctx.ok ? listGudang(ctx.data.supabase) : { data: [], error: ctx.message };
    })(),
  ]);
  if (!detail.ok) return fail(detail.message);
  if (!pr.ok) return fail(pr.message);
  if (gudang.error) return fail(gudang.error);
  return ok({
    ...detail.data,
    pr: pr.data,
    gudangOptions: gudang.data.map((item) => ({ id: item.id, nama: item.nama })),
  });
}

const IZIN_LAPORAN = {
  produksi: "lihat_laporan_hasil_produksi",
  wip: "lihat_laporan_saldo_wip",
  persediaan: "lihat_laporan_persediaan_jadi",
} as const;

export async function muatLaporan(
  periode: string,
  tab: keyof typeof IZIN_LAPORAN = "produksi",
): Promise<Result<LaporanData>> {
  const ctx = await konteks();
  if (!ctx.ok) return fail(ctx.message);
  if (!cekIzin(ctx.data.peran, IZIN_LAPORAN[tab])) {
    return fail("Anda tidak berwenang melihat laporan ini.");
  }
  const [spk, dataMaster, saldo] = await Promise.all([
    listPerintahProduksi(ctx.data.supabase),
    master(ctx.data.supabase),
    listSaldoStok(ctx.data.supabase),
  ]);
  if (!spk.ok) return fail(spk.message);
  if (!dataMaster.ok) return fail(dataMaster.message);
  if (!saldo.ok) return fail(saldo.message);

  const periodeDitemukan = new Set<string>();
  for (const item of spk.data) {
    periodeDitemukan.add(item.tanggal_perintah.slice(0, 7));
    periodeDitemukan.add(item.tgl_target_selesai.slice(0, 7));
  }
  const labelPeriode = (value: string) =>
    new Date(`${value}-01T00:00:00Z`).toLocaleDateString("id-ID", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
  const periodeOptions = [
    { value: "semua", label: "Semua periode" },
    ...[...periodeDitemukan].sort().map((value) => ({
      value,
      label: labelPeriode(value),
    })),
  ];
  const cocokPeriode = (tanggal: string) =>
    periode === "semua" || tanggal.slice(0, 7) === periode;

  const produksi: LaporanData["produksi"] = [];
  const wip: LaporanData["wip"] = [];
  for (const item of spk.data) {
    const produk = dataMaster.data.produk.get(item.produk_id);
    const [hasil, keluar, event, versi] = await Promise.all([
      listHasilProduksi(ctx.data.supabase, item.dokumen_id),
      listPengeluaranBahan(ctx.data.supabase, item.dokumen_id),
      listBiayaEvent(ctx.data.supabase, item.dokumen_id),
      getBomVersi(ctx.data.supabase, item.bom_versi_id),
    ]);
    if (!hasil.ok) return fail(hasil.message);
    if (!keluar.ok) return fail(keluar.message);
    if (!event.ok) return fail(event.message);
    if (!versi.ok) return fail(versi.message);
    const diproses = hasil.data.reduce((jumlah, row) => jumlah + angka(row.qty_diproses), 0);
    const lulus = hasil.data.reduce((jumlah, row) => jumlah + angka(row.qc?.qty_lulus), 0);
    const rework = hasil.data.reduce((jumlah, row) => jumlah + angka(row.qc?.qty_rework), 0);
    const reject = hasil.data.reduce((jumlah, row) => jumlah + angka(row.qc?.qty_reject), 0);
    const kerugian = event.data
      .filter((row) => row.jenis === "KERUGIAN")
      .reduce((jumlah, row) => jumlah + angka(row.nominal), 0);
    const komponen = versi.data?.komponen[0];
    const standar = komponen
      ? lulus * angka(komponen.qty_per_unit) *
        (1 + angka(versi.data?.toleransi_scrap) / 100)
      : 0;
    const aktual = keluar.data.reduce((jumlah, row) => jumlah + angka(row.qty_keluar), 0) *
      (diproses > 0 ? lulus / diproses : 0);
    if (hasil.data.length > 0 && cocokPeriode(hasil.data[0].tanggal)) {
      produksi.push({
        nomorSpk: item.nomor,
        produkNama: produk?.nama ?? "—",
        produkKode: produk?.kode ?? "—",
        tanggalSelesai: formatTanggal(hasil.data[hasil.data.length - 1].tanggal),
        jumlahDiproses: diproses,
        lulusQc: lulus,
        rework,
        reject,
        kerugianProduksiRp: kerugian,
        yieldPersen: diproses > 0 ? Number(((lulus / diproses) * 100).toFixed(1)) : 0,
        efisiensiBahanPersen: aktual > 0 ? Number(((standar / aktual) * 100).toFixed(1)) : 0,
      });
    }
    if (
      ["BERJALAN", "HASIL_DICATAT", "QC_PASSED", "REWORK"].includes(item.status) &&
      cocokPeriode(item.tanggal_perintah)
    ) {
      const hpp = await getHppProduksi(ctx.data.supabase, item.dokumen_id);
      if (!hpp.ok) return fail(hpp.message);
      wip.push({
        nomorSpk: item.nomor,
        produkNama: produk?.nama ?? "—",
        tanggalMulai: formatTanggal(item.tanggal_perintah),
        statusWo: item.status,
        targetLembar: angka(item.target_qty),
        selesaiLembar: angka(hpp.data?.qtyLulus),
        biayaBahanWipRp: angka(hpp.data?.komponen.BAHAN),
        biayaTklWipRp: angka(hpp.data?.komponen.TKL),
        biayaOverheadWipRp: angka(hpp.data?.komponen.OVERHEAD),
        totalSaldoWipRp: angka(hpp.data?.total),
      });
    }
  }

  const persediaan: RekapPersediaanRow[] = saldo.data.map((item: SaldoStok) => {
    const produk = dataMaster.data.produk.get(item.produk_id);
    const tipe = produk?.tipe ?? "";
    return {
      kategori:
        tipe === "bahan"
          ? "Bahan Baku"
          : tipe === "barang_jadi"
            ? "Barang Jadi"
            : "Barang Dalam Proses (WIP)",
      produkKode: produk?.kode ?? "—",
      produkNama: produk?.nama ?? "—",
      satuan: dataMaster.data.satuan.get(produk?.satuan_dasar_id ?? "")?.kode ?? "—",
      kuantitas: angka(item.qty),
      hargaRataRp: angka(item.harga_rata),
      totalNilaiRp: angka(item.nilai),
      gudang: dataMaster.data.gudang.get(item.gudang_id)?.nama ?? "—",
    };
  });

  return ok({ periodeOptions, produksi, wip, persediaan });
}
