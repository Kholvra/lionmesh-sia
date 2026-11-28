"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { parsePeriode, type HasilTutupTahun } from "@/core/ledger";
import {
  tutupPeriodeUntukSesi,
  tutupTahunUntukSesi,
} from "@/core/ledger/server";
import { fail, ok, type Result } from "@/lib/result";

import { tutupPeriodeSchema, tutupTahunSchema } from "./schema";

export type AksiTutupState = { ok: boolean; message: string } | null;

export async function tutupPeriodeAction(
  _state: AksiTutupState,
  formData: FormData,
): Promise<AksiTutupState> {
  const parsed = tutupPeriodeSchema.safeParse({
    periode: formData.get("periode"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Data periode tidak valid.",
    };
  }

  const periode = parsePeriode(parsed.data.periode);
  if (!periode.ok) return { ok: false, message: periode.message };

  const hasil = await tutupPeriodeUntukSesi({
    tahun: periode.data.tahun,
    bulan: periode.data.bulan,
  });
  if (!hasil.ok) return { ok: false, message: hasil.message };

  revalidatePath("/laporan/periode");
  revalidatePath("/laporan");
  redirect(`/laporan/periode?berhasil=${encodeURIComponent(periode.data.kunci)}`);
}

export async function tutupTahunAction(
  tahun: number,
): Promise<Result<HasilTutupTahun>> {
  const parsed = tutupTahunSchema.safeParse({ tahun });
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Tahun buku tidak valid.");
  }

  const hasil = await tutupTahunUntukSesi({ tahun: parsed.data.tahun });
  if (!hasil.ok) return fail(hasil.message);

  revalidatePath("/laporan/periode");
  revalidatePath("/laporan");
  return ok(hasil.data);
}
