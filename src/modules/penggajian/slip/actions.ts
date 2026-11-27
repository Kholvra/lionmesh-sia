"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { assertIzin } from "@/lib/auth";
import { sesiDariProfil } from "@/modules/penggajian/akun/akun";
import type { AksiState } from "@/modules/penggajian/karyawan/actions";
import { cariPembayaran } from "@/modules/penggajian/pembayaran/store";
import { teks } from "@/modules/penggajian/shared/form";
import { simpanSlip, slipKaryawan } from "@/modules/penggajian/slip/store";

async function siapkan(periodeId: string, karyawanId: string) {
  const hasil = await assertIzin("terbitkan_slip");
  if (!hasil.ok) return { ok: false as const, message: "Hanya HR yang mencetak slip gaji." };
  const transfer = cariPembayaran(periodeId)?.transfer.find((t) => t.karyawanId === karyawanId);
  if (transfer?.status !== "DIBAYAR") return { ok: false as const, message: "Slip belum bisa dicetak: pembayaran karyawan ini belum tercatat Dibayar." };
  return { ok: true as const, nama: sesiDariProfil(hasil.data).nama };
}

function ke(periodeId: string, karyawanId: string, pesan: string): never {
  revalidatePath("/penggajian/slip");
  redirect(`/penggajian/slip/${periodeId}/${karyawanId}?pesan=${pesan}`);
}

/** The first print issues the slip; later prints of the same slip are logged as reprints. */
export async function printSlip(periodeId: string, karyawanId: string): Promise<AksiState> {
  const siap = await siapkan(periodeId, karyawanId);
  if (!siap.ok) return siap;
  const pada = new Date().toISOString();
  const terbaru = slipKaryawan(periodeId, karyawanId).at(-1);
  if (terbaru) {
    terbaru.cetakan.push({ oleh: siap.nama, pada, ulang: terbaru.cetakan.length > 0 });
  } else {
    simpanSlip({ id: crypto.randomUUID(), periodeId, karyawanId, jenis: "ASLI", dibuatOleh: siap.nama, dibuatPada: pada, cetakan: [{ oleh: siap.nama, pada, ulang: false }] });
  }
  ke(periodeId, karyawanId, "dicetak");
}

export async function replaceSlip(periodeId: string, karyawanId: string, _state: AksiState, formData: FormData): Promise<AksiState> {
  const siap = await siapkan(periodeId, karyawanId);
  if (!siap.ok) return siap;
  const lama = slipKaryawan(periodeId, karyawanId).at(-1);
  if (!lama) return { ok: false, message: "Belum ada slip yang terbit untuk diganti." };
  const alasan = teks(formData, "alasan");
  if (!alasan) return { ok: false, message: "Alasan slip pengganti wajib diisi.", fieldErrors: { alasan: "Alasan slip pengganti wajib diisi." } };
  simpanSlip({ id: crypto.randomUUID(), periodeId, karyawanId, jenis: "PENGGANTI", alasan, menggantikanId: lama.id, dibuatOleh: siap.nama, dibuatPada: new Date().toISOString(), cetakan: [] });
  ke(periodeId, karyawanId, "pengganti");
}
