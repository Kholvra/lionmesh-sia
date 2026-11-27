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
  AjukanReturInput,
  BatalkanInvoiceInput,
  BatalkanPenerimaanInput,
  BatalkanPoInput,
  BatalkanReturInput,
  CatatInvoiceInput,
  CatatKonfirmasiPoInput,
  CocokkanUlangInvoiceInput,
  LokasiPemisahanInput,
  PeriksaPRDenganNilaiInput,
  PeriksaPRInput,
  PutuskanReturInput,
  SahkanInvoiceInput,
  SimpanPenawaranHargaInput,
  TerbitkanPoInput,
  TetapkanPemasokDenganAlasanInput,
  TetapkanPemasokPRInput,
  TutupExceptionInput,
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

export async function simpanPenawaranHarga(
  supabase: SupabaseClient,
  input: SimpanPenawaranHargaInput,
): Promise<Result<{ id: string; permintaanId: string }>> {
  if (
    !isUuid(input.actorId) ||
    !isUuid(input.permintaanId) ||
    !isUuid(input.itemId) ||
    !isUuid(input.pemasokId) ||
    !/^\d+(\.\d{1,2})?$/.test(input.harga) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(input.tanggal)
  ) {
    return fail("Data harga pembanding tidak valid.");
  }

  const { data, error } = await supabase.rpc("simpan_penawaran_harga", {
    p_dokumen_id: input.permintaanId,
    p_item_id: input.itemId,
    p_pemasok_id: input.pemasokId,
    p_harga: input.harga,
    p_tanggal: input.tanggal,
    p_aktor_id: input.actorId,
  });

  if (error) return fail(pesanKesalahan(error, "Gagal menyimpan harga pembanding."));

  const row = (data ?? {}) as Record<string, unknown>;
  const id = typeof row.id === "string" ? row.id : "";
  const permintaanId = typeof row.dokumen_id === "string" ? row.dokumen_id : "";
  return id && permintaanId
    ? ok({ id, permintaanId })
    : fail("Respons penyimpanan harga tidak valid.");
}

export async function tetapkanPemasokDenganAlasan(
  supabase: SupabaseClient,
  input: TetapkanPemasokDenganAlasanInput,
): Promise<Result<HasilDokumenPengadaan>> {
  if (
    !isUuid(input.actorId) ||
    !isUuid(input.permintaanId) ||
    !isUuid(input.pemasokId) ||
    validasiVersi(input.versi)
  ) {
    return fail("Data penetapan pemasok tidak valid.");
  }

  const { data, error } = await supabase.rpc("tetapkan_pemasok_pr_dengan_alasan", {
    p_dokumen_id: input.permintaanId,
    p_versi: input.versi,
    p_pemasok_id: input.pemasokId,
    p_alasan: input.alasan ?? null,
    p_aktor_id: input.actorId,
  });

  if (error) return fail(pesanKesalahan(error, "Gagal menetapkan pemasok."));
  const hasil = parseDokumen(data);
  return hasil ? ok(hasil) : fail("Respons penetapan pemasok tidak valid.");
}

export async function terbitkanPurchaseOrder(
  supabase: SupabaseClient,
  input: TerbitkanPoInput,
): Promise<Result<HasilDokumenPengadaan>> {
  if (
    !isUuid(input.actorId) ||
    !isUuid(input.permintaanId) ||
    validasiVersi(input.versi) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(input.tanggal) ||
    input.baris.length === 0
  ) {
    return fail("Data purchase order tidak valid.");
  }

  const baris = input.baris.map((row) => ({
    item_id: row.itemId,
    qty: row.qty,
    harga_satuan: row.hargaSatuan ?? "",
  }));

  const { data, error } = await supabase.rpc("terbitkan_po", {
    p_dokumen_id: input.permintaanId,
    p_versi: input.versi,
    p_baris: baris,
    p_tanggal: input.tanggal,
    p_aktor_id: input.actorId,
  });

  if (error) return fail(pesanKesalahan(error, "Gagal menerbitkan purchase order."));
  const hasil = parseDokumen(data);
  return hasil ? ok(hasil) : fail("Respons penerbitan purchase order tidak valid.");
}

