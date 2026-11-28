"use server";

import { revalidatePath } from "next/cache";
import type { z } from "zod";

import {
  ajukanPermintaanBahan,
  bebankanOverhead,
  bebankanTkl,
  buatPerintahProduksi,
  catatHasilProduksi,
  catatKartuJamKerja,
  catatOverheadAktual,
  catatQcHasil,
  getProduksiExecutionContext,
  hitungHppFinal,
  kembalikanBahan,
  konfirmasiPemakaian,
  keluarkanBahan,
  kunciQcHasil,
  listHasilProduksi,
  listPengeluaranBahan,
  pindahStatusSpk,
  simpanVersiBom,
  terimaBarangJadi,
  tetapkanTarifOverhead,
  type KonteksProduksi,
} from "@/core/produksi";
import {
  bebankanOverheadSchema,
  bebankanTklSchema,
  hitungHppFinalSchema,
  kembalikanBahanSchema,
  konfirmasiPemakaianSchema,
  pindahStatusSpkSchema,
  terimaBarangJadiSchema,
  tetapkanTarifOverheadSchema,
  type HasilKonfirmasiPemakaian,
  type HasilKembalikanBahan,
} from "@/core/produksi/types";
import { fail, ok, type Result } from "@/lib/result";
import {
  keAjukanPRInput,
  parseBomVersiCreateForm,
  parseHasilProduksiForm,
  parseKartuJamKerjaForm,
  parseMaterialIssueForm,
  parseMaterialReturnForm,
  parseOverheadAktualForm,
  parsePermintaanBahanForm,
  parseQcVerdictForm,
  parseSpkCreateForm,
} from "@/modules/produksi/validation";

const PESAN_VALIDASI = "Periksa kembali data yang diisi.";
const SEMUA_PATH = [
  "/produksi/bom-produk",
  "/produksi/perintah-produksi",
  "/produksi/hasil-produksi",
  "/produksi/kartu-jam-kerja",
  "/produksi/pembelian-bahan",
  "/produksi/pembelian-bahan/daftar",
  "/produksi/laporan",
];

function teks(formData: FormData, nama: string): string | null {
  const nilai = formData.get(nama);
  return typeof nilai === "string" && nilai.trim() !== "" ? nilai.trim() : null;
}

function pesanValidasi(fieldErrors: Record<string, string>): string {
  return Object.values(fieldErrors)[0] ?? PESAN_VALIDASI;
}

function validasiMentah<S extends z.ZodTypeAny>(
  schema: S,
  input: unknown,
): Result<z.output<S>> {
  const hasil = schema.safeParse(input);
  return hasil.success
    ? ok(hasil.data)
    : fail(hasil.error.issues[0]?.message ?? PESAN_VALIDASI);
}

async function jalankan<T>(
  aksi: (ctx: KonteksProduksi) => Promise<Result<T>>,
  paths: readonly string[] = SEMUA_PATH,
): Promise<Result<T>> {
  const ctx = await getProduksiExecutionContext();
  if (!ctx.ok) return fail(ctx.message);
  const hasil = await aksi(ctx.data);
  if (hasil.ok) paths.forEach((path) => revalidatePath(path));
  return hasil;
}

export async function simpanBomVersi(formData: FormData) {
  const { input, fieldErrors } = parseBomVersiCreateForm(formData);
  if (!input) return fail(pesanValidasi(fieldErrors));
  const { keterangan, ...data } = input;
  void keterangan;
  return jalankan((ctx) =>
    simpanVersiBom(ctx, {
      ...data,
      kunci: teks(formData, "kunci") ?? undefined,
    }),
  );
}

export async function buatSpk(formData: FormData) {
  const { input, fieldErrors } = parseSpkCreateForm(formData);
  if (!input) return fail(pesanValidasi(fieldErrors));
  return jalankan((ctx) =>
    buatPerintahProduksi(ctx, {
      ...input,
      kunci: teks(formData, "kunci") ?? undefined,
    }),
  );
}

export async function ubahStatusSpk(formData: FormData) {
  const input = validasiMentah(pindahStatusSpkSchema, {
    woId: teks(formData, "wo_id"),
    versi: Number(formData.get("versi")),
    statusTujuan: teks(formData, "status_tujuan"),
    aksi: teks(formData, "aksi"),
    alasan: teks(formData, "alasan") ?? undefined,
    kunci: teks(formData, "kunci") ?? undefined,
  });
  if (!input.ok) return fail(input.message);
  return jalankan((ctx) => pindahStatusSpk(ctx, input.data));
}

