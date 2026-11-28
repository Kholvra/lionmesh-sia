"use server";

import type { SupabaseClient } from "@supabase/supabase-js";

import { listKaryawanRingkas } from "@/core/karyawan";
import {
  getHppProduksi,
  getProduksiExecutionContext,
  listBiayaEvent,
  listKartuJamKerja,
  listPerintahProduksi,
  listTarifOverhead,
  type KonteksProduksi,
} from "@/core/produksi";
import { listGudang, listProduk, listSatuan } from "@/core/master";
import { cekIzin } from "@/lib/auth/permissions";
import { fail, ok, type Result } from "@/lib/result";
import { createClient } from "@/lib/supabase/server";
import type { HppSpkSummary, KartuData } from "@/modules/produksi/kartu-jam-kerja/types";

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
    produk: new Map((produk.data as { id: string; kode: string; nama: string; tipe: string }[]).map((item) => [item.id, item])),
    gudang: new Map((gudang.data as { id: string; kode: string; nama: string }[]).map((item) => [item.id, item])),
    satuan: new Map((satuan.data as { id: string; kode: string; nama: string }[]).map((item) => [item.id, item])),
  });
}

function statusHpp(status: string): HppSpkSummary["statusWo"] {
  if (status === "SELESAI") return "SELESAI";
  if (["HASIL_DICATAT", "QC_PASSED"].includes(status)) return "HASIL_DICATAT";
  if (["BERJALAN", "REWORK"].includes(status)) return "DIPROSES";
  return "DIRENCANAKAN";
}

async function ringkasanHpp(
  ctx: KonteksProduksi,
  woId: string,
  nomor: string,
  produkNama: string,
  produkKode: string,
  target: number,
  jadwal: string,
  status: string,
  tarif: number,
): Promise<Result<HppSpkSummary>> {
  const [hpp, event] = await Promise.all([
    getHppProduksi(ctx.supabase, woId),
    listBiayaEvent(ctx.supabase, woId),
  ]);
  if (!hpp.ok) return fail(hpp.message);
  if (!event.ok) return fail(event.message);
  const sumber = (jenis: string) =>
    event.data.find((item) => item.jenis === jenis)?.keterangan ?? "—";
  const biayaOverheadRp = angka(hpp.data?.komponen.OVERHEAD);
  const final = event.data.some((item) => item.jenis === "PENYESUAIAN_HPP");
  const sementara = event.data.some((item) =>
    ["TKL", "OVERHEAD", "BAHAN"].includes(item.jenis),
  );
  const statusPostingHpp: HppSpkSummary["statusPostingHpp"] = final
    ? "FINAL_DIPOSTING"
    : sementara
      ? "DIBEBANKAN_SEMENTARA"
      : "BELUM_POSTING";
  const tanggalPosting = final
    ? formatTanggal(
        event.data.find((item) => item.jenis === "PENYESUAIAN_HPP")?.created_at ?? "",
      )
    : undefined;
  return ok({
    woId,
    nomorSpk: nomor,
    produkNama,
    produkKode,
    jumlahLulus: angka(hpp.data?.qtyLulus),
    targetLembar: target,
    jadwalText: jadwal,
    statusWo: statusHpp(status),
    biayaBahanRp: angka(hpp.data?.komponen.BAHAN),
    biayaTklRp: angka(hpp.data?.komponen.TKL),
    biayaOverheadRp,
    biayaReworkRp: angka(hpp.data?.komponen.REWORK),
    rejectAbnormalRp: angka(hpp.data?.komponen.KERUGIAN),
    totalHppRp: angka(hpp.data?.total),
    hppPerUnitRp: angka(hpp.data?.hppPerUnit),
    sumberBahanDoc: sumber("BAHAN"),
    sumberTklDoc: sumber("TKL"),
    sumberOverheadDoc: sumber("OVERHEAD"),
    tarifOverheadPerDlh: tarif,
    totalDlh: tarif > 0 ? biayaOverheadRp / tarif : 0,
    statusPostingHpp,
    ...(tanggalPosting ? { tanggalPosting } : {}),
  });
}

