import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { StatusDokumen } from "@/core/dokumen";
import { fail, ok, type Result } from "@/lib/result";
import { isRecord } from "@/lib/validation";

import type {
  BiayaProduksiEvent,
  BomVersi,
  HasilProduksi,
  JenisBiayaProduksi,
  KartuJamKerja,
  KeputusanQc,
  OverheadAktual,
  PemakaianBahan,
  PengeluaranBahan,
  PerintahProduksi,
  ProdukKomponen,
  QualityCheck,
  StatusSpk,
  StatusVersiBom,
  TarifOverhead,
} from "./types";

const BARIS_TIDAK_VALID = "Data produksi tidak valid.";
const teks = () => z.preprocess((value) => (value === null ? "" : String(value ?? "")), z.string());
const teksNullable = () =>
  z.preprocess((value) => (value === null ? null : String(value ?? "")), z.string().nullable());
const angka = () => z.preprocess((value) => Number(value ?? 0), z.number());
const baris = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => (isRecord(value) ? value : {}), schema);

const bomVersiSchema = baris(z.object({
  id: teks(), bom_id: teks(), produk_id: teks(), versi: angka(), berlaku_dari: teks(),
  toleransi_scrap: teks(), toleransi_reject: teks(), created_by: teksNullable(), created_at: teks(),
}));
const komponenSchema = baris(z.object({
  id: teks(), versi_id: teks(), komponen_produk_id: teks(), satuan_id: teks(),
  qty_per_unit: teks(), urutan: angka(),
}));
const spkSchema = baris(z.object({
  dokumen_id: teks(), produk_id: teks(), bom_versi_id: teks(), gudang_id: teks(),
  tanggal_perintah: teks(), tgl_target_selesai: teks(), target_qty: teks(),
  keterangan: teksNullable(), created_by: teksNullable(), created_at: teks(),
}));
const dokumenRingkasSchema = baris(z.object({
  id: teks(), nomor: teks(), status: teks(), versi: angka(),
}));
const riwayatSchema = baris(z.object({
  id: teks(), dokumen_id: teks(), tipe_dokumen: teks(), aksi: teks(),
  status_asal: teksNullable(), status_tujuan: teks(), level: z.preprocess(
    (value) => (value === null ? null : Number(value)), z.number().nullable()),
  alasan: teksNullable(), siklus_approval: angka(), actor_id: teks(), created_at: teks(),
}));
const pengeluaranSchema = baris(z.object({
  id: teks(), wo_id: teks(), produk_id: teks(), satuan_id: teks(), gudang_id: teks(),
  mutasi_stok_id: teks(), qty_keluar: teks(), harga_satuan: teks(), nilai_keluar: teks(), tanggal: teks(),
}));
const pemakaianSchema = baris(z.object({
  id: teks(), pengeluaran_id: teks(), wo_id: teks(), qty_terpakai: teks(), qty_sisa: teks(),
  qty_scrap: teks(), mutasi_stok_sisa_id: teksNullable(),
}));
const hasilSchema = baris(z.object({
  id: teks(), wo_id: teks(), percobaan: angka(), qty_diproses: teks(), tanggal: teks(),
  keterangan: teksNullable(), created_by: teksNullable(),
}));
const qcSchema = baris(z.object({
  id: teks(), hasil_produksi_id: teks(), wo_id: teks(), qty_lulus: teks(), qty_rework: teks(),
  qty_reject: teks(), keputusan: teks(), catatan: teksNullable(), created_by: teksNullable(), created_at: teks(),
}));
const kjkSchema = baris(z.object({
  id: teks(), wo_id: teks(), karyawan_id: teks(), tanggal: teks(), jam_kerja: teks(),
  tarif_per_jam: teks(), keterangan: teksNullable(), created_by: teksNullable(),
}));
const tarifSchema = baris(z.object({
  id: teks(), berlaku_dari: teks(), tarif: teks(), kapasitas_normal: teks(), keterangan: teksNullable(),
}));
const aktualSchema = baris(z.object({
  id: teks(), periode: teks(), akun_id: teks(), nilai: teks(), keterangan: teksNullable(),
}));
const eventSchema = baris(z.object({
  id: teks(), wo_id: teks(), jenis: teks(), sumber_tipe: teks(), sumber_id: teks(), jurnal_id: teks(),
  nominal: teks(), tanggal: teks(), keterangan: teksNullable(), created_at: teks(),
}));

