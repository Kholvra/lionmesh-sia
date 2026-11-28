import { z } from "zod";

import type { Dokumen, StatusDokumen } from "@/core/dokumen";

/** Production statuses are owned by the WO document registry (0021). */
export const DAFTAR_STATUS_SPK = [
  "DIRENCANAKAN", "CEK_BAHAN", "BAHAN_CUKUP", "BAHAN_KURANG", "MENUNGGU_PEMBELIAN",
  "BAHAN_SIAP", "BERJALAN", "HASIL_DICATAT", "QC_PASSED", "REWORK", "REJECTED",
  "SELESAI", "DIBATALKAN",
] as const;
export const DAFTAR_AKSI_SPK = [
  "CEK_BAHAN", "AJUKAN_PEMBELIAN", "TERIMA_BAHAN", "MULAI", "CATAT_HASIL", "QC",
  "SELESAI", "BATAL",
] as const;
export const STATUS_SPK_AKHIR: readonly StatusSpk[] = ["SELESAI", "REJECTED", "DIBATALKAN"];

/** Transitions registered in 0021; the RPC enforces the same table. */
export const TRANSISI_SPK: Readonly<Record<string, readonly StatusSpk[]>> = {
  DIRENCANAKAN: ["CEK_BAHAN", "DIBATALKAN"],
  CEK_BAHAN: ["BAHAN_CUKUP", "BAHAN_KURANG", "DIBATALKAN"],
  BAHAN_KURANG: ["MENUNGGU_PEMBELIAN", "DIBATALKAN"],
  MENUNGGU_PEMBELIAN: ["BAHAN_SIAP"], BAHAN_SIAP: ["BERJALAN"],
  BAHAN_CUKUP: ["BERJALAN", "DIBATALKAN"], BERJALAN: ["HASIL_DICATAT"],
  HASIL_DICATAT: ["QC_PASSED", "REWORK", "REJECTED"], REWORK: ["HASIL_DICATAT"],
  QC_PASSED: ["SELESAI"],
};

export type StatusSpk = (typeof DAFTAR_STATUS_SPK)[number];
export type AksiSpk = (typeof DAFTAR_AKSI_SPK)[number];
export type StatusVersiBom = "TERJADWAL" | "BERLAKU" | "DIGANTIKAN";
export type KeputusanQc = "QC_PASSED" | "REWORK" | "REJECTED";
export type JenisBiayaProduksi =
  | "BAHAN" | "TKL" | "OVERHEAD" | "REWORK" | "KERUGIAN" | "PENYESUAIAN_HPP";

export const POLA_QTY = /^(0|[1-9]\d{0,13})(?:\.\d{1,4})?$/;
export const POLA_RUPIAH = /^(0|[1-9]\d{0,15})(?:\.0{1,2})?$/;
const POLA_TANGGAL = /^\d{4}-\d{2}-\d{2}$/;
const POLA_WAKTU = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

const uuid = () => z.string().uuid("ID tidak valid.");
const tanggal = () => z.string().regex(POLA_TANGGAL, "Tanggal harus berformat YYYY-MM-DD.");
const waktu = () => z.string().regex(POLA_WAKTU, "Waktu harus berformat ISO 8601.");
const qty = (pesan = "Qty harus angka positif dengan maksimal 4 angka desimal.") =>
  z.string().regex(POLA_QTY, pesan).refine((nilai) => Number(nilai) > 0, pesan);
const qtyNol = (pesan = "Qty tidak boleh negatif dan maksimal 4 angka desimal.") =>
  z.string().regex(POLA_QTY, pesan);
const rupiah = () => z.string().regex(POLA_RUPIAH, "Nilai harus rupiah bulat, tanpa sen.");
const toleransi = () => z.string().regex(POLA_QTY, "Toleransi tidak valid.")
  .refine((nilai) => Number(nilai) < 100, "Toleransi harus kurang dari 100.");