export async function muatKartuData(): Promise<Result<KartuData>> {
  const ctx = await konteks();
  if (!ctx.ok) return fail(ctx.message);
  if (!cekIzin(ctx.data.peran, "lihat_kartu_jam_kerja")) {
    return fail("Anda tidak berwenang melihat kartu jam kerja.");
  }
  const admin = await getProduksiExecutionContext();
  if (!admin.ok) return fail(admin.message);
  const [spk, dataMaster, tarif, karyawan] = await Promise.all([
    listPerintahProduksi(ctx.data.supabase),
    master(ctx.data.supabase),
    listTarifOverhead(ctx.data.supabase),
    listKaryawanRingkas(admin.data.supabase),
  ]);
  if (!spk.ok) return fail(spk.message);
  if (!dataMaster.ok) return fail(dataMaster.message);
  if (!tarif.ok) return fail(tarif.message);
  if (karyawan.error) return fail(karyawan.error);
  const tarifBerlaku = tarif.data.find(
    (item) => item.berlaku_dari <= new Date().toISOString().slice(0, 10),
  );
  const tarifPerDlh = tarifBerlaku ? angka(tarifBerlaku.tarif) : 0;
  const daftarKaryawan = karyawan.data;
  const bolehNik = cekIzin(ctx.data.peran, "baca_identitas_karyawan");
  const namaKaryawan = new Map(
    daftarKaryawan.map((item) => [item.id, item.nama]),
  );
  const nikKaryawan = new Map(
    daftarKaryawan.map((item) => [item.id, bolehNik ? item.nik : "•••"]),
  );
  const kjk: KartuData["kjk"] = [];
  const hpp: HppSpkSummary[] = [];
  for (const item of spk.data) {
    const [kartu, event] = await Promise.all([
      listKartuJamKerja(ctx.data.supabase, item.dokumen_id),
      listBiayaEvent(ctx.data.supabase, item.dokumen_id),
    ]);
    if (!kartu.ok) return fail(kartu.message);
    if (!event.ok) return fail(event.message);
    const produk = dataMaster.data.produk.get(item.produk_id);
    const dibebankan = event.data.some((baris) => baris.jenis === "TKL");
    for (const baris of kartu.data) {
      const jam = angka(baris.jam_kerja);
      const tarifJam = angka(baris.tarif_per_jam);
      kjk.push({
        id: baris.id,
        woId: item.dokumen_id,
        karyawanId: baris.karyawan_id,
        nomorSpk: item.nomor,
        namaKaryawan: namaKaryawan.get(baris.karyawan_id) ?? "Karyawan tidak ditemukan",
        nik: nikKaryawan.get(baris.karyawan_id) ?? "—",
        tanggal: formatTanggal(baris.tanggal),
        tanggalISO: baris.tanggal,
        jamReguler: jam,
        jamLembur: 0,
        totalJam: jam,
        tarifPerJam: tarifJam,
        totalTkl: jam * tarifJam,
        kegiatan: baris.keterangan ?? "—",
        status: dibebankan ? "DIBEBANKAN" : "TERCATAT",
      });
    }
    if (event.data.length > 0) {
      const ringkas = await ringkasanHpp(
        ctx.data,
        item.dokumen_id,
        item.nomor,
        produk?.nama ?? "Produk tidak ditemukan",
        produk?.kode ?? "—",
        angka(item.target_qty),
        `${formatTanggal(item.tanggal_perintah)} – ${formatTanggal(item.tgl_target_selesai)}`,
        item.status,
        tarifPerDlh,
      );
      if (!ringkas.ok) return fail(ringkas.message);
      hpp.push(ringkas.data);
    }
  }
  return ok({
    kjk,
    hpp,
    spkOptions: spk.data.map((item) => ({
      woId: item.dokumen_id,
      nomorSpk: item.nomor,
      produkNama: dataMaster.data.produk.get(item.produk_id)?.nama ?? "—",
    })),
    karyawanOptions: daftarKaryawan.map((item) => ({
      id: item.id,
      nama: item.nama,
      nik: bolehNik ? item.nik : "•••",
    })),
    tarifOverheadPerDlh: tarifBerlaku ? tarifPerDlh : null,
  });
}

export async function muatHppDetail(
  nomor: string,
): Promise<Result<HppSpkSummary | null>> {
  const data = await muatKartuData();
  if (!data.ok) return fail(data.message);
  const hasil = data.data.hpp.find(
    (item) => item.nomorSpk.toLowerCase() === nomor.toLowerCase(),
  );
  return ok(hasil ?? null);
}
