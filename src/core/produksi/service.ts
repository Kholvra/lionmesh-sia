import { z } from "zod";

import { getDokumen } from "@/core/dokumen";
import { fail, ok, type Result } from "@/lib/result";

import { getPerintahProduksi, listHasilProduksi, listPengeluaranBahan, type SpkView } from "./queries";
import {
  dokumenHasil, dokumenHasilMentah, dokumenOpsionalMentah, IZIN_TRANSISI,
  jalankanRpc, skalaQty, validasi, type KonteksProduksi,
} from "./server";
import {
  STATUS_SPK_AKHIR, TRANSISI_SPK, ajukanPermintaanBahanSchema, bebankanOverheadSchema,
  bebankanTklSchema, buatSpkSchema, catatHasilSchema, catatKjkSchema,
  catatOverheadAktualSchema, catatQcSchema, hitungHppFinalSchema, kembalikanBahanSchema,
  konfirmasiPemakaianSchema, keluarkanBahanSchema, kunciIdempotensi, pindahStatusSpkSchema,
  simpanVersiBomSchema, terimaBarangJadiSchema, tetapkanTarifOverheadSchema,
  type AksiSpk, type HasilAjukanPermintaanBahan, type HasilBebankanOverhead,
  type HasilBebankanTkl, type HasilBuatSpk, type HasilCatatHasil, type HasilCatatKjk,
  type HasilCatatQc, type HasilHppFinal, type HasilKeluarkanBahan,
  type HasilKembalikanBahan, type HasilKonfirmasiPemakaian, type HasilOverheadAktual,
  type HasilPindahStatusSpk, type HasilSimpanVersiBom, type HasilTarifOverhead,
  type HasilTerimaBarangJadi, type StatusSpk,
} from "./types";

const dokumenOpsional = (data: { dokumen: unknown; riwayat_id: string | null }) =>
  data.dokumen && data.riwayat_id
    ? { dokumen: data.dokumen as HasilPindahStatusSpk["dokumen"], riwayatId: data.riwayat_id }
    : {};

async function ambilSpk(ctx: KonteksProduksi, woId: string): Promise<Result<SpkView>> {
  const spk = await getPerintahProduksi(ctx.supabase, woId);
  if (!spk.ok) return spk;
  if (!spk.data) return fail("Perintah produksi tidak ditemukan.");
  return ok(spk.data);
}

export function kunciQcHasil(hasilId: string, woId: string, kunci?: string): string {
  return kunciIdempotensi("CATAT_QC", [hasilId, woId], kunci);
}

export async function simpanVersiBom(
  ctx: KonteksProduksi, input: unknown,
): Promise<Result<HasilSimpanVersiBom>> {
  const data = validasi(simpanVersiBomSchema, input);
  if (!data.ok) return data;
  const kunci = kunciIdempotensi("SIMPAN_BOM", [data.data.produkId, data.data.berlakuDari], data.data.kunci);
  return jalankanRpc(ctx, "kelola_data_produk", "k10_simpan_versi_bom", {
    p_produk_id: data.data.produkId, p_berlaku_dari: data.data.berlakuDari,
    p_toleransi_scrap: data.data.toleransiScrap, p_toleransi_reject: data.data.toleransiReject,
    p_komponen: data.data.komponen.map((item) => ({
      komponen_produk_id: item.komponenProdukId, satuan_id: item.satuanId,
      qty_per_unit: item.qtyPerUnit, urutan: item.urutan,
    })),
    p_kunci_idempotensi: kunci,
  }, z.object({
    bom_id: z.string(), versi_id: z.string(), versi: z.number(),
    berlaku_dari: z.string(), jumlah_komponen: z.number(),
  }).transform((r) => ({
    bomId: r.bom_id, versiId: r.versi_id, versi: r.versi,
    berlakuDari: r.berlaku_dari, jumlahKomponen: r.jumlah_komponen,
  })));
}

