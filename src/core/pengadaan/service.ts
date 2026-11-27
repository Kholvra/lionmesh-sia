import type { SupabaseClient } from "@supabase/supabase-js";

import type { Dokumen, StatusDokumen } from "@/core/dokumen";
import { fail, ok, type Result } from "@/lib/result";
import { isIsoDate, isRecord, isUuid } from "@/lib/validation";

import {
  petaBarisPenerimaan,
  petaBarisPO,
  petaBarisPermintaan,
  petaBarisQC,
  validasiAlasan,
  validasiBarisPenerimaan,
  validasiBarisPO,
  validasiBarisPermintaan,
  validasiBarisQC,
  validasiJenisPenerimaan,
  validasiVersi,
} from "./rules";
import type {
  AjukanPRInput,
  BatalkanPOInput,
  BatalkanPRInput,
  BuatPOInput,
  CatatPenerimaanInput,
  CatatQCInput,
  HasilDokumenPengadaan,
  HasilPenerimaan,
  HasilPermintaanPembelian,
  HasilPurchaseOrder,
  HasilQC,
  PeriksaPRDenganNilaiInput,
  PeriksaPRInput,
  TetapkanPemasokPRInput,
} from "./types";

function pesanKesalahan(
  error: { message?: string } | null,
  fallback: string,
): string {
  const message = error?.message?.trim();
  return message && message.length > 0 ? message : fallback;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : String(value ?? "");
}

function parseDokumen(value: unknown): HasilDokumenPengadaan | null {
  if (!isRecord(value) || !isRecord(value.dokumen) || typeof value.riwayat_id !== "string") {
    return null;
  }

  return {
    dokumen: value.dokumen as unknown as Dokumen,
    riwayatId: value.riwayat_id,
  };
}

export async function ajukanPR(
  supabase: SupabaseClient,
  input: AjukanPRInput,
): Promise<Result<HasilPermintaanPembelian>> {
  const barisError = validasiBarisPermintaan(input.baris);
  if (barisError) return fail(barisError);

  if (
    !isUuid(input.actorId) ||
    !isUuid(input.gudangId) ||
    !isIsoDate(input.tanggalButuh) ||
    (input.woId !== undefined && input.woId !== null && !isUuid(input.woId)) ||
    (input.tanggal !== undefined && !isIsoDate(input.tanggal)) ||
    input.baris.some((item) => !isUuid(item.produkId) || !isUuid(item.satuanId))
  ) {
    return fail("Data permintaan pembelian tidak valid.");
  }

  const { data, error } = await supabase.rpc("ajukan_pr", {
    p_aktor_id: input.actorId,
    p_gudang_id: input.gudangId,
    p_tanggal_butuh: input.tanggalButuh,
    p_keterangan: input.keterangan?.trim() || null,
    p_wo_id: input.woId ?? null,
    p_baris: petaBarisPermintaan(input.baris),
    p_tanggal: input.tanggal ?? null,
  });

  if (error) return fail(pesanKesalahan(error, "Gagal mengajukan permintaan pembelian."));

  const hasil = parseDokumen(data);
  if (!hasil || !isRecord(data) || typeof data.permintaan_id !== "string") {
    return fail("Respons permintaan pembelian tidak valid.");
  }

  return ok({ ...hasil, permintaanId: data.permintaan_id });
}

export async function periksaPR(
  supabase: SupabaseClient,
  input: PeriksaPRInput,
): Promise<Result<HasilDokumenPengadaan>> {
  if (!isUuid(input.actorId) || !isUuid(input.permintaanId) || validasiVersi(input.versi)) {
    return fail("Data pemeriksaan permintaan tidak valid.");
  }

  const { data, error } = await supabase.rpc("periksa_pr", {
    p_dokumen_id: input.permintaanId,
    p_versi: input.versi,
    p_aktor_id: input.actorId,
    p_alasan: input.alasan ?? null,
  });

  if (error) return fail(pesanKesalahan(error, "Gagal memeriksa permintaan pembelian."));
  const hasil = parseDokumen(data);
  return hasil ? ok(hasil) : fail("Respons pemeriksaan permintaan tidak valid.");
}