function parseSemua<S extends z.ZodTypeAny>(schema: S, data: unknown): Result<z.output<S>[]> {
  const hasil = z.array(schema).safeParse(Array.isArray(data) ? data : []);
  return hasil.success ? ok(hasil.data) : fail(BARIS_TIDAK_VALID);
}

export interface BomVersiView extends BomVersi {
  status: StatusVersiBom;
  komponen: ProdukKomponen[];
}
export interface SpkView extends PerintahProduksi {
  nomor: string;
  status: StatusDokumen;
  versi: number;
}
export interface SpkDetail extends SpkView {
  bomVersi: BomVersi | null;
}
export interface PengeluaranView extends PengeluaranBahan {
  pemakaian: PemakaianBahan | null;
}
export interface HasilQcView extends HasilProduksi {
  qc: (QualityCheck & { keputusan: KeputusanQc }) | null;
}
export interface HppView {
  woId: string;
  nomor: string;
  status: StatusDokumen;
  qtyLulus: string;
  total: string;
  hppPerUnit: string;
  komponen: Record<string, string>;
  event: BiayaProduksiEvent[];
}

async function ambilDokumenRingkas(
  client: SupabaseClient,
  ids: readonly string[],
): Promise<Map<string, z.infer<typeof dokumenRingkasSchema>>> {
  if (ids.length === 0) return new Map();
  const { data } = await client.from("dokumen").select("id,nomor,status,versi").in("id", [...ids]);
  const hasil = parseSemua(dokumenRingkasSchema, data);
  return new Map((hasil.ok ? hasil.data : []).map((row) => [row.id, row]));
}

export async function getBomVersiBerlaku(
  client: SupabaseClient,
  produkId: string,
  tanggal: string,
): Promise<Result<BomVersi | null>> {
  const { data, error } = await client.from("bom_versi").select("*")
    .eq("produk_id", produkId).lte("berlaku_dari", tanggal)
    .order("berlaku_dari", { ascending: false }).limit(1).maybeSingle();
  if (error) return fail(error.message);
  if (data === null) return ok(null);
  const hasil = bomVersiSchema.safeParse(data);
  return hasil.success ? ok(hasil.data as BomVersi) : fail(BARIS_TIDAK_VALID);
}

export async function getBomVersi(
  client: SupabaseClient,
  versiId: string,
): Promise<Result<BomVersiView | null>> {
  const { data, error } = await client.from("bom_versi").select("*").eq("id", versiId).maybeSingle();
  if (error) return fail(error.message);
  if (data === null) return ok(null);
  const versi = bomVersiSchema.safeParse(data);
  if (!versi.success) return fail(BARIS_TIDAK_VALID);

  const { data: komponenData, error: komponenError } = await client.from("produk_komponen")
    .select("*").eq("versi_id", versiId).order("urutan", { ascending: true });
  if (komponenError) return fail(komponenError.message);
  const komponen = parseSemua(komponenSchema, komponenData);
  if (!komponen.ok) return komponen;

  const { data: berikutnya } = await client.from("bom_versi").select("berlaku_dari")
    .eq("produk_id", versi.data.produk_id).gt("berlaku_dari", versi.data.berlaku_dari)
    .order("berlaku_dari", { ascending: true }).limit(1).maybeSingle();
  const adaBerikutnya = berikutnya !== null;
  const hariIni = new Date().toISOString().slice(0, 10);
  const status: StatusVersiBom = versi.data.berlaku_dari > hariIni
    ? "TERJADWAL"
    : adaBerikutnya ? "DIGANTIKAN" : "BERLAKU";

  return ok({ ...(versi.data as BomVersi), status, komponen: komponen.data as ProdukKomponen[] });
}

export async function listBomVersi(
  client: SupabaseClient,
  produkId?: string,
): Promise<Result<BomVersiView[]>> {
  let query = client.from("bom_versi").select("*").order("berlaku_dari", { ascending: false });
  if (produkId) query = query.eq("produk_id", produkId);
  const { data, error } = await query;
  if (error) return fail(error.message);
  const daftar = parseSemua(bomVersiSchema, data);
  if (!daftar.ok) return daftar;

  const hasil: BomVersiView[] = [];
  for (const versi of daftar.data as BomVersi[]) {
    const detail = await getBomVersi(client, versi.id);
    if (!detail.ok) return detail;
    if (detail.data) hasil.push(detail.data);
  }
  return ok(hasil);
}

