"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { assertIzin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { AksiState } from "@/modules/penggajian/karyawan/actions";
import { parseNominal } from "@/modules/penggajian/karyawan/rules";
import { dataHitung } from "@/modules/penggajian/payroll/data";
import { hitungPayroll } from "@/modules/penggajian/payroll/hitung";
import { tabelTarif } from "@/modules/penggajian/payroll/tarif";
import { semuaPeriode } from "@/modules/penggajian/periode/queries";
import { teks } from "@/modules/penggajian/shared/form";

const BASE = "/penggajian/payroll";

/** HR calculates on the server from validated rows; simpan_draft_payroll stores it in one transaction. */
export async function calculatePayroll(_state: AksiState, formData: FormData): Promise<AksiState> {
  const hasil = await assertIzin("hitung_payroll");
  if (!hasil.ok) return hasil;
  const periode = (await semuaPeriode()).find((p) => p.id === teks(formData, "periodeId"));
  if (!periode) return { ok: false, message: "Periode tidak ditemukan." };
  if (periode.status === "TERBUKA" || periode.status === "REKAP") {
    return { ok: false, message: `Payroll ${periode.nama} belum bisa dihitung: validasi supervisor belum dilakukan.` };
  }
  const hitung = hitungPayroll(periode, await dataHitung(periode), tabelTarif());
  if (!hitung.ok) return hitung;
  const supabase = await createClient();
  const { error } = await supabase.rpc("simpan_draft_payroll", {
    p_periode_gaji_id: periode.id,
    p_versi_tarif: hitung.data.versiTarif,
    p_ditandai: hitung.data.ditandai,
    p_baris: hitung.data.baris.map((b) => ({
      karyawan_id: b.karyawanId,
      nama: b.nama,
      nik: b.nik,
      departemen: b.departemen,
      perlu_penyesuaian_tahunan: b.perluPenyesuaianTahunan,
      komponen: b.komponen.map((k) => ({
        kode: k.kode, label: k.label, jenis: k.jenis, nilai: k.nilai, nilai_mentah: k.nilaiMentah, dasar: k.dasar, versi_tarif: k.versiTarif,
      })),
    })),
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath(BASE);
  redirect(`${BASE}?periode=${periode.id}&pesan=dihitung`);
}

/** Manual correction of one component; the reason is mandatory and kept on the component (D-48). */
export async function overrideKomponen(periodeId: string, karyawanId: string, _state: AksiState, formData: FormData): Promise<AksiState> {
  const hasil = await assertIzin("hitung_payroll");
  if (!hasil.ok) return hasil;
  const kode = teks(formData, "kode");
  const alasan = teks(formData, "alasan");
  const nilaiTeks = teks(formData, "nilai");
  const nilai = nilaiTeks === "0" ? 0 : parseNominal(nilaiTeks);
  const errors: Record<string, string> = {};
  if (!kode) errors.kode = "Pilih komponen.";
  if (nilai === null) errors.nilai = "Isi nilai dalam rupiah, tanpa desimal.";
  if (!alasan) errors.alasan = "Alasan koreksi wajib diisi.";
  if (Object.keys(errors).length > 0 || nilai === null) {
    return { ok: false, message: "Koreksi belum bisa disimpan. Periksa isian yang ditandai.", fieldErrors: errors };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("koreksi_komponen_gaji", {
    p_periode_gaji_id: periodeId, p_karyawan_id: karyawanId, p_kode: kode, p_nilai: nilai, p_alasan: alasan,
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath(BASE);
  redirect(`${BASE}/${periodeId}/${karyawanId}?pesan=dikoreksi`);
}