export async function ajukanBahan(formData: FormData) {
  const { input, fieldErrors } = parsePermintaanBahanForm(formData);
  if (!input) return fail(pesanValidasi(fieldErrors));
  return jalankan(async (ctx) => {
    const permintaan = keAjukanPRInput(input, ctx.actorId);
    const { actorId, ...data } = permintaan;
    if (!actorId) return fail("Aktor tidak ditemukan.");
    return ajukanPermintaanBahan(ctx, {
      ...data,
      kunci: teks(formData, "kunci") ?? undefined,
    });
  });
}

export async function keluarkanBahanUntukSpk(formData: FormData) {
  const { input, fieldErrors } = parseMaterialIssueForm(formData);
  if (!input) return fail(pesanValidasi(fieldErrors));
  const { qtyKeluar, ...data } = input;
  return jalankan((ctx) =>
    keluarkanBahan(ctx, {
      ...data,
      qty: qtyKeluar,
      kunci: teks(formData, "kunci") ?? undefined,
    }),
  );
}

export async function kembalikanBahanKeGudang(formData: FormData) {
  const input = validasiMentah(kembalikanBahanSchema, {
    woId: teks(formData, "wo_id"),
    pengeluaranId: teks(formData, "pengeluaran_id"),
    qty: teks(formData, "qty"),
    tanggal: teks(formData, "tanggal"),
    keterangan: teks(formData, "keterangan") ?? undefined,
    kunci: teks(formData, "kunci") ?? undefined,
  });
  if (!input.ok) return fail(input.message);
  return jalankan((ctx) => kembalikanBahan(ctx, input.data));
}

export async function konfirmasiPemakaianBahan(formData: FormData) {
  return jalankan<HasilKonfirmasiPemakaian>(async (ctx) => {
    const woId = teks(formData, "wo_id");
    const pengeluaranId = teks(formData, "pengeluaran_id");
    if (!woId || !pengeluaranId) return fail("Pengeluaran bahan tidak valid.");
    const daftar = await listPengeluaranBahan(ctx.supabase, woId);
    if (!daftar.ok) return fail(daftar.message);
    const pengeluaran = daftar.data.find((item) => item.id === pengeluaranId);
    if (!pengeluaran) return fail("Catatan pengeluaran tidak ditemukan.");
    const { input, fieldErrors } = parseMaterialReturnForm(
      formData,
      pengeluaran.qty_keluar,
    );
    if (!input) return fail(pesanValidasi(fieldErrors));
    if (Number(input.qtySisa) > 0) {
      return fail("Sisa bahan harus dikembalikan oleh Gudang sebelum konfirmasi");
    }
    const konfirmasi = validasiMentah(konfirmasiPemakaianSchema, {
      woId: input.woId,
      pengeluaranId: input.pengeluaranId,
      qtyScrap: input.qtyScrap,
      keterangan: input.keterangan ?? undefined,
      kunci: teks(formData, "kunci") ?? undefined,
    });
    if (!konfirmasi.ok) return fail(konfirmasi.message);
    return konfirmasiPemakaian(ctx, konfirmasi.data);
  });
}

export async function catatHasil(formData: FormData) {
  const { input, fieldErrors } = parseHasilProduksiForm(formData);
  if (!input) return fail(pesanValidasi(fieldErrors));
  return jalankan((ctx) =>
    catatHasilProduksi(ctx, {
      ...input,
      kunci: teks(formData, "kunci") ?? undefined,
    }),
  );
}

export async function catatQc(formData: FormData) {
  return jalankan(async (ctx) => {
    const woId = teks(formData, "wo_id");
    const hasilId = teks(formData, "hasil_produksi_id");
    if (!woId || !hasilId) return fail("Hasil produksi tidak valid.");
    const daftar = await listHasilProduksi(ctx.supabase, woId);
    if (!daftar.ok) return fail(daftar.message);
    const hasil = daftar.data.find((item) => item.id === hasilId);
    if (!hasil) return fail("Catatan hasil produksi tidak ditemukan.");
    const { input, fieldErrors } = parseQcVerdictForm(formData, {
      qtyDiproses: hasil.qty_diproses,
      hasilCreatedBy: hasil.created_by ?? "",
      actorId: ctx.actorId,
    });
    if (!input) return fail(pesanValidasi(fieldErrors));
    const kunci = kunciQcHasil(hasilId, woId);
    const hasilQc = await catatQcHasil(ctx, {
      hasilId: input.hasilProduksiId,
      woId: input.woId,
      qtyLulus: input.qtyLulus,
      qtyRework: input.qtyRework,
      qtyReject: input.qtyReject,
      catatan: input.catatan ?? null,
      kunci,
    });
    if (!hasilQc.ok) return hasilQc;
    return ok({ ...hasilQc.data, kunciQc: kunci });
  });
}

