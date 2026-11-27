"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { assertIzin } from "@/lib/auth";
import { sesiDariProfil } from "@/modules/penggajian/akun/akun";
import type { AksiState } from "@/modules/penggajian/karyawan/actions";
import { cariKaryawan } from "@/modules/penggajian/karyawan/store";
import { cekBukti, masalahRekening } from "@/modules/penggajian/pembayaran/rules";
import { pembayaranUntuk } from "@/modules/penggajian/pembayaran/store";
import type { PembayaranPeriode } from "@/modules/penggajian/pembayaran/types";
import { cariDraft } from "@/modules/penggajian/payroll/store";
import type { DraftPayroll } from "@/modules/penggajian/payroll/types";
import { catatRiwayat } from "@/modules/penggajian/shared/riwayat";
import { teks } from "@/modules/penggajian/shared/form";

const BASE = "/penggajian/pembayaran";

type Siap = { draft: DraftPayroll; bayar: PembayaranPeriode; nama: string };

/** Finance only, approved draft only, and never the person who calculated it (D-42). */
async function siapkan(periodeId: string): Promise<{ ok: true; data: Siap } | { ok: false; message: string }> {
  const hasil = await assertIzin("bayar_gaji");
  if (!hasil.ok) return { ok: false, message: "Hanya Finance yang mencatat pembayaran gaji." };
  const draft = cariDraft(periodeId);
  if (draft && (draft.status === "DIBAYAR" || draft.status === "DIPOSTING")) {
    return { ok: false, message: "Semua karyawan periode ini sudah dibayar; pembayaran kedua ditolak." };
  }
  if (!draft || !["DISETUJUI", "GAGAL_TRANSFER"].includes(draft.status)) {
    return { ok: false, message: "Pembayaran ditolak: payroll periode ini belum disetujui Direksi." };
  }
  if (draft.dihitungOlehProfileId === hasil.data.id) {
    return { ok: false, message: "Ditolak karena pemisahan tugas: penghitung draft tidak boleh mencatat pembayarannya." };
  }
  return { ok: true, data: { draft, bayar: pembayaranUntuk(periodeId), nama: sesiDariProfil(hasil.data).nama } };
}

/** Period status follows the employees (T-02): any failure → GAGAL_TRANSFER, all paid → DIBAYAR. */
function perbaruiStatus(draft: DraftPayroll, bayar: PembayaranPeriode, oleh: string, pada: string) {
  const status = (id: string) => bayar.transfer.find((t) => t.karyawanId === id)?.status;
  const ke = draft.baris.some((b) => status(b.karyawanId) === "GAGAL_TRANSFER")
    ? "GAGAL_TRANSFER"
    : draft.baris.every((b) => status(b.karyawanId) === "DIBAYAR") ? "DIBAYAR" : "DISETUJUI";
  if (ke !== draft.status) {
    catatRiwayat(draft.riwayat, { dari: draft.status, ke, oleh, pada });
    draft.status = ke;
  }
}

function selesai(periodeId: string, pesan: string): never {
  revalidatePath(BASE);
  revalidatePath("/penggajian/payroll");
  revalidatePath("/penggajian/slip");
  redirect(`${BASE}?periode=${periodeId}&pesan=${pesan}`);
}