export async function batalkanPurchaseOrder(
  supabase: SupabaseClient,
  input: BatalkanPoInput,
): Promise<Result<HasilDokumenPengadaan>> {
  if (!isUuid(input.actorId) || !isUuid(input.dokumenId) || validasiVersi(input.versi)) {
    return fail("Data pembatalan purchase order tidak valid.");
  }
  if (input.alasan.trim().length === 0) {
    return fail("Alasan pembatalan wajib diisi");
  }

  const { data, error } = await supabase.rpc("batalkan_po_dengan_permintaan", {
    p_dokumen_id: input.dokumenId,
    p_versi: input.versi,
    p_alasan: input.alasan.trim(),
    p_aktor_id: input.actorId,
  });

  if (error) return fail(pesanKesalahan(error, "Gagal membatalkan purchase order."));
  const hasil = parseDokumen(data);
  return hasil ? ok(hasil) : fail("Respons pembatalan purchase order tidak valid.");
}

export async function catatKonfirmasiPo(
  supabase: SupabaseClient,
  input: CatatKonfirmasiPoInput,
): Promise<Result<{ dokumenId: string }>> {
  if (!isUuid(input.actorId) || !isUuid(input.dokumenId)) {
    return fail("Data konfirmasi purchase order tidak valid.");
  }
  if (input.catatan.trim().length === 0) {
    return fail("Catatan konfirmasi wajib diisi");
  }

  const { error } = await supabase.rpc("catat_konfirmasi_po", {
    p_dokumen_id: input.dokumenId,
    p_catatan: input.catatan.trim(),
    p_aktor_id: input.actorId,
  });

  if (error) return fail(pesanKesalahan(error, "Gagal mencatat konfirmasi pemasok."));
  return ok({ dokumenId: input.dokumenId });
}

export async function batalkanPenerimaan(
  supabase: SupabaseClient,
  input: BatalkanPenerimaanInput,
): Promise<Result<HasilDokumenPengadaan>> {
  if (!isUuid(input.actorId) || !isUuid(input.dokumenId) || validasiVersi(input.versi)) {
    return fail("Data pembatalan penerimaan tidak valid.");
  }
  if (input.alasan.trim().length === 0) {
    return fail("Alasan pembatalan wajib diisi");
  }

  const { data, error } = await supabase.rpc("batalkan_penerimaan", {
    p_dokumen_id: input.dokumenId,
    p_versi: input.versi,
    p_alasan: input.alasan.trim(),
    p_aktor_id: input.actorId,
  });

  if (error) return fail(pesanKesalahan(error, "Gagal membatalkan penerimaan."));
  const hasil = parseDokumen(data);
  return hasil ? ok(hasil) : fail("Respons pembatalan penerimaan tidak valid.");
}

export async function tutupExceptionPengadaan(
  supabase: SupabaseClient,
  input: TutupExceptionInput,
): Promise<Result<{ exceptionId: string }>> {
  if (!isUuid(input.actorId) || !isUuid(input.exceptionId)) {
    return fail("Data penutupan exception tidak valid.");
  }
  if (input.alasan.trim().length === 0) {
    return fail("Alasan penutupan wajib diisi");
  }

  const { error } = await supabase.rpc("tutup_exception_selisih", {
    p_exception_id: input.exceptionId,
    p_alasan: input.alasan.trim(),
    p_aktor_id: input.actorId,
  });

  if (error) return fail(pesanKesalahan(error, "Gagal menutup exception."));
  return ok({ exceptionId: input.exceptionId });
}

export async function catatLokasiPemisahan(
  supabase: SupabaseClient,
  input: LokasiPemisahanInput,
): Promise<Result<{ penerimaanItemId: string }>> {
  if (!isUuid(input.actorId) || !isUuid(input.penerimaanItemId)) {
    return fail("Data lokasi pemisahan tidak valid.");
  }
  if (input.lokasi.trim().length === 0) {
    return fail("Lokasi pemisahan wajib diisi");
  }

  const { error } = await supabase.rpc("catat_lokasi_pemisahan", {
    p_penerimaan_item_id: input.penerimaanItemId,
    p_lokasi: input.lokasi.trim(),
    p_aktor_id: input.actorId,
  });

  if (error) return fail(pesanKesalahan(error, "Gagal menyimpan lokasi pemisahan."));
  return ok({ penerimaanItemId: input.penerimaanItemId });
}

