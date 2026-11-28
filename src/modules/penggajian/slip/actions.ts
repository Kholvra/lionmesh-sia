"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { assertIzin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { AksiState } from "@/modules/penggajian/karyawan/actions";
import { teks } from "@/modules/penggajian/shared/form";

function ke(periodeId: string, karyawanId: string, pesan: string): never {
  revalidatePath("/penggajian/slip");
  redirect(`/penggajian/slip/${periodeId}/${karyawanId}?pesan=${pesan}`);
}

/** The first print issues the slip; later prints of the same slip are logged as reprints (cetak_slip_gaji). */
export async function printSlip(periodeId: string, karyawanId: string): Promise<AksiState> {
  const hasil = await assertIzin("terbitkan_slip");
  if (!hasil.ok) return { ok: false, message: "Hanya HR yang mencetak slip gaji." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("cetak_slip_gaji", { p_periode_gaji_id: periodeId, p_karyawan_id: karyawanId });
  if (error) return { ok: false, message: error.message };
  ke(periodeId, karyawanId, "dicetak");
}

export async function replaceSlip(periodeId: string, karyawanId: string, _state: AksiState, formData: FormData): Promise<AksiState> {
  const hasil = await assertIzin("terbitkan_slip");
  if (!hasil.ok) return { ok: false, message: "Hanya HR yang mencetak slip gaji." };
  const alasan = teks(formData, "alasan");
  if (!alasan) return { ok: false, message: "Alasan slip pengganti wajib diisi.", fieldErrors: { alasan: "Alasan slip pengganti wajib diisi." } };
  const supabase = await createClient();
  const { error } = await supabase.rpc("slip_pengganti_gaji", { p_periode_gaji_id: periodeId, p_karyawan_id: karyawanId, p_alasan: alasan });
  if (error) return { ok: false, message: error.message };
  ke(periodeId, karyawanId, "pengganti");
}