export async function sendBatch(_state: AksiState, formData: FormData): Promise<AksiState> {
  const periodeId = teks(formData, "periodeId");
  const siap = await siapkan(periodeId);
  if (!siap.ok) return siap;
  const { draft, bayar, nama } = siap.data;
  const bukti = cekBukti(formData.get("bukti"));
  if (!bukti.ok) return { ok: false, message: bukti.pesan, fieldErrors: { bukti: bukti.pesan } };
  // Paid or failed employees never enter a new batch (INV-02); bad accounts wait for HR.
  const masuk = draft.baris.filter(
    (b) => !bayar.transfer.some((t) => t.karyawanId === b.karyawanId) && !masalahRekening(cariKaryawan(b.karyawanId)?.rekening),
  );
  if (masuk.length === 0) return { ok: false, message: "Tidak ada karyawan yang bisa masuk batch: semua sudah dibayar, gagal, atau rekeningnya bermasalah." };
  const errors: Record<string, string> = {};
  for (const b of masuk) {
    const hasil = teks(formData, `hasil_${b.karyawanId}`);
    if (hasil !== "DIBAYAR" && hasil !== "GAGAL_TRANSFER") errors[`hasil_${b.karyawanId}`] = `Pilih hasil transfer ${b.nama}.`;
  }
  if (Object.keys(errors).length > 0) return { ok: false, message: "Lengkapi hasil transfer setiap karyawan.", fieldErrors: errors };
  const pada = new Date().toISOString();
  const batchId = crypto.randomUUID();
  bayar.batch.push({ id: batchId, bukti: bukti.bukti, oleh: nama, pada, jumlahKaryawan: masuk.length, ulang: false });
  for (const b of masuk) {
    const status = teks(formData, `hasil_${b.karyawanId}`) as "DIBAYAR" | "GAGAL_TRANSFER";
    const percobaan = { batchId, status, referensi: teks(formData, `ref_${b.karyawanId}`), oleh: nama, pada };
    bayar.transfer.push({ karyawanId: b.karyawanId, nominal: b.neto, status, percobaan: [percobaan] });
  }
  perbaruiStatus(draft, bayar, nama, pada);
  selesai(periodeId, "batch");
}

export async function retryTransfer(periodeId: string, karyawanId: string, _state: AksiState, formData: FormData): Promise<AksiState> {
  const siap = await siapkan(periodeId);
  if (!siap.ok) return siap;
  const { draft, bayar, nama } = siap.data;
  const transfer = bayar.transfer.find((t) => t.karyawanId === karyawanId);
  if (!transfer) return { ok: false, message: "Karyawan ini belum masuk batch." };
  if (transfer.status === "DIBAYAR") return { ok: false, message: "Karyawan ini sudah dibayar; pembayaran kedua ditolak." };
  const alasan = teks(formData, "alasan");
  const hasil = teks(formData, "hasil");
  const bukti = cekBukti(formData.get("bukti"));
  const errors: Record<string, string> = {};
  if (!alasan) errors.alasan = "Alasan percobaan ulang wajib diisi.";
  if (hasil !== "DIBAYAR" && hasil !== "GAGAL_TRANSFER") errors.hasil = "Pilih hasil transfer.";
  if (!bukti.ok) errors.bukti = bukti.pesan;
  if (Object.keys(errors).length > 0 || !bukti.ok) return { ok: false, message: "Percobaan ulang belum bisa disimpan. Periksa isian yang ditandai.", fieldErrors: errors };
  const pada = new Date().toISOString();
  const batchId = crypto.randomUUID();
  bayar.batch.push({ id: batchId, bukti: bukti.bukti, oleh: nama, pada, jumlahKaryawan: 1, ulang: true });
  transfer.status = hasil as "DIBAYAR" | "GAGAL_TRANSFER";
  transfer.percobaan.push({ batchId, status: transfer.status, referensi: teks(formData, "referensi"), alasan, oleh: nama, pada });
  perbaruiStatus(draft, bayar, nama, pada);
  selesai(periodeId, "ulang");
}

/** Not enough funds: nothing is processed and the draft stays approved. */
export async function recordDanaKurang(_state: AksiState, formData: FormData): Promise<AksiState> {
  const periodeId = teks(formData, "periodeId");
  const siap = await siapkan(periodeId);
  if (!siap.ok) return siap;
  const catatan = teks(formData, "catatan") || "Dana tidak cukup";
  const pada = new Date().toISOString();
  siap.data.bayar.catatanDana.push({ oleh: siap.data.nama, pada, catatan });
  catatRiwayat(siap.data.draft.riwayat, {
    dari: siap.data.draft.status, ke: siap.data.draft.status, oleh: siap.data.nama, pada,
    alasan: `Batch tidak diproses: ${catatan}. Notifikasi ke Manajemen menunggu C-012.`,
  });
  selesai(periodeId, "dana");
}