export async function periksaPRDenganNilai(
  supabase: SupabaseClient,
  input: PeriksaPRDenganNilaiInput,
): Promise<Result<HasilDokumenPengadaan>> {
  if (
    !isUuid(input.actorId) ||
    !isUuid(input.permintaanId) ||
    validasiVersi(input.versi) ||
    !/^\d+(\.\d{1,2})?$/.test(input.nilai)
  ) {
    return fail("Data pemeriksaan permintaan tidak valid.");
  }

  const { data, error } = await supabase.rpc("periksa_pr_dengan_nilai", {
    p_dokumen_id: input.permintaanId,
    p_versi: input.versi,
    p_aktor_id: input.actorId,
    p_nominal: input.nilai,
    p_alasan: input.alasan ?? null,
  });

  if (error) return fail(pesanKesalahan(error, "Gagal memeriksa permintaan pembelian."));
  const hasil = parseDokumen(data);
  return hasil ? ok(hasil) : fail("Respons pemeriksaan permintaan tidak valid.");
}

export async function tetapkanPemasokPR(
  supabase: SupabaseClient,
  input: TetapkanPemasokPRInput,
): Promise<Result<HasilDokumenPengadaan>> {
  if (
    !isUuid(input.actorId) ||
    !isUuid(input.permintaanId) ||
    !isUuid(input.pemasokId) ||
    validasiVersi(input.versi)
  ) {
    return fail("Data penetapan pemasok tidak valid.");
  }

  const { data, error } = await supabase.rpc("tetapkan_pemasok_pr", {
    p_dokumen_id: input.permintaanId,
    p_versi: input.versi,
    p_pemasok_id: input.pemasokId,
    p_aktor_id: input.actorId,
  });

  if (error) return fail(pesanKesalahan(error, "Gagal menetapkan pemasok permintaan."));
  const hasil = parseDokumen(data);
  return hasil ? ok(hasil) : fail("Respons penetapan pemasok tidak valid.");
}

export async function buatPO(
  supabase: SupabaseClient,
  input: BuatPOInput,
): Promise<Result<HasilPurchaseOrder>> {
  const barisError = validasiBarisPO(input.baris);
  if (barisError) return fail(barisError);

  if (
    !isUuid(input.actorId) ||
    !isUuid(input.permintaanId) ||
    !isUuid(input.pemasokId) ||
    validasiVersi(input.versi) ||
    (input.tanggal !== undefined && !isIsoDate(input.tanggal)) ||
    input.baris.some((item) => !isUuid(item.produkId))
  ) {
    return fail("Data purchase order tidak valid.");
  }

  const { data, error } = await supabase.rpc("buat_po", {
    p_dokumen_id: input.permintaanId,
    p_versi: input.versi,
    p_pemasok_id: input.pemasokId,
    p_baris: petaBarisPO(input.baris),
    p_tanggal: input.tanggal ?? null,
    p_aktor_id: input.actorId,
  });

  if (error) return fail(pesanKesalahan(error, "Gagal membuat purchase order."));

  const hasil = parseDokumen(data);
  if (!hasil || !isRecord(data) || typeof data.po_id !== "string") {
    return fail("Respons purchase order tidak valid.");
  }

  return ok({ ...hasil, poId: data.po_id });
}

export async function catatPenerimaan(
  supabase: SupabaseClient,
  input: CatatPenerimaanInput,
): Promise<Result<HasilPenerimaan>> {
  const jenisError = validasiJenisPenerimaan(input.jenis);
  if (jenisError) return fail(jenisError);

  const barisError = validasiBarisPenerimaan(input.baris);
  if (barisError) return fail(barisError);

  if (
    !isUuid(input.actorId) ||
    !isUuid(input.poId) ||
    !isUuid(input.gudangId) ||
    validasiVersi(input.versiPO) ||
    (input.tanggal !== undefined && !isIsoDate(input.tanggal)) ||
    input.baris.some((item) => !isUuid(item.poItemId))
  ) {
    return fail("Data penerimaan tidak valid.");
  }

  const { data, error } = await supabase.rpc("catat_penerimaan", {
    p_dokumen_id: input.poId,
    p_versi: input.versiPO,
    p_gudang_id: input.gudangId,
    p_jenis: input.jenis,
    p_baris: petaBarisPenerimaan(input.baris),
    p_tanggal: input.tanggal ?? null,
    p_aktor_id: input.actorId,
  });

  if (error) return fail(pesanKesalahan(error, "Gagal mencatat penerimaan."));

  if (!isRecord(data) || data.diterima !== true) {
    const pesan = isRecord(data) ? asString(data.pesan).trim() : "";
    return fail(pesan.length > 0 ? pesan : "Penerimaan ditolak.");
  }

  const hasil = parseDokumen(data);
  if (!hasil || typeof data.penerimaan_id !== "string" || typeof data.status_po !== "string") {
    return fail("Respons penerimaan tidak valid.");
  }

  return ok({
    ...hasil,
    penerimaanId: data.penerimaan_id,
    statusPo: data.status_po as StatusDokumen,
  });
}

