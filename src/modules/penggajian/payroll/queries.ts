import { createClient } from "@/lib/supabase/server";
import type { SesiPenggajian } from "@/modules/penggajian/akun/akun";
import { aksesPayroll } from "@/modules/penggajian/payroll/akses";
import { rangkum } from "@/modules/penggajian/payroll/hitung";
import { tabelTarif } from "@/modules/penggajian/payroll/tarif";
import type { BarisGaji, DraftPayroll, KaryawanDitandai, Komponen, KodeKomponen, StatusDraft } from "@/modules/penggajian/payroll/types";
import { gagalBaca, semuaPeriode } from "@/modules/penggajian/periode/queries";

/*
 * Reads from migration 0019: komponen_gaji_aman (HR, Accounting), gaji_bersih
 * (adds Finance), ringkasan_payroll (adds Direksi). The draft status is the
 * period document status.
 */

export type RingkasanDraft = {
  jumlahKaryawan: number;
  totalBruto: number;
  totalPotongan: number;
  totalNeto: number;
  totalSelisih: number;
};

export type DraftView = Omit<DraftPayroll, "baris"> & {
  ringkasan: RingkasanDraft;
  /** Present only for HR and Accounting. */
  baris?: BarisGaji[];
  /** Net per employee, for Finance. */
  neto?: { karyawanId: string; nama: string; nik: string; neto: number }[];
};

const STATUS_DRAFT: readonly string[] = ["DRAFT_TERHITUNG", "REVISI", "DIPERIKSA", "DISETUJUI", "DIBAYAR", "GAGAL_TRANSFER", "DIPOSTING"];

type BarisKomponen = {
  karyawan_id: string;
  nama: string;
  nik: string;
  departemen: string;
  perlu_penyesuaian_tahunan: boolean;
  kode: KodeKomponen;
  label: string;
  jenis: "tambah" | "kurang";
  nilai: string;
  nilai_mentah: string;
  dasar: string;
  versi_tarif: string | null;
  koreksi_nilai_semula: string | null;
  koreksi_alasan: string | null;
  koreksi_oleh: string;
  koreksi_at: string | null;
};

const URUTAN: readonly KodeKomponen[] = [
  "GAJI_POKOK", "TUNJANGAN_TETAP", "TUNJANGAN_KEHADIRAN", "LEMBUR",
  "POTONGAN_KETIDAKHADIRAN", "BPJS_JHT", "BPJS_JP", "BPJS_KESEHATAN", "PPH21",
];

function susunBaris(rows: BarisKomponen[]): BarisGaji[] {
  const peta = new Map<string, BarisKomponen[]>();
  for (const row of rows) peta.set(row.karyawan_id, [...(peta.get(row.karyawan_id) ?? []), row]);
  return [...peta.values()]
    .map((list) => {
      const awal = list[0];
      const komponen = list
        .sort((a, b) => URUTAN.indexOf(a.kode) - URUTAN.indexOf(b.kode))
        .map((r): Komponen => ({
          kode: r.kode,
          label: r.label,
          jenis: r.jenis,
          nilaiMentah: Number(r.nilai_mentah),
          nilai: Number(r.nilai),
          dasar: r.dasar,
          versiTarif: r.versi_tarif,
          ...(r.koreksi_alasan && r.koreksi_at
            ? { koreksi: { nilaiSemula: Number(r.koreksi_nilai_semula), alasan: r.koreksi_alasan, oleh: r.koreksi_oleh, pada: r.koreksi_at } }
            : {}),
        }));
      return rangkum({
        karyawanId: awal.karyawan_id,
        nama: awal.nama,
        nik: awal.nik,
        departemen: awal.departemen,
        komponen,
        perluPenyesuaianTahunan: awal.perlu_penyesuaian_tahunan,
      });
    })
    .sort((a, b) => a.nik.localeCompare(b.nik));
}

export async function getDraft(sesi: SesiPenggajian, periodeId: string): Promise<DraftView | null> {
  const akses = aksesPayroll(sesi);
  if (!akses.ringkasan) return null;
  const supabase = await createClient();
  const [d, r, periode] = await Promise.all([
    supabase
      .from("draft_payroll_aman")
      .select("versi_tarif, ditandai, created_by, created_by_nama, created_at")
      .eq("periode_gaji_id", periodeId)
      .maybeSingle(),
    supabase.from("ringkasan_payroll").select("*").eq("periode_gaji_id", periodeId).maybeSingle(),
    semuaPeriode(supabase),
  ]);
  if (d.error || r.error) gagalBaca(d.error ?? r.error);
  const p = periode.find((x) => x.id === periodeId);
  if (!d.data || !p || !STATUS_DRAFT.includes(p.status)) return null;

  let baris: BarisGaji[] | undefined;
  let neto: DraftView["neto"];
  if (akses.rincian) {
    const k = await supabase.from("komponen_gaji_aman").select("*").eq("periode_gaji_id", periodeId).returns<BarisKomponen[]>();
    if (k.error) gagalBaca(k.error);
    baris = susunBaris(k.data);
  } else if (akses.neto) {
    const n = await supabase.from("gaji_bersih").select("karyawan_id, nama, nik, neto").eq("periode_gaji_id", periodeId);
    if (n.error) gagalBaca(n.error);
    neto = n.data
      .map((row) => ({ karyawanId: row.karyawan_id, nama: row.nama, nik: row.nik, neto: Number(row.neto) }))
      .sort((a, b) => a.nik.localeCompare(b.nik));
  }

  // From the calculation on: the period history is the draft history.
  const mulai = p.riwayat.findIndex((x) => x.ke === "DRAFT_TERHITUNG");
  return {
    periodeId,
    status: p.status as unknown as StatusDraft,
    dihitungOleh: d.data.created_by_nama,
    dihitungOlehProfileId: d.data.created_by,
    dihitungPada: d.data.created_at,
    versiTarif: d.data.versi_tarif,
    ditandai: d.data.ditandai as KaryawanDitandai[],
    riwayat: mulai >= 0 ? p.riwayat.slice(mulai) : [],
    // GJ-005: the latest return note, shown until the draft is recalculated.
    pengembalian: (() => {
      const kembali = p.status === "REVISI" ? [...p.riwayat].reverse().find((x) => x.dari === "DIPERIKSA" && x.ke === "REVISI") : undefined;
      return kembali ? { oleh: kembali.oleh, alasan: kembali.alasan ?? "", pada: kembali.pada } : null;
    })(),
    ringkasan: {
      jumlahKaryawan: r.data?.jumlah_karyawan ?? 0,
      totalBruto: Number(r.data?.total_tambah ?? 0),
      totalPotongan: Number(r.data?.total_kurang ?? 0),
      totalNeto: Number(r.data?.total_neto ?? 0),
      totalSelisih: Number(r.data?.total_selisih ?? 0),
    },
    baris,
    neto,
  };
}

export async function getBarisGaji(sesi: SesiPenggajian, periodeId: string, karyawanId: string): Promise<BarisGaji | null> {
  if (!aksesPayroll(sesi).rincian) return null;
  return (await getDraft(sesi, periodeId))?.baris?.find((b) => b.karyawanId === karyawanId) ?? null;
}

export function getTabelTarif() {
  return tabelTarif();
}