const kunci = () => z.string().trim().min(1).max(200).optional();
const teksPanjang = () => z.string().trim().max(2000).optional();
const komponen = z.object({
  komponenProdukId: uuid(), satuanId: uuid(), qtyPerUnit: qty("Qty komponen harus lebih dari 0 dan maksimal 4 angka desimal."),
  urutan: z.number().int().min(1, "Urutan komponen harus lebih dari 0."),
});
const barisPermintaan = z.object({ produkId: uuid(), satuanId: uuid(), qty: qty() });

export const simpanVersiBomSchema = z.object({
  produkId: uuid(), berlakuDari: tanggal(), toleransiScrap: toleransi(), toleransiReject: toleransi(),
  komponen: z.array(komponen).min(1, "BOM harus memuat minimal satu komponen."), kunci: kunci(),
}).strict();

export const buatSpkSchema = z.object({
  produkId: uuid(), bomVersiId: uuid(), gudangId: uuid(), tanggalPerintah: tanggal(),
  tglTargetSelesai: tanggal(), targetQty: qty("Target qty harus lebih dari 0."),
  keterangan: teksPanjang(), kunci: kunci(),
}).strict().refine((data) => data.tglTargetSelesai >= data.tanggalPerintah, {
  message: "Tanggal target selesai tidak boleh mendahului tanggal perintah.",
});

export const pindahStatusSpkSchema = z.object({
  woId: uuid(), versi: z.number().int().min(0, "Versi dokumen tidak valid."),
  statusTujuan: z.enum(DAFTAR_STATUS_SPK), aksi: z.enum(DAFTAR_AKSI_SPK),
  alasan: z.string().trim().min(1).max(2000).optional(), kunci: kunci(),
}).strict();

export const ajukanPermintaanBahanSchema = z.object({
  woId: uuid(), gudangId: uuid(), tanggalButuh: tanggal(),
  baris: z.array(barisPermintaan).min(1, "Permintaan harus memuat minimal satu barang."),
  keterangan: teksPanjang(), kunci: kunci(),
}).strict();

export const keluarkanBahanSchema = z.object({
  woId: uuid(), produkId: uuid(), satuanId: uuid(), gudangId: uuid(), qty: qty(),
  tanggal: waktu(), keterangan: teksPanjang(), kunci: kunci(),
}).strict();

export const kembalikanBahanSchema = z.object({
  woId: uuid(), pengeluaranId: uuid(), qty: qty(), tanggal: waktu(),
  keterangan: teksPanjang(), kunci: kunci(),
}).strict();

export const konfirmasiPemakaianSchema = z.object({
  woId: uuid(), pengeluaranId: uuid(), qtyScrap: qtyNol(),
  keterangan: teksPanjang(), kunci: kunci(),
}).strict();

export const catatHasilSchema = z.object({
  woId: uuid(), percobaan: z.number().int().min(1, "Percobaan harus lebih dari 0."),
  qtyDiproses: qty("Jumlah diproses harus lebih dari 0."), tanggal: waktu().optional(),
  keterangan: teksPanjang(), kunci: kunci(),
}).strict();

export const catatQcSchema = z.object({
  hasilId: uuid(), woId: uuid(), qtyLulus: qtyNol(), qtyRework: qtyNol(), qtyReject: qtyNol(),
  catatan: teksPanjang(), kunci: kunci(),
}).strict();

export const terimaBarangJadiSchema = z.object({
  woId: uuid(), gudangId: uuid(), qty: qty(), tanggal: waktu(),
  kunciQc: z.string().trim().min(1, "Kunci keputusan QC wajib diisi."),
  keterangan: teksPanjang(), kunci: kunci(),
}).strict();

export const catatKjkSchema = z.object({
  woId: uuid(), karyawanId: uuid(), tanggal: tanggal(), jamKerja: qty("Jam kerja harus lebih dari 0."),
  tarifPerJam: qtyNol("Tarif per jam tidak boleh negatif."), keterangan: teksPanjang(), kunci: kunci(),
}).strict();

export const tetapkanTarifOverheadSchema = z.object({
  berlakuDari: tanggal(), tarif: qtyNol("Tarif overhead tidak boleh negatif."),
  kapasitasNormal: qty("Kapasitas normal harus lebih dari 0."), keterangan: teksPanjang(), kunci: kunci(),
}).strict();

