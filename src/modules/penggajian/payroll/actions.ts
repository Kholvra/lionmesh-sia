"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { assertIzin } from "@/lib/auth";
import { sesiDariProfil } from "@/modules/penggajian/akun/akun";
import type { AksiState } from "@/modules/penggajian/karyawan/actions";
import { parseNominal } from "@/modules/penggajian/karyawan/rules";
import { cariPeriode } from "@/modules/penggajian/periode/store";
import { dataHitung } from "@/modules/penggajian/payroll/data";
import { hitungPayroll, rangkum } from "@/modules/penggajian/payroll/hitung";
import { terkunci } from "@/modules/penggajian/payroll/status";
import { cariDraft, simpanDraft } from "@/modules/penggajian/payroll/store";
import { tabelTarif } from "@/modules/penggajian/payroll/tarif";
import type { DraftPayroll } from "@/modules/penggajian/payroll/types";
import { catatRiwayat } from "@/modules/penggajian/shared/riwayat";
import { teks } from "@/modules/penggajian/shared/form";

const BASE = "/penggajian/payroll";

export async function calculatePayroll(_state: AksiState, formData: FormData): Promise<AksiState> {
  const hasil = await assertIzin("hitung_payroll");
  if (!hasil.ok) return hasil;
  const nama = sesiDariProfil(hasil.data).nama;
  const periode = cariPeriode(teks(formData, "periodeId"));
  if (!periode) return { ok: false, message: "Periode tidak ditemukan." };
  if (periode.status !== "TERVALIDASI") {
    return { ok: false, message: `Payroll ${periode.nama} belum bisa dihitung: validasi supervisor belum dilakukan.` };
  }
  const lama = cariDraft(periode.id);
  if (lama && (lama.status === "DIPERIKSA" || terkunci(lama.status))) {
    return { ok: false, message: terkunci(lama.status) ? "Draft sudah disetujui dan dikunci." : "Draft sedang diperiksa Accounting; tunggu dikembalikan sebelum menghitung ulang." };
  }
  const hitung = hitungPayroll(periode, dataHitung(periode), tabelTarif());
  if (!hitung.ok) return hitung;
  const pada = new Date().toISOString();
  const draft: DraftPayroll = {
    periodeId: periode.id,
    status: "DRAFT_TERHITUNG",
    dihitungOleh: nama,
    dihitungOlehProfileId: hasil.data.id,
    dihitungPada: pada,
    versiTarif: hitung.data.versiTarif,
    baris: hitung.data.baris,
    ditandai: hitung.data.ditandai,
    riwayat: lama ? [...lama.riwayat] : [],
    pengembalian: null,
  };
  catatRiwayat(draft.riwayat, { dari: lama?.status ?? null, ke: "DRAFT_TERHITUNG", oleh: nama, pada, alasan: lama ? "Dihitung ulang" : "Dihitung" });
  simpanDraft(draft);
  revalidatePath(BASE);
  redirect(`${BASE}?periode=${periode.id}&pesan=dihitung`);
}

/** Manual correction of one component; the reason is mandatory and kept on the component (D-48). */
export async function overrideKomponen(periodeId: string, karyawanId: string, _state: AksiState, formData: FormData): Promise<AksiState> {
  const hasil = await assertIzin("hitung_payroll");
  if (!hasil.ok) return hasil;
  const draft = cariDraft(periodeId);
  if (!draft || (draft.status !== "DRAFT_TERHITUNG" && draft.status !== "REVISI")) {
    return { ok: false, message: "Koreksi hanya untuk draft yang belum diperiksa atau dikunci." };
  }
  const index = draft.baris.findIndex((b) => b.karyawanId === karyawanId);
  const baris = draft.baris[index];
  const kode = teks(formData, "kode");
  const komponen = baris?.komponen.find((k) => k.kode === kode);
  const alasan = teks(formData, "alasan");
  const nilaiTeks = teks(formData, "nilai");
  const nilai = nilaiTeks === "0" ? 0 : parseNominal(nilaiTeks);
  const errors: Record<string, string> = {};
  if (!komponen) errors.kode = "Pilih komponen.";
  if (nilai === null) errors.nilai = "Isi nilai dalam rupiah, tanpa desimal.";
  if (!alasan) errors.alasan = "Alasan koreksi wajib diisi.";
  if (Object.keys(errors).length > 0 || !komponen || nilai === null) {
    return { ok: false, message: "Koreksi belum bisa disimpan. Periksa isian yang ditandai.", fieldErrors: errors };
  }
  const nama = sesiDariProfil(hasil.data).nama;
  const pada = new Date().toISOString();
  komponen.koreksi = { nilaiSemula: komponen.koreksi?.nilaiSemula ?? komponen.nilai, alasan, oleh: nama, pada };
  komponen.nilai = nilai;
  komponen.nilaiMentah = nilai;
  draft.baris[index] = rangkum(baris);
  catatRiwayat(draft.riwayat, { dari: draft.status, ke: draft.status, oleh: nama, pada, alasan: `Koreksi ${komponen.label} ${baris.nama}: ${alasan}` });
  revalidatePath(BASE);
  redirect(`${BASE}/${periodeId}/${karyawanId}?pesan=dikoreksi`);
}