export async function listPerintahProduksi(
  client: SupabaseClient,
  options: { produkId?: string; gudangId?: string; statuses?: readonly StatusSpk[] } = {},
): Promise<Result<SpkView[]>> {
  let query = client.from("perintah_produksi").select("*");
  if (options.produkId) query = query.eq("produk_id", options.produkId);
  if (options.gudangId) query = query.eq("gudang_id", options.gudangId);
  const { data, error } = await query.order("tanggal_perintah", { ascending: false });
  if (error) return fail(error.message);
  const daftar = parseSemua(spkSchema, data);
  if (!daftar.ok) return daftar;

  const dokumen = await ambilDokumenRingkas(client, daftar.data.map((row) => row.dokumen_id));
  const hasil: SpkView[] = [];
  for (const row of daftar.data as PerintahProduksi[]) {
    const induk = dokumen.get(row.dokumen_id);
    if (!induk || (options.statuses && !options.statuses.includes(induk.status as StatusSpk))) continue;
    hasil.push({ ...row, nomor: induk.nomor, status: induk.status as StatusDokumen, versi: induk.versi });
  }
  return ok(hasil);
}

export async function getPerintahProduksi(
  client: SupabaseClient,
  woId: string,
): Promise<Result<SpkDetail | null>> {
  const { data, error } = await client.from("perintah_produksi").select("*")
    .eq("dokumen_id", woId).maybeSingle();
  if (error) return fail(error.message);
  if (data === null) return ok(null);
  const row = spkSchema.safeParse(data);
  if (!row.success) return fail(BARIS_TIDAK_VALID);
  const dokumen = await ambilDokumenRingkas(client, [woId]);
  const induk = dokumen.get(woId);
  if (!induk) return fail(BARIS_TIDAK_VALID);

  const { data: versiData } = await client.from("bom_versi").select("*")
    .eq("id", row.data.bom_versi_id).maybeSingle();
  const versi = versiData ? bomVersiSchema.safeParse(versiData) : null;
  if (versi && !versi.success) return fail(BARIS_TIDAK_VALID);

  return ok({
    ...(row.data as PerintahProduksi),
    nomor: induk.nomor,
    status: induk.status as StatusDokumen,
    versi: induk.versi,
    bomVersi: versi?.success ? (versi.data as BomVersi) : null,
  });
}

export async function listRiwayatSpk(
  client: SupabaseClient,
  woId: string,
): Promise<Result<z.infer<typeof riwayatSchema>[]>> {
  const { data, error } = await client.from("riwayat_status").select("*")
    .eq("dokumen_id", woId).order("created_at", { ascending: true });
  if (error) return fail(error.message);
  return parseSemua(riwayatSchema, data);
}

export async function listPengeluaranBahan(
  client: SupabaseClient,
  woId: string,
): Promise<Result<PengeluaranView[]>> {
  const { data, error } = await client.from("pengeluaran_bahan").select("*")
    .eq("wo_id", woId).order("tanggal", { ascending: false });
  if (error) return fail(error.message);
  const keluar = parseSemua(pengeluaranSchema, data);
  if (!keluar.ok) return keluar;
  const { data: pakaiData, error: pakaiError } = await client.from("pemakaian_bahan").select("*")
    .eq("wo_id", woId);
  if (pakaiError) return fail(pakaiError.message);
  const pakai = parseSemua(pemakaianSchema, pakaiData);
  if (!pakai.ok) return pakai;
  const peta = new Map(pakai.data.map((row) => [row.pengeluaran_id, row as PemakaianBahan]));
  return ok((keluar.data as PengeluaranBahan[]).map((row) => ({
    ...row, pemakaian: peta.get(row.id) ?? null,
  })));
}