export async function buatPerintahProduksi(
  ctx: KonteksProduksi, input: unknown,
): Promise<Result<HasilBuatSpk>> {
  const data = validasi(buatSpkSchema, input);
  if (!data.ok) return data;
  const kunci = kunciIdempotensi("BUAT_SPK", [
    data.data.produkId, data.data.bomVersiId, data.data.gudangId,
    data.data.tanggalPerintah, data.data.targetQty,
  ], data.data.kunci);
  return jalankanRpc(ctx, "buat_perintah_produksi", "k10_buat_spk", {
    p_produk_id: data.data.produkId, p_bom_versi_id: data.data.bomVersiId,
    p_gudang_id: data.data.gudangId, p_tanggal_perintah: data.data.tanggalPerintah,
    p_tgl_target_selesai: data.data.tglTargetSelesai, p_target_qty: data.data.targetQty,
    p_keterangan: data.data.keterangan ?? null, p_kunci_idempotensi: kunci,
  }, dokumenHasilMentah.extend({ wo_id: z.string() }).transform((r) => ({
    woId: r.wo_id, dokumen: r.dokumen, riwayatId: r.riwayat_id,
  })));
}

export async function pindahStatusSpk(
  ctx: KonteksProduksi, input: unknown,
): Promise<Result<HasilPindahStatusSpk>> {
  const data = validasi(pindahStatusSpkSchema, input);
  if (!data.ok) return data;
  const spk = await ambilSpk(ctx, data.data.woId);
  if (!spk.ok) return spk;
  if (spk.data.versi !== data.data.versi) return fail("Versi dokumen sudah berubah. Muat ulang SPK.");
  if (STATUS_SPK_AKHIR.includes(spk.data.status as StatusSpk)) {
    return fail("Status SPK sudah final dan tidak bisa diubah.");
  }
  if (!TRANSISI_SPK[spk.data.status]?.includes(data.data.statusTujuan)) {
    return fail("Transisi status SPK tidak diizinkan.");
  }
  if (data.data.statusTujuan === "DIBATALKAN") {
    if (!data.data.alasan) return fail("Alasan pembatalan wajib diisi.");
    const dokumen = await getDokumen(ctx.supabase, data.data.woId);
    if (!dokumen.ok) return dokumen;
    if (dokumen.data?.pembuat_id !== ctx.actorId) {
      return fail("Hanya pemohon yang dapat membatalkan SPK.");
    }
  }
  const kunci = kunciIdempotensi("PINDAH_STATUS_SPK", [
    data.data.woId, data.data.versi, data.data.statusTujuan,
  ], data.data.kunci);
  return jalankanRpc(ctx, IZIN_TRANSISI[data.data.aksi as AksiSpk], "k10_pindah_status_spk", {
    p_wo_id: data.data.woId, p_versi: data.data.versi,
    p_status_tujuan: data.data.statusTujuan, p_aksi: data.data.aksi,
    p_alasan: data.data.alasan ?? null, p_kunci_idempotensi: kunci,
  }, dokumenHasil);
}

export async function ajukanPermintaanBahan(
  ctx: KonteksProduksi, input: unknown,
): Promise<Result<HasilAjukanPermintaanBahan>> {
  const data = validasi(ajukanPermintaanBahanSchema, input);
  if (!data.ok) return data;
  const spk = await ambilSpk(ctx, data.data.woId);
  if (!spk.ok) return spk;
  if (spk.data.status !== "BAHAN_KURANG") {
    return fail("Permintaan bahan hanya dibuat dari SPK berstatus BAHAN_KURANG.");
  }
  const kunci = kunciIdempotensi("AJUKAN_PR_BAHAN", [
    data.data.woId, data.data.gudangId, data.data.tanggalButuh,
  ], data.data.kunci);
  return jalankanRpc(ctx, "ajukan_permintaan_bahan", "k10_ajukan_permintaan_bahan", {
    p_wo_id: data.data.woId, p_gudang_id: data.data.gudangId,
    p_tanggal_butuh: data.data.tanggalButuh,
    p_baris: data.data.baris.map((item) => ({
      produk_id: item.produkId, satuan_id: item.satuanId, qty: item.qty,
    })),
    p_keterangan: data.data.keterangan ?? null, p_kunci_idempotensi: kunci,
  }, z.object({
    permintaan_id: z.string(), wo_id: z.string(), nomor: z.string(), status: z.string(),
  }).transform((r) => ({
    permintaanId: r.permintaan_id, woId: r.wo_id, nomor: r.nomor, status: r.status,
  })));
}