async function kunciQcTersimpan(
  ctx: KonteksProduksi,
  woId: string,
  diajukan: string | null,
): Promise<Result<string>> {
  const daftar = await listHasilProduksi(ctx.supabase, woId);
  if (!daftar.ok) return fail(daftar.message);
  const hasil = daftar.data.find((item) => item.qc?.keputusan === "QC_PASSED");
  if (!hasil) return fail("Keputusan QC lulus tidak ditemukan.");
  const kunci = kunciQcHasil(hasil.id, woId);
  if (diajukan !== null && diajukan !== kunci) {
    return fail("Kunci QC tidak sesuai dengan keputusan yang tersimpan.");
  }
  return ok(kunci);
}

export async function terimaBarangJadiDariQc(formData: FormData) {
  return jalankan(async (ctx) => {
    const woId = teks(formData, "wo_id");
    if (!woId) return fail("Perintah produksi tidak valid.");
    const kunciQc = await kunciQcTersimpan(ctx, woId, teks(formData, "kunci_qc"));
    if (!kunciQc.ok) return fail(kunciQc.message);
    const input = validasiMentah(terimaBarangJadiSchema, {
      woId,
      gudangId: teks(formData, "gudang_id"),
      qty: teks(formData, "qty"),
      tanggal: teks(formData, "tanggal"),
      kunciQc: kunciQc.data,
      keterangan: teks(formData, "keterangan") ?? undefined,
      kunci: teks(formData, "kunci") ?? undefined,
    });
    if (!input.ok) return fail(input.message);
    return terimaBarangJadi(ctx, input.data);
  });
}

export async function catatJamKerja(formData: FormData) {
  const { input, fieldErrors } = parseKartuJamKerjaForm(formData);
  if (!input) return fail(pesanValidasi(fieldErrors));
  return jalankan((ctx) =>
    catatKartuJamKerja(ctx, {
      ...input,
      kunci: teks(formData, "kunci") ?? undefined,
    }),
  );
}

export async function tetapkanTarif(formData: FormData) {
  const input = validasiMentah(tetapkanTarifOverheadSchema, {
    berlakuDari: teks(formData, "berlaku_dari"),
    tarif: teks(formData, "tarif"),
    kapasitasNormal: teks(formData, "kapasitas_normal"),
    keterangan: teks(formData, "keterangan") ?? undefined,
    kunci: teks(formData, "kunci") ?? undefined,
  });
  if (!input.ok) return fail(input.message);
  return jalankan((ctx) => tetapkanTarifOverhead(ctx, input.data));
}

export async function catatOverhead(formData: FormData) {
  const { input, fieldErrors } = parseOverheadAktualForm(formData);
  if (!input) return fail(pesanValidasi(fieldErrors));
  return jalankan((ctx) =>
    catatOverheadAktual(ctx, {
      ...input,
      kunci: teks(formData, "kunci") ?? undefined,
    }),
  );
}

export async function bebankanTklKeSpk(formData: FormData) {
  const input = validasiMentah(bebankanTklSchema, {
    woId: teks(formData, "wo_id"),
    kartuIds: formData.getAll("kartu_ids").map((nilai) => String(nilai)),
    tanggal: teks(formData, "tanggal"),
    kunci: teks(formData, "kunci") ?? undefined,
  });
  if (!input.ok) return fail(input.message);
  return jalankan((ctx) => bebankanTkl(ctx, input.data));
}

export async function bebankanOverheadKeSpk(formData: FormData) {
  const input = validasiMentah(bebankanOverheadSchema, {
    woId: teks(formData, "wo_id"),
    dlh: teks(formData, "dlh"),
    tanggal: teks(formData, "tanggal"),
    kunci: teks(formData, "kunci") ?? undefined,
  });
  if (!input.ok) return fail(input.message);
  return jalankan((ctx) => bebankanOverhead(ctx, input.data));
}

export async function postingHppFinal(formData: FormData) {
  const input = validasiMentah(hitungHppFinalSchema, {
    woId: teks(formData, "wo_id"),
    kunci: teks(formData, "kunci") ?? undefined,
  });
  if (!input.ok) return fail(input.message);
  return jalankan(
    (ctx) => hitungHppFinal(ctx, input.data),
    ["/produksi/kartu-jam-kerja", "/produksi/laporan"],
  );
}
