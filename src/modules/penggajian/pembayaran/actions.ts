"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { assertIzin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { AksiState } from "@/modules/penggajian/karyawan/actions";
import { cekBukti } from "@/modules/penggajian/pembayaran/rules";
import { getPembayaran } from "@/modules/penggajian/pembayaran/queries";
import { sesiDariProfil } from "@/modules/penggajian/akun/akun";
import { teks } from "@/modules/penggajian/shared/form";

/*
 * Finance records transfers. The proof goes to the private bucket
 * bukti-transfer-gaji first; kirim_batch_gaji / ulang_transfer_gaji then
 * check role, approval, separation of duties, accounts, and duplicates
 * (migration 0021) and move the period status.
 */

const BASE = "/penggajian/pembayaran";
const BUCKET = "bukti-transfer-gaji";

function selesai(periodeId: string, pesan: string): never {
  revalidatePath(BASE);
  revalidatePath("/penggajian/payroll");
  revalidatePath("/penggajian/slip");
  redirect(`${BASE}?periode=${periodeId}&pesan=${pesan}`);
}

async function unggah(periodeId: string, file: File): Promise<{ ok: true; path: string } | { ok: false; message: string }> {
  const supabase = await createClient();
  const ekstensi = file.type === "application/pdf" ? "pdf" : file.type === "image/png" ? "png" : "jpg";
  const path = `${periodeId}/${crypto.randomUUID()}.${ekstensi}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type });
  return error ? { ok: false, message: `Bukti transfer gagal disimpan: ${error.message}` } : { ok: true, path };
}

export async function sendBatch(_state: AksiState, formData: FormData): Promise<AksiState> {
  const hasil = await assertIzin("bayar_gaji");
  if (!hasil.ok) return { ok: false, message: "Hanya Finance yang mencatat pembayaran gaji." };
  const periodeId = teks(formData, "periodeId");
  const bukti = cekBukti(formData.get("bukti"));
  if (!bukti.ok) return { ok: false, message: bukti.pesan, fieldErrors: { bukti: bukti.pesan } };
  const view = await getPembayaran(sesiDariProfil(hasil.data), periodeId);
  // Paid or failed employees never enter a new batch (INV-02); bad accounts wait for HR.
  const masuk = (view?.baris ?? []).filter((b) => b.status === "BELUM");
  if (masuk.length === 0) return { ok: false, message: "Tidak ada karyawan yang bisa masuk batch: semua sudah dibayar, gagal, atau rekeningnya bermasalah." };
  const errors: Record<string, string> = {};
  for (const b of masuk) {
    const h = teks(formData, `hasil_${b.karyawanId}`);
    if (h !== "DIBAYAR" && h !== "GAGAL_TRANSFER") errors[`hasil_${b.karyawanId}`] = `Pilih hasil transfer ${b.nama}.`;
  }
  if (Object.keys(errors).length > 0) return { ok: false, message: "Lengkapi hasil transfer setiap karyawan.", fieldErrors: errors };
  const file = formData.get("bukti") as File;
  const simpan = await unggah(periodeId, file);
  if (!simpan.ok) return simpan;
  const supabase = await createClient();
  const { error } = await supabase.rpc("kirim_batch_gaji", {
    p_periode_gaji_id: periodeId,
    p_bukti_path: simpan.path,
    p_bukti_nama: bukti.bukti.nama,
    p_bukti_tipe: bukti.bukti.tipe,
    p_bukti_ukuran: bukti.bukti.ukuran,
    p_hasil: masuk.map((b) => ({ karyawan_id: b.karyawanId, status: teks(formData, `hasil_${b.karyawanId}`), referensi: teks(formData, `ref_${b.karyawanId}`) })),
  });
  if (error) return { ok: false, message: error.message };
  selesai(periodeId, "batch");
}

export async function retryTransfer(periodeId: string, karyawanId: string, _state: AksiState, formData: FormData): Promise<AksiState> {
  const hasil = await assertIzin("bayar_gaji");
  if (!hasil.ok) return { ok: false, message: "Hanya Finance yang mencatat pembayaran gaji." };
  const alasan = teks(formData, "alasan");
  const status = teks(formData, "hasil");
  const bukti = cekBukti(formData.get("bukti"));
  const errors: Record<string, string> = {};
  if (!alasan) errors.alasan = "Alasan percobaan ulang wajib diisi.";
  if (status !== "DIBAYAR" && status !== "GAGAL_TRANSFER") errors.hasil = "Pilih hasil transfer.";
  if (!bukti.ok) errors.bukti = bukti.pesan;
  if (Object.keys(errors).length > 0 || !bukti.ok) return { ok: false, message: "Percobaan ulang belum bisa disimpan. Periksa isian yang ditandai.", fieldErrors: errors };
  const simpan = await unggah(periodeId, formData.get("bukti") as File);
  if (!simpan.ok) return simpan;
  const supabase = await createClient();
  const { error } = await supabase.rpc("ulang_transfer_gaji", {
    p_periode_gaji_id: periodeId, p_karyawan_id: karyawanId, p_status: status, p_referensi: teks(formData, "referensi"),
    p_alasan: alasan, p_bukti_path: simpan.path, p_bukti_nama: bukti.bukti.nama, p_bukti_tipe: bukti.bukti.tipe, p_bukti_ukuran: bukti.bukti.ukuran,
  });
  if (error) return { ok: false, message: error.message };
  selesai(periodeId, "ulang");
}

/** Not enough funds: nothing is processed and the draft stays approved. */
export async function recordDanaKurang(_state: AksiState, formData: FormData): Promise<AksiState> {
  const hasil = await assertIzin("bayar_gaji");
  if (!hasil.ok) return { ok: false, message: "Hanya Finance yang mencatat pembayaran gaji." };
  const periodeId = teks(formData, "periodeId");
  const supabase = await createClient();
  const { error } = await supabase.rpc("catat_dana_kurang", { p_periode_gaji_id: periodeId, p_catatan: teks(formData, "catatan") });
  if (error) return { ok: false, message: error.message };
  selesai(periodeId, "dana");
}