export async function keluarkanBahan(
  ctx: KonteksProduksi, input: unknown,
): Promise<Result<HasilKeluarkanBahan>> {
  const data = validasi(keluarkanBahanSchema, input);
  if (!data.ok) return data;
  const spk = await ambilSpk(ctx, data.data.woId);
  if (!spk.ok) return spk;
  if (!["BAHAN_CUKUP", "BAHAN_SIAP", "REWORK"].includes(spk.data.status as string)) {
    return fail("Bahan hanya dikeluarkan untuk SPK BAHAN_CUKUP, BAHAN_SIAP, atau REWORK.");
  }
  const kunci = kunciIdempotensi("KELUARKAN_BAHAN", [
    data.data.woId, data.data.produkId, data.data.gudangId, data.data.tanggal, data.data.qty,
  ], data.data.kunci);
  return jalankanRpc(ctx, "catat_pemakaian_bahan_keluar", "k10_keluarkan_bahan", {
    p_wo_id: data.data.woId, p_produk_id: data.data.produkId,
    p_satuan_id: data.data.satuanId, p_gudang_id: data.data.gudangId,
    p_qty: data.data.qty, p_tanggal: data.data.tanggal,
    p_keterangan: data.data.keterangan ?? null, p_kunci_idempotensi: kunci,
  }, dokumenOpsionalMentah.extend({
    pengeluaran_id: z.string(), mutasi_id: z.string(), nilai_keluar: z.string(),
    harga_satuan: z.string(), jurnal_id: z.string(),
  }).transform((r) => ({
    pengeluaranId: r.pengeluaran_id, mutasiId: r.mutasi_id, nilaiKeluar: r.nilai_keluar,
    hargaSatuan: r.harga_satuan, jurnalId: r.jurnal_id, ...dokumenOpsional(r),
  })));
}

export async function kembalikanBahan(
  ctx: KonteksProduksi, input: unknown,
): Promise<Result<HasilKembalikanBahan>> {
  const data = validasi(kembalikanBahanSchema, input);
  if (!data.ok) return data;
  const kunci = kunciIdempotensi("KEMBALIKAN_BAHAN", [
    data.data.woId, data.data.pengeluaranId, data.data.tanggal, data.data.qty,
  ], data.data.kunci);
  return jalankanRpc(ctx, "catat_pemakaian_bahan_keluar", "k10_kembalikan_bahan", {
    p_wo_id: data.data.woId, p_pengeluaran_id: data.data.pengeluaranId,
    p_qty: data.data.qty, p_tanggal: data.data.tanggal,
    p_keterangan: data.data.keterangan ?? null, p_kunci_idempotensi: kunci,
  }, z.object({
    pemakaian_id: z.string(), mutasi_id: z.string(), nilai_kembali: z.string(), jurnal_id: z.string(),
  }).transform((r) => ({
    pemakaianId: r.pemakaian_id, mutasiId: r.mutasi_id,
    nilaiKembali: r.nilai_kembali, jurnalId: r.jurnal_id,
  })));
}

