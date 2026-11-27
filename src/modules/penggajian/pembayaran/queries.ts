import { createClient } from "@/lib/supabase/server";
import type { SesiPenggajian } from "@/modules/penggajian/akun/akun";
import type { Rekening } from "@/modules/penggajian/karyawan/types";
import { masalahRekening } from "@/modules/penggajian/pembayaran/rules";
import type { Batch, Percobaan, StatusTransfer } from "@/modules/penggajian/pembayaran/types";
import type { StatusDraft } from "@/modules/penggajian/payroll/types";
import { gagalBaca, semuaPeriode } from "@/modules/penggajian/periode/queries";

/*
 * GJ-006 readers (T-09): Finance sees accounts and amounts; Accounting sees
 * amounts, statuses, and proofs; HR sees accounts to fix them and statuses for
 * slips; Direksi sees only the period status. Views from migration 0021.
 */
export type AksesPembayaran = { membaca: boolean; rekening: boolean; nominal: boolean; perKaryawan: boolean; bayar: boolean };

export function aksesPembayaran(sesi: SesiPenggajian): AksesPembayaran {
  const p = sesi.peran;
  return {
    membaca: p === "Finance" || p === "Accounting" || p === "HR" || p === "Direksi",
    rekening: p === "Finance" || p === "HR",
    nominal: p === "Finance" || p === "Accounting",
    perKaryawan: p !== "Direksi",
    bayar: p === "Finance",
  };
}

export type BarisPembayaran = {
  karyawanId: string;
  nama: string;
  nik: string;
  rekening?: Rekening;
  nominal?: number;
  status: StatusTransfer | "BELUM" | "DITUNDA";
  masalahRekening: string | null;
  percobaan: Percobaan[];
};

export type PembayaranView = {
  statusDraft: StatusDraft | null;
  baris: BarisPembayaran[];
  batch: Batch[];
  catatanDana: { oleh: string; pada: string; catatan: string }[];
  jumlah: { dibayar: number; gagal: number; belum: number };
};

const STATUS_DRAFT: readonly string[] = ["DRAFT_TERHITUNG", "REVISI", "DIPERIKSA", "DISETUJUI", "DIBAYAR", "GAGAL_TRANSFER", "DIPOSTING"];

export async function getPembayaran(sesi: SesiPenggajian, periodeId: string): Promise<PembayaranView | null> {
  const akses = aksesPembayaran(sesi);
  if (!akses.membaca) return null;
  const supabase = await createClient();
  const periode = (await semuaPeriode(supabase)).find((p) => p.id === periodeId);
  const statusDraft = periode && STATUS_DRAFT.includes(periode.status) ? (periode.status as StatusDraft) : null;
  const kosong: PembayaranView = { statusDraft, baris: [], batch: [], catatanDana: [], jumlah: { dibayar: 0, gagal: 0, belum: 0 } };
  if (!akses.perKaryawan) return kosong;

  const [neto, transfer, percobaan, batch, dana, rek] = await Promise.all([
    supabase.from("gaji_bersih").select("karyawan_id, nama, nik, neto").eq("periode_gaji_id", periodeId),
    supabase.from("transfer_gaji_aman").select("karyawan_id, status").eq("periode_gaji_id", periodeId),
    supabase.from("percobaan_transfer_aman").select("karyawan_id, batch_id, status, referensi, alasan, oleh, created_at").eq("periode_gaji_id", periodeId).order("created_at"),
    supabase.from("batch_transfer_aman").select("id, bukti_nama, bukti_tipe, bukti_ukuran, ulang, jumlah_karyawan, oleh, created_at").eq("periode_gaji_id", periodeId).order("created_at"),
    supabase.from("catatan_dana_aman").select("catatan, oleh, created_at").eq("periode_gaji_id", periodeId).order("created_at"),
    supabase.from("karyawan_aman").select("id, rekening_nama_bank, rekening_nomor, rekening_nama_pemilik"),
  ]);
  const error = neto.error ?? transfer.error ?? percobaan.error ?? batch.error ?? dana.error ?? rek.error;
  if (error) gagalBaca(error);
  const n = neto.data ?? [], tr = transfer.data ?? [], pc = percobaan.data ?? [], r = rek.data ?? [];

  const baris: BarisPembayaran[] = n
    .map((b): BarisPembayaran => {
      const k = r.find((x) => x.id === b.karyawan_id);
      // Accounting does not read accounts; the database also stops pembayaran on a bad one.
      const rekening: Rekening | undefined = k?.rekening_nomor
        ? { namaBank: k.rekening_nama_bank ?? "", nomor: k.rekening_nomor, namaPemilik: k.rekening_nama_pemilik ?? "" }
        : undefined;
      const masalah = akses.rekening ? masalahRekening(rekening) : null;
      const t = tr.find((x) => x.karyawan_id === b.karyawan_id);
      return {
        karyawanId: b.karyawan_id,
        nama: b.nama,
        nik: b.nik,
        rekening: akses.rekening ? rekening : undefined,
        nominal: akses.nominal ? Number(b.neto) : undefined,
        status: (t?.status as StatusTransfer | undefined) ?? (masalah ? ("DITUNDA" as const) : ("BELUM" as const)),
        masalahRekening: masalah,
        percobaan: pc
          .filter((x) => x.karyawan_id === b.karyawan_id)
          .map((x): Percobaan => ({
            batchId: x.batch_id, status: x.status, referensi: x.referensi ?? "",
            ...(x.alasan ? { alasan: x.alasan } : {}), oleh: x.oleh, pada: x.created_at,
          })),
      };
    })
    .sort((a, b) => a.nik.localeCompare(b.nik));
  const hitung = (s: string) => baris.filter((b) => b.status === s).length;
  return {
    statusDraft,
    baris,
    batch: akses.nominal
      ? (batch.data ?? []).map((b): Batch => ({
          id: b.id, bukti: { nama: b.bukti_nama, ukuran: b.bukti_ukuran, tipe: b.bukti_tipe },
          oleh: b.oleh, pada: b.created_at, jumlahKaryawan: b.jumlah_karyawan, ulang: b.ulang,
        }))
      : [],
    catatanDana: (dana.data ?? []).map((c) => ({ oleh: c.oleh, pada: c.created_at, catatan: c.catatan })),
    jumlah: { dibayar: hitung("DIBAYAR"), gagal: hitung("GAGAL_TRANSFER"), belum: baris.length - hitung("DIBAYAR") - hitung("GAGAL_TRANSFER") },
  };
}

/** Transfer status per employee, for slips (HR). */
export async function statusTransfer(periodeId: string, karyawanId: string): Promise<StatusTransfer | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transfer_gaji_aman")
    .select("status")
    .eq("periode_gaji_id", periodeId)
    .eq("karyawan_id", karyawanId)
    .maybeSingle();
  if (error) gagalBaca(error);
  return (data?.status as StatusTransfer | undefined) ?? null;
}