export async function ajukanReturPemasok(
  supabase: SupabaseClient,
  input: AjukanReturInput,
): Promise<Result<HasilDokumenPengadaan>> {
  if (
    !isUuid(input.actorId) ||
    !isUuid(input.penerimaanId) ||
    input.baris.length === 0 ||
    input.baris.some(
      (row) => !isUuid(row.penerimaanItemId) || !/^\d+(\.\d{1,4})?$/.test(row.qty),
    )
  ) {
    return fail("Data retur pemasok tidak valid.");
  }

  const { data, error } = await supabase.rpc("ajukan_retur_pemasok", {
    p_dokumen_id: input.penerimaanId,
    p_baris: input.baris.map((row) => ({
      penerimaan_item_id: row.penerimaanItemId,
      qty: row.qty,
    })),
    p_alasan: input.alasan ?? null,
    p_aktor_id: input.actorId,
  });

  if (error) return fail(pesanKesalahan(error, "Gagal mengajukan retur pemasok."));
  const hasil = parseDokumen(data);
  return hasil ? ok(hasil) : fail("Respons retur pemasok tidak valid.");
}

export async function putuskanReturPemasok(
  supabase: SupabaseClient,
  input: PutuskanReturInput,
): Promise<Result<HasilDokumenPengadaan>> {
  if (!isUuid(input.actorId) || !isUuid(input.dokumenId) || validasiVersi(input.versi)) {
    return fail("Data keputusan retur tidak valid.");
  }
  if (!input.setuju && (input.alasan ?? "").trim().length === 0) {
    return fail("Alasan penolakan wajib diisi");
  }

  const { data, error } = await supabase.rpc("putuskan_retur_pemasok", {
    p_dokumen_id: input.dokumenId,
    p_versi: input.versi,
    p_setuju: input.setuju,
    p_alasan: input.alasan?.trim() ?? null,
    p_aktor_id: input.actorId,
  });

  if (error) return fail(pesanKesalahan(error, "Gagal memutuskan retur pemasok."));
  const hasil = parseDokumen(data);
  return hasil ? ok(hasil) : fail("Respons keputusan retur tidak valid.");
}

export async function batalkanReturPemasok(
  supabase: SupabaseClient,
  input: BatalkanReturInput,
): Promise<Result<HasilDokumenPengadaan>> {
  if (!isUuid(input.actorId) || !isUuid(input.dokumenId) || validasiVersi(input.versi)) {
    return fail("Data pembatalan retur tidak valid.");
  }
  if (input.alasan.trim().length === 0) {
    return fail("Alasan pembatalan wajib diisi");
  }

  const { data, error } = await supabase.rpc("batalkan_retur_pemasok", {
    p_dokumen_id: input.dokumenId,
    p_versi: input.versi,
    p_alasan: input.alasan.trim(),
    p_aktor_id: input.actorId,
  });

  if (error) return fail(pesanKesalahan(error, "Gagal membatalkan retur pemasok."));
  const hasil = parseDokumen(data);
  return hasil ? ok(hasil) : fail("Respons pembatalan retur tidak valid.");
}