export async function konfirmasiPemakaian(
  ctx: KonteksProduksi, input: unknown,
): Promise<Result<HasilKonfirmasiPemakaian>> {
  const data = validasi(konfirmasiPemakaianSchema, input);
  if (!data.ok) return data;
  const kunci = kunciIdempotensi("KONFIRMASI_PEMAKAIAN", [
    data.data.woId, data.data.pengeluaranId, data.data.qtyScrap,
  ], data.data.kunci);
  return jalankanRpc(ctx, "catat_pemakaian_bahan_terpakai", "k10_konfirmasi_pemakaian", {
    p_wo_id: data.data.woId, p_pengeluaran_id: data.data.pengeluaranId,
    p_qty_scrap: data.data.qtyScrap, p_keterangan: data.data.keterangan ?? null,
    p_kunci_idempotensi: kunci,
  }, z.object({
    pemakaian_id: z.string(), qty_terpakai: z.string(), qty_sisa: z.string(), qty_scrap: z.string(),
  }).transform((r) => ({
    pemakaianId: r.pemakaian_id, qtyTerpakai: r.qty_terpakai,
    qtySisa: r.qty_sisa, qtyScrap: r.qty_scrap,
  })));
}

export async function catatHasilProduksi(
  ctx: KonteksProduksi, input: unknown,
): Promise<Result<HasilCatatHasil>> {
  const data = validasi(catatHasilSchema, input);
  if (!data.ok) return data;
  const spk = await ambilSpk(ctx, data.data.woId);
  if (!spk.ok) return spk;
  if (!["BERJALAN", "REWORK"].includes(spk.data.status as string)) {
    return fail("Hasil hanya dicatat untuk SPK BERJALAN atau REWORK.");
  }
  const keluar = await listPengeluaranBahan(ctx.supabase, data.data.woId);
  if (!keluar.ok) return keluar;
  if (keluar.data.some((item) => item.pemakaian === null)) {
    return fail("Semua bahan yang dikeluarkan harus dikonfirmasi sebelum hasil dicatat.");
  }
  const kunci = kunciIdempotensi("CATAT_HASIL", [
    data.data.woId, data.data.percobaan, data.data.qtyDiproses,
  ], data.data.kunci);
  return jalankanRpc(ctx, "catat_hasil_produksi", "k10_catat_hasil", {
    p_wo_id: data.data.woId, p_percobaan: data.data.percobaan,
    p_qty_diproses: data.data.qtyDiproses, p_tanggal: data.data.tanggal ?? null,
    p_keterangan: data.data.keterangan ?? null, p_kunci_idempotensi: kunci,
  }, dokumenOpsionalMentah.extend({ hasil_id: z.string(), percobaan: z.number() })
    .transform((r) => ({
      hasilId: r.hasil_id, percobaan: r.percobaan, ...dokumenOpsional(r),
    })));
}

export async function catatQcHasil(
  ctx: KonteksProduksi, input: unknown,
): Promise<Result<HasilCatatQc>> {
  const data = validasi(catatQcSchema, input);
  if (!data.ok) return data;
  const hasil = await listHasilProduksi(ctx.supabase, data.data.woId);
  if (!hasil.ok) return hasil;
  const catatan = hasil.data.find((item) => item.id === data.data.hasilId);
  if (!catatan) return fail("Catatan hasil produksi tidak ditemukan untuk SPK ini.");
  if (catatan.created_by === ctx.actorId) {
    return fail("Pencatat hasil tidak boleh menjadi pemeriksa QC untuk hasil yang sama.");
  }
  const dibagikan = skalaQty(data.data.qtyLulus) + skalaQty(data.data.qtyRework) + skalaQty(data.data.qtyReject);
  if (dibagikan !== skalaQty(catatan.qty_diproses)) {
    return fail("Lulus, rework, dan reject harus sama dengan jumlah yang diproses.");
  }
  return jalankanRpc(ctx, "periksa_qc_hasil", "k10_catat_qc", {
    p_hasil_id: data.data.hasilId, p_wo_id: data.data.woId,
    p_qty_lulus: data.data.qtyLulus, p_qty_rework: data.data.qtyRework,
    p_qty_reject: data.data.qtyReject, p_catatan: data.data.catatan ?? null,
    p_kunci_idempotensi: kunciQcHasil(data.data.hasilId, data.data.woId, data.data.kunci),
  }, dokumenOpsionalMentah.extend({
    qc_id: z.string(), keputusan: z.enum(["QC_PASSED", "REWORK", "REJECTED"]),
    nilai_per_unit_baik: z.string(), kerugian_abnormal: z.string(), jurnal_id: z.string().nullable(),
  }).transform((r) => ({
    qcId: r.qc_id, keputusan: r.keputusan, nilaiPerUnitBaik: r.nilai_per_unit_baik,
    kerugianAbnormal: r.kerugian_abnormal, jurnalId: r.jurnal_id, ...dokumenOpsional(r),
  })));
}