export const catatOverheadAktualSchema = z.object({
  periode: tanggal().refine((nilai) => nilai.endsWith("-01"), "Periode harus tanggal 1 tiap bulan."),
  akunId: uuid(), nilai: rupiah(), keterangan: teksPanjang(), kunci: kunci(),
}).strict();

export const bebankanTklSchema = z.object({
  woId: uuid(), kartuIds: z.array(uuid()).min(1, "Pilih minimal satu kartu jam kerja."),
  tanggal: waktu(), kunci: kunci(),
}).strict();

export const bebankanOverheadSchema = z.object({
  woId: uuid(), dlh: qty("DLH harus lebih dari 0."), tanggal: waktu(), kunci: kunci(),
}).strict();

export const hitungHppFinalSchema = z.object({ woId: uuid(), kunci: kunci() }).strict();

export type SimpanVersiBomInput = z.infer<typeof simpanVersiBomSchema>;
export type BuatSpkInput = z.infer<typeof buatSpkSchema>;
export type PindahStatusSpkInput = z.infer<typeof pindahStatusSpkSchema>;
export type AjukanPermintaanBahanInput = z.infer<typeof ajukanPermintaanBahanSchema>;
export type KeluarkanBahanInput = z.infer<typeof keluarkanBahanSchema>;
export type KembalikanBahanInput = z.infer<typeof kembalikanBahanSchema>;
export type KonfirmasiPemakaianInput = z.infer<typeof konfirmasiPemakaianSchema>;
export type CatatHasilInput = z.infer<typeof catatHasilSchema>;
export type CatatQcInput = z.infer<typeof catatQcSchema>;
export type TerimaBarangJadiInput = z.infer<typeof terimaBarangJadiSchema>;
export type CatatKjkInput = z.infer<typeof catatKjkSchema>;
export type TetapkanTarifOverheadInput = z.infer<typeof tetapkanTarifOverheadSchema>;
export type CatatOverheadAktualInput = z.infer<typeof catatOverheadAktualSchema>;
export type BebankanTklInput = z.infer<typeof bebankanTklSchema>;
export type BebankanOverheadInput = z.infer<typeof bebankanOverheadSchema>;
export type HitungHppFinalInput = z.infer<typeof hitungHppFinalSchema>;

export interface BomVersi {
  id: string; bom_id: string; produk_id: string; versi: number; berlaku_dari: string;
  toleransi_scrap: string; toleransi_reject: string; created_by: string | null; created_at: string;
}
export interface ProdukKomponen {
  id: string; versi_id: string; komponen_produk_id: string; satuan_id: string;
  qty_per_unit: string; urutan: number;
}
export interface PerintahProduksi {
  dokumen_id: string; produk_id: string; bom_versi_id: string; gudang_id: string;
  tanggal_perintah: string; tgl_target_selesai: string; target_qty: string;
  keterangan: string | null; created_by: string | null; created_at: string;
}
export interface HasilProduksi {
  id: string; wo_id: string; percobaan: number; qty_diproses: string; tanggal: string;
  keterangan: string | null; created_by: string | null;
}
export interface QualityCheck {
  id: string; hasil_produksi_id: string; wo_id: string; qty_lulus: string; qty_rework: string;
  qty_reject: string; keputusan: KeputusanQc; catatan: string | null;
  created_by: string | null; created_at: string;
}
export interface PengeluaranBahan {
  id: string; wo_id: string; produk_id: string; satuan_id: string; gudang_id: string;
  mutasi_stok_id: string; qty_keluar: string; harga_satuan: string; nilai_keluar: string; tanggal: string;
}
export interface PemakaianBahan {
  id: string; pengeluaran_id: string; wo_id: string; qty_terpakai: string; qty_sisa: string;
  qty_scrap: string; mutasi_stok_sisa_id: string | null;
}
export interface KartuJamKerja {
  id: string; wo_id: string; karyawan_id: string; tanggal: string; jam_kerja: string;
  tarif_per_jam: string; keterangan: string | null; created_by: string | null;
}
export interface TarifOverhead {
  id: string; berlaku_dari: string; tarif: string; kapasitas_normal: string; keterangan: string | null;
}
export interface OverheadAktual {
  id: string; periode: string; akun_id: string; nilai: string; keterangan: string | null;
}
export interface BiayaProduksiEvent {
  id: string; wo_id: string; jenis: JenisBiayaProduksi; sumber_tipe: string; sumber_id: string;
  jurnal_id: string; nominal: string; tanggal: string; keterangan: string | null; created_at: string;
}