export async function catatQC(
  supabase: SupabaseClient,
  input: CatatQCInput,
): Promise<Result<HasilQC>> {
  const barisError = validasiBarisQC(input.baris);
  if (barisError) return fail(barisError);

  if (
    !isUuid(input.actorId) ||
    !isUuid(input.penerimaanId) ||
    validasiVersi(input.versi) ||
    (input.tanggal !== undefined && !isIsoDate(input.tanggal)) ||
    input.baris.some((item) => !isUuid(item.penerimaanItemId))
  ) {
    return fail("Data QC tidak valid.");
  }

  const { data, error } = await supabase.rpc("catat_qc_penerimaan", {
    p_dokumen_id: input.penerimaanId,
    p_versi: input.versi,
    p_baris: petaBarisQC(input.baris),
    p_tanggal: input.tanggal ?? null,
    p_aktor_id: input.actorId,
  });

  if (error) return fail(pesanKesalahan(error, "Gagal mencatat hasil QC."));

  const hasil = parseDokumen(data);
  if (
    !hasil ||
    !isRecord(data) ||
    typeof data.status !== "string" ||
    typeof data.total_nilai !== "string" ||
    (data.jurnal_id !== null && typeof data.jurnal_id !== "string")
  ) {
    return fail("Respons QC tidak valid.");
  }

  return ok({
    ...hasil,
    status: data.status as StatusDokumen,
    totalNilai: data.total_nilai,
    jurnalId: data.jurnal_id,
  });
}

export async function batalkanPR(
  supabase: SupabaseClient,
  input: BatalkanPRInput,
): Promise<Result<HasilDokumenPengadaan>> {
  const alasanError = validasiAlasan(input.alasan);
  if (alasanError) return fail(alasanError);

  if (!isUuid(input.actorId) || !isUuid(input.permintaanId) || validasiVersi(input.versi)) {
    return fail("Data pembatalan permintaan tidak valid.");
  }

  const { data, error } = await supabase.rpc("batalkan_pr", {
    p_dokumen_id: input.permintaanId,
    p_versi: input.versi,
    p_alasan: input.alasan,
    p_aktor_id: input.actorId,
  });

  if (error) return fail(pesanKesalahan(error, "Gagal membatalkan permintaan pembelian."));
  const hasil = parseDokumen(data);
  return hasil ? ok(hasil) : fail("Respons pembatalan permintaan tidak valid.");
}

export async function batalkanPO(
  supabase: SupabaseClient,
  input: BatalkanPOInput,
): Promise<Result<HasilDokumenPengadaan>> {
  const alasanError = validasiAlasan(input.alasan);
  if (alasanError) return fail(alasanError);

  if (!isUuid(input.actorId) || !isUuid(input.poId) || validasiVersi(input.versi)) {
    return fail("Data pembatalan purchase order tidak valid.");
  }

  const { data, error } = await supabase.rpc("batalkan_po", {
    p_dokumen_id: input.poId,
    p_versi: input.versi,
    p_alasan: input.alasan,
    p_aktor_id: input.actorId,
  });

  if (error) return fail(pesanKesalahan(error, "Gagal membatalkan purchase order."));
  const hasil = parseDokumen(data);
  return hasil ? ok(hasil) : fail("Respons pembatalan purchase order tidak valid.");
}