export async function terimaBarangJadi(
  ctx: KonteksProduksi, input: unknown,
): Promise<Result<HasilTerimaBarangJadi>> {
  const data = validasi(terimaBarangJadiSchema, input);
  if (!data.ok) return data;
  const spk = await ambilSpk(ctx, data.data.woId);
  if (!spk.ok) return spk;
  if (spk.data.status !== "QC_PASSED") {
    return fail("Barang jadi hanya diterima dari SPK berstatus QC_PASSED.");
  }
  const kunci = kunciIdempotensi("TERIMA_BARANG_JADI", [
    data.data.woId, data.data.gudangId, data.data.tanggal, data.data.qty,
  ], data.data.kunci);
  return jalankanRpc(ctx, "terima_barang_jadi", "k10_terima_barang_jadi", {
    p_wo_id: data.data.woId, p_gudang_id: data.data.gudangId, p_qty: data.data.qty,
    p_tanggal: data.data.tanggal, p_kunci_qc: data.data.kunciQc,
    p_keterangan: data.data.keterangan ?? null, p_kunci_idempotensi: kunci,
  }, dokumenOpsionalMentah.extend({
    mutasi_id: z.string(), nilai: z.string(), jurnal_id: z.string(),
  }).transform((r) => ({
    mutasiId: r.mutasi_id, nilai: r.nilai, jurnalId: r.jurnal_id, ...dokumenOpsional(r),
  })));
}

export async function catatKartuJamKerja(
  ctx: KonteksProduksi, input: unknown,
): Promise<Result<HasilCatatKjk>> {
  const data = validasi(catatKjkSchema, input);
  if (!data.ok) return data;
  const kunci = kunciIdempotensi("CATAT_KJK", [
    data.data.woId, data.data.karyawanId, data.data.tanggal,
  ], data.data.kunci);
  return jalankanRpc(ctx, "catat_kartu_jam_kerja", "k10_catat_kjk", {
    p_wo_id: data.data.woId, p_karyawan_id: data.data.karyawanId, p_tanggal: data.data.tanggal,
    p_jam_kerja: data.data.jamKerja, p_tarif_per_jam: data.data.tarifPerJam,
    p_keterangan: data.data.keterangan ?? null, p_kunci_idempotensi: kunci,
  }, z.object({ kartu_id: z.string() }).transform((r) => ({ kartuId: r.kartu_id })));
}

export async function tetapkanTarifOverhead(
  ctx: KonteksProduksi, input: unknown,
): Promise<Result<HasilTarifOverhead>> {
  const data = validasi(tetapkanTarifOverheadSchema, input);
  if (!data.ok) return data;
  return jalankanRpc(ctx, "tetapkan_tarif_overhead", "k10_tetapkan_tarif_overhead", {
    p_berlaku_dari: data.data.berlakuDari, p_tarif: data.data.tarif,
    p_kapasitas_normal: data.data.kapasitasNormal, p_keterangan: data.data.keterangan ?? null,
    p_kunci_idempotensi: kunciIdempotensi("TARIF_OVERHEAD", [data.data.berlakuDari], data.data.kunci),
  }, z.object({ tarif_id: z.string() }).transform((r) => ({ tarifId: r.tarif_id })));
}

