"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { assertIzin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { AksiState } from "@/modules/penggajian/karyawan/actions";
import { teks } from "@/modules/penggajian/shared/form";

/*
 * GJ-005 actions. Role, status, and separation of duties (the calculator may
 * not check, approve or return) are enforced by periksa_payroll,
 * setujui_payroll and kembalikan_payroll (migration 0020); their messages
 * reach the screen.
 */

const BASE = "/penggajian/payroll";

function selesai(periodeId: string, pesan: string): never {
  revalidatePath(BASE);
  redirect(`${BASE}?periode=${periodeId}&pesan=${pesan}`);
}

export async function checkPayroll(_state: AksiState, formData: FormData): Promise<AksiState> {
  const hasil = await assertIzin("periksa_payroll");
  if (!hasil.ok) return { ok: false, message: "Hanya Accounting yang berwenang melakukan tindakan ini." };
  const periodeId = teks(formData, "periodeId");
  const supabase = await createClient();
  const { error } = await supabase.rpc("periksa_payroll", { p_periode_gaji_id: periodeId, p_catatan: teks(formData, "catatan") });
  if (error) return { ok: false, message: error.message };
  selesai(periodeId, "diperiksa");
}

export async function approvePayroll(_state: AksiState, formData: FormData): Promise<AksiState> {
  const hasil = await assertIzin("setujui_payroll");
  if (!hasil.ok) return { ok: false, message: "Hanya Direksi yang berwenang melakukan tindakan ini." };
  const periodeId = teks(formData, "periodeId");
  const supabase = await createClient();
  const { error } = await supabase.rpc("setujui_payroll", { p_periode_gaji_id: periodeId, p_catatan: teks(formData, "catatan") });
  if (error) return { ok: false, message: error.message };
  selesai(periodeId, "disetujui");
}

export async function returnPayroll(_state: AksiState, formData: FormData): Promise<AksiState> {
  const periksa = await assertIzin("periksa_payroll");
  const setujui = periksa.ok ? periksa : await assertIzin("setujui_payroll");
  if (!setujui.ok) return { ok: false, message: "Hanya Accounting atau Direksi yang bisa mengembalikan draft." };
  const periodeId = teks(formData, "periodeId");
  const alasan = teks(formData, "alasan");
  if (!alasan) return { ok: false, message: "Alasan pengembalian wajib diisi.", fieldErrors: { alasan: "Alasan pengembalian wajib diisi." } };
  const supabase = await createClient();
  const { error } = await supabase.rpc("kembalikan_payroll", { p_periode_gaji_id: periodeId, p_alasan: alasan });
  if (error) return { ok: false, message: error.message };
  selesai(periodeId, "dikembalikan");
}
