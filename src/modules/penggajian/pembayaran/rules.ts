import type { Rekening } from "@/modules/penggajian/karyawan/types";
import type { BuktiTransfer } from "@/modules/penggajian/pembayaran/types";

/*
 * T-04 limits the proof check to file type and size. The values below are a
 * working assumption for the prototype, not a decided rule.
 */
export const BUKTI_TIPE: readonly string[] = ["application/pdf", "image/png", "image/jpeg"];
export const BUKTI_UKURAN_MAKS = 10 * 1024 * 1024;

export function cekBukti(file: FormDataEntryValue | null): { ok: true; bukti: BuktiTransfer } | { ok: false; pesan: string } {
  if (!(file instanceof File) || file.size === 0) return { ok: false, pesan: "Bukti transfer wajib diunggah." };
  if (!BUKTI_TIPE.includes(file.type)) return { ok: false, pesan: "Bukti transfer harus berkas PDF, PNG, atau JPG." };
  if (file.size > BUKTI_UKURAN_MAKS) return { ok: false, pesan: "Bukti transfer paling besar 10 MB." };
  return { ok: true, bukti: { nama: file.name, ukuran: file.size, tipe: file.type } };
}

/** D-51(d): bank name, digits-only number, and owner name must all be present. */
export function masalahRekening(rekening: Rekening | undefined): string | null {
  if (!rekening || !rekening.namaBank) return "Nama bank kosong";
  if (!/^\d+$/.test(rekening.nomor)) return "Nomor rekening kosong atau bukan angka";
  if (!rekening.namaPemilik) return "Nama pemilik rekening kosong";
  return null;
}