export async function catatOverheadAktual(
  ctx: KonteksProduksi, input: unknown,
): Promise<Result<HasilOverheadAktual>> {
  const data = validasi(catatOverheadAktualSchema, input);
  if (!data.ok) return data;
  return jalankanRpc(ctx, "catat_biaya_produksi", "k10_catat_overhead_aktual", {
    p_periode: data.data.periode, p_akun_id: data.data.akunId, p_nilai: data.data.nilai,
    p_keterangan: data.data.keterangan ?? null,
    p_kunci_idempotensi: kunciIdempotensi("OVERHEAD_AKTUAL", [data.data.periode, data.data.akunId], data.data.kunci),
  }, z.object({ overhead_aktual_id: z.string() })
    .transform((r) => ({ overheadAktualId: r.overhead_aktual_id })));
}

export async function bebankanTkl(
  ctx: KonteksProduksi, input: unknown,
): Promise<Result<HasilBebankanTkl>> {
  const data = validasi(bebankanTklSchema, input);
  if (!data.ok) return data;
  if (new Set(data.data.kartuIds).size !== data.data.kartuIds.length) {
    return fail("Kartu jam kerja tidak boleh dibebankan dua kali.");
  }
  return jalankanRpc(ctx, "catat_biaya_produksi", "k10_bebankan_tkl", {
    p_wo_id: data.data.woId, p_kartu_ids: data.data.kartuIds, p_tanggal: data.data.tanggal,
    p_kunci_idempotensi: kunciIdempotensi("BEBANKAN_TKL", [
      data.data.woId, [...data.data.kartuIds].sort().join(","),
    ], data.data.kunci),
  }, z.object({
    total: z.string(), jurnal_ids: z.array(z.string()), event_ids: z.array(z.string()),
  }).transform((r) => ({ total: r.total, jurnalIds: r.jurnal_ids, eventIds: r.event_ids })));
}

export async function bebankanOverhead(
  ctx: KonteksProduksi, input: unknown,
): Promise<Result<HasilBebankanOverhead>> {
  const data = validasi(bebankanOverheadSchema, input);
  if (!data.ok) return data;
  return jalankanRpc(ctx, "catat_biaya_produksi", "k10_bebankan_overhead", {
    p_wo_id: data.data.woId, p_dlh: data.data.dlh, p_tanggal: data.data.tanggal,
    p_kunci_idempotensi: kunciIdempotensi("BEBANKAN_OVERHEAD", [
      data.data.woId, data.data.dlh, data.data.tanggal.slice(0, 10),
    ], data.data.kunci),
  }, z.object({
    tarif_id: z.string(), nominal: z.string(), jurnal_id: z.string(), event_id: z.string(),
  }).transform((r) => ({
    tarifId: r.tarif_id, nominal: r.nominal, jurnalId: r.jurnal_id, eventId: r.event_id,
  })));
}

export async function hitungHppFinal(
  ctx: KonteksProduksi, input: unknown,
): Promise<Result<HasilHppFinal>> {
  const data = validasi(hitungHppFinalSchema, input);
  if (!data.ok) return data;
  const spk = await ambilSpk(ctx, data.data.woId);
  if (!spk.ok) return spk;
  if (spk.data.status !== "SELESAI") {
    return fail("HPP final hanya dihitung untuk SPK berstatus SELESAI.");
  }
  return jalankanRpc(ctx, "catat_biaya_produksi", "k10_hitung_hpp_final", {
    p_wo_id: data.data.woId,
    p_kunci_idempotensi: kunciIdempotensi("HPP_FINAL", [data.data.woId], data.data.kunci),
  }, z.object({
    total_hpp: z.string(), qty_lulus: z.string(), hpp_per_unit: z.string(),
    jurnal_id: z.string().nullable(), event_id: z.string().nullable(),
  }).transform((r) => ({
    totalHpp: r.total_hpp, qtyLulus: r.qty_lulus, hppPerUnit: r.hpp_per_unit,
    jurnalId: r.jurnal_id, eventId: r.event_id,
  })));
}