export interface HasilDokumenProduksi { dokumen: Dokumen; riwayatId: string }
export type HasilDokumenOpsional = Partial<HasilDokumenProduksi>;
export interface HasilSimpanVersiBom {
  bomId: string; versiId: string; versi: number; berlakuDari: string; jumlahKomponen: number;
}
export interface HasilBuatSpk extends HasilDokumenProduksi { woId: string }
export type HasilPindahStatusSpk = HasilDokumenProduksi;
export interface HasilAjukanPermintaanBahan {
  permintaanId: string; woId: string; nomor: string; status: string;
}
export interface HasilKeluarkanBahan extends HasilDokumenOpsional {
  pengeluaranId: string; mutasiId: string; nilaiKeluar: string; hargaSatuan: string; jurnalId: string;
}
export interface HasilKembalikanBahan {
  pemakaianId: string; mutasiId: string; nilaiKembali: string; jurnalId: string;
}
export interface HasilKonfirmasiPemakaian {
  pemakaianId: string; qtyTerpakai: string; qtySisa: string; qtyScrap: string;
}
export interface HasilCatatHasil extends HasilDokumenOpsional { hasilId: string; percobaan: number }
export interface HasilCatatQc extends HasilDokumenOpsional {
  qcId: string; keputusan: KeputusanQc; nilaiPerUnitBaik: string; kerugianAbnormal: string;
  jurnalId: string | null;
}
export interface HasilTerimaBarangJadi extends HasilDokumenOpsional {
  mutasiId: string; nilai: string; jurnalId: string;
}
export interface HasilCatatKjk { kartuId: string }
export interface HasilTarifOverhead { tarifId: string }
export interface HasilOverheadAktual { overheadAktualId: string }
export interface HasilBebankanTkl { total: string; jurnalIds: string[]; eventIds: string[] }
export interface HasilBebankanOverhead {
  tarifId: string; nominal: string; jurnalId: string; eventId: string;
}
export interface HasilHppFinal {
  totalHpp: string; qtyLulus: string; hppPerUnit: string;
  jurnalId: string | null; eventId: string | null;
}
export interface RiwayatSpk {
  id: string; dokumen_id: string; tipe_dokumen: string; aksi: string;
  status_asal: StatusDokumen | null; status_tujuan: StatusDokumen; level: number | null;
  alasan: string | null; siklus_approval: number; actor_id: string; created_at: string;
}

/** Identical retries resolve to the same advisory lock and idempotency registry key. */
export function kunciIdempotensi(
  operasi: string,
  bagian: readonly (string | number | null | undefined)[],
  kunci?: string,
): string {
  return ["K10", operasi, ...bagian.map((value) => value ?? "-"), kunci ?? ""].join("|");
}

/** Deterministic UUID used as the movement's source id, so a retry cannot post twice. */
export function uuidDariKunci(kunci: string): string {
  const heks = Array.from({ length: 8 }, (_, indeks) => {
    let hash = (2166136261 ^ indeks) >>> 0;
    for (let posisi = 0; posisi < kunci.length; posisi += 1) {
      hash = Math.imul(hash ^ kunci.charCodeAt(posisi), 16777619) >>> 0;
    }
    hash ^= hash >>> 16;
    hash = Math.imul(hash, 2246822507) >>> 0;
    return ((hash ^ (hash >>> 13)) >>> 0).toString(16).padStart(8, "0");
  }).join("");
  return `${heks.slice(0, 8)}-${heks.slice(8, 12)}-5${heks.slice(13, 16)}-a${heks.slice(17, 20)}-${heks.slice(20)}`;
}