export async function listHasilProduksi(
  client: SupabaseClient,
  woId: string,
): Promise<Result<HasilQcView[]>> {
  const { data, error } = await client.from("hasil_produksi").select("*")
    .eq("wo_id", woId).order("percobaan", { ascending: true });
  if (error) return fail(error.message);
  const hasil = parseSemua(hasilSchema, data);
  if (!hasil.ok) return hasil;
  const { data: qcData, error: qcError } = await client.from("quality_check").select("*")
    .eq("wo_id", woId);
  if (qcError) return fail(qcError.message);
  const qc = parseSemua(qcSchema, qcData);
  if (!qc.ok) return qc;
  const peta = new Map(qc.data.map((row) => [row.hasil_produksi_id, row]));
  return ok((hasil.data as HasilProduksi[]).map((row) => {
    const putusan = peta.get(row.id);
    return {
      ...row,
      qc: putusan ? { ...putusan, keputusan: putusan.keputusan as KeputusanQc } : null,
    };
  }));
}

export async function listKartuJamKerja(
  client: SupabaseClient,
  woId: string,
): Promise<Result<KartuJamKerja[]>> {
  const { data, error } = await client.from("kartu_jam_kerja").select("*")
    .eq("wo_id", woId).order("tanggal", { ascending: false });
  if (error) return fail(error.message);
  const hasil = parseSemua(kjkSchema, data);
  return hasil.ok ? ok(hasil.data as KartuJamKerja[]) : hasil;
}

export async function listBiayaEvent(
  client: SupabaseClient,
  woId: string,
): Promise<Result<BiayaProduksiEvent[]>> {
  const { data, error } = await client.from("biaya_produksi_event").select("*")
    .eq("wo_id", woId).order("tanggal", { ascending: false });
  if (error) return fail(error.message);
  const hasil = parseSemua(eventSchema, data);
  return hasil.ok ? ok(hasil.data as BiayaProduksiEvent[]) : hasil;
}

export async function getHppProduksi(
  client: SupabaseClient,
  woId: string,
): Promise<Result<HppView | null>> {
  const [spk, event, hasil] = await Promise.all([
    getPerintahProduksi(client, woId),
    listBiayaEvent(client, woId),
    listHasilProduksi(client, woId),
  ]);
  if (!spk.ok) return spk;
  if (!spk.data) return ok(null);
  if (!event.ok) return event;
  if (!hasil.ok) return hasil;

  const qtyLulus = hasil.data.reduce((total, item) =>
    total + (item.qc ? Number(item.qc.qty_lulus) : 0), 0);
  const komponen: Record<string, string> = {};
  let total = 0;
  for (const jenis of ["BAHAN", "TKL", "OVERHEAD", "REWORK", "KERUGIAN", "PENYESUAIAN_HPP"] as JenisBiayaProduksi[]) {
    const jumlah = event.data.filter((item) => item.jenis === jenis).reduce((sum, item) => {
      const mengurangi = item.jenis === "KERUGIAN"
        || (item.jenis === "PENYESUAIAN_HPP" && item.sumber_tipe === "PEMAKAIAN_BAHAN");
      return sum + (mengurangi ? -Number(item.nominal) : Number(item.nominal));
    }, 0);
    komponen[jenis] = jumlah.toFixed(2);
    total += jumlah;
  }
  return ok({
    woId,
    nomor: spk.data.nomor,
    status: spk.data.status,
    qtyLulus: qtyLulus.toFixed(4),
    total: total.toFixed(2),
    hppPerUnit: qtyLulus > 0 ? (total / qtyLulus).toFixed(2) : "0.00",
    komponen,
    event: event.data,
  });
}

export async function listTarifOverhead(
  client: SupabaseClient,
): Promise<Result<TarifOverhead[]>> {
  const { data, error } = await client.from("tarif_overhead").select("*")
    .order("berlaku_dari", { ascending: false });
  if (error) return fail(error.message);
  const hasil = parseSemua(tarifSchema, data);
  return hasil.ok ? ok(hasil.data as TarifOverhead[]) : hasil;
}

export async function listOverheadAktual(
  client: SupabaseClient,
  periode?: string,
): Promise<Result<OverheadAktual[]>> {
  let query = client.from("overhead_aktual").select("*").order("periode", { ascending: false });
  if (periode) query = query.eq("periode", periode);
  const { data, error } = await query;
  if (error) return fail(error.message);
  const hasil = parseSemua(aktualSchema, data);
  return hasil.ok ? ok(hasil.data as OverheadAktual[]) : hasil;
}