export async function catatInvoicePemasok(
  supabase: SupabaseClient,
  input: CatatInvoiceInput,
): Promise<Result<HasilDokumenPengadaan & { statusInvoice: string }>> {
  if (
    !isUuid(input.actorId) ||
    !isUuid(input.penerimaanId) ||
    input.nomorInvoice.trim().length === 0 ||
    !isIsoDate(input.tanggal) ||
    !Number.isInteger(input.terminHari) ||
    input.terminHari < 0 ||
    !/^\d+(\.\d{1,2})?$/.test(input.ppnNilai) ||
    input.baris.length === 0 ||
    input.baris.some(
      (row) =>
        !isUuid(row.penerimaanItemId) ||
        !/^\d+(\.\d{1,4})?$/.test(row.qty) ||
        !/^\d+(\.\d{1,4})?$/.test(row.hargaSatuanDpp),
    )
  ) {
    return fail("Data invoice pemasok tidak valid.");
  }

  const { data, error } = await supabase.rpc("catat_invoice_pemasok", {
    p_penerimaan_id: input.penerimaanId,
    p_nomor_invoice: input.nomorInvoice.trim(),
    p_tanggal: input.tanggal,
    p_termin_hari: input.terminHari,
    p_nomor_faktur_pajak: input.nomorFakturPajak?.trim() ?? null,
    p_ppn_nilai: input.ppnNilai,
    p_baris: input.baris.map((row) => ({
      penerimaan_item_id: row.penerimaanItemId,
      qty: row.qty,
      harga_satuan_dpp: row.hargaSatuanDpp,
    })),
    p_aktor_id: input.actorId,
  });

  if (error) return fail(pesanKesalahan(error, "Gagal mencatat invoice pemasok."));
  const hasil = parseDokumen(data);
  if (!hasil || !isRecord(data) || typeof data.status !== "string") {
    return fail("Respons invoice pemasok tidak valid.");
  }
  return ok({ ...hasil, statusInvoice: data.status });
}

export async function cocokkanUlangInvoice(
  supabase: SupabaseClient,
  input: CocokkanUlangInvoiceInput,
): Promise<Result<{ statusInvoice: string }>> {
  if (
    !isUuid(input.actorId) ||
    !isUuid(input.dokumenId) ||
    validasiVersi(input.versi) ||
    !/^\d+(\.\d{1,2})?$/.test(input.ppnNilai) ||
    input.baris.length === 0
  ) {
    return fail("Data koreksi invoice tidak valid.");
  }

  const { data, error } = await supabase.rpc("cocokkan_ulang_invoice", {
    p_dokumen_id: input.dokumenId,
    p_versi: input.versi,
    p_ppn_nilai: input.ppnNilai,
    p_baris: input.baris.map((row) => ({
      penerimaan_item_id: row.penerimaanItemId,
      qty: row.qty,
      harga_satuan_dpp: row.hargaSatuanDpp,
    })),
    p_aktor_id: input.actorId,
  });

  if (error) return fail(pesanKesalahan(error, "Gagal mencocokkan ulang invoice."));
  if (!isRecord(data) || typeof data.status !== "string") {
    return fail("Respons koreksi invoice tidak valid.");
  }
  return ok({ statusInvoice: data.status });
}

export async function sahkanInvoicePemasok(
  supabase: SupabaseClient,
  input: SahkanInvoiceInput,
): Promise<Result<HasilDokumenPengadaan>> {
  if (!isUuid(input.actorId) || !isUuid(input.dokumenId) || validasiVersi(input.versi)) {
    return fail("Data pengesahan invoice tidak valid.");
  }

  const { data, error } = await supabase.rpc("sahkan_invoice_pemasok", {
    p_dokumen_id: input.dokumenId,
    p_versi: input.versi,
    p_aktor_id: input.actorId,
  });

  if (error) return fail(pesanKesalahan(error, "Gagal mengesahkan invoice pemasok."));
  const hasil = parseDokumen(data);
  return hasil ? ok(hasil) : fail("Respons pengesahan invoice tidak valid.");
}

export async function batalkanInvoicePemasok(
  supabase: SupabaseClient,
  input: BatalkanInvoiceInput,
): Promise<Result<HasilDokumenPengadaan>> {
  if (!isUuid(input.actorId) || !isUuid(input.dokumenId) || validasiVersi(input.versi)) {
    return fail("Data pembatalan invoice tidak valid.");
  }
  if (input.alasan.trim().length === 0) {
    return fail("Alasan pembatalan wajib diisi");
  }

  const { data, error } = await supabase.rpc("batalkan_invoice_pemasok", {
    p_dokumen_id: input.dokumenId,
    p_versi: input.versi,
    p_alasan: input.alasan.trim(),
    p_aktor_id: input.actorId,
  });

  if (error) return fail(pesanKesalahan(error, "Gagal membatalkan invoice pemasok."));
  const hasil = parseDokumen(data);
  return hasil ? ok(hasil) : fail("Respons pembatalan invoice tidak valid.");
}
