import type { FormatTanggal, ProfilPemetaan } from "@/modules/penggajian/impor/types";
import { menitDariJam } from "@/modules/penggajian/shared/waktu";

export type BarisCsv = { baris: number; idMesin: string; tanggal: string; jamMasuk: string; jamPulang: string };

const LABEL_PEMISAH: Record<string, string> = { ",": "koma", ";": "titik koma", "\t": "tab" };

function tanggalIso(nilai: string, format: FormatTanggal): string | null {
  const m = format === "YYYY-MM-DD" ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(nilai) : /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(nilai);
  if (!m) return null;
  const [y, mo, d] = format === "YYYY-MM-DD" ? [m[1], m[2], m[3]] : [m[3], m[2], m[1]];
  const iso = `${y}-${mo}-${d}`;
  const date = new Date(`${iso}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === iso ? iso : null;
}

/**
 * Parses the whole file or rejects it (AC-02, AC-04, AC-12): nothing is
 * returned for a file with a wrong format or a single broken row.
 */
export function parseCsv(isi: string, p: ProfilPemetaan): { ok: true; baris: BarisCsv[] } | { ok: false; pesan: string } {
  const lines = isi.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length <= 1) return { ok: false, pesan: "Berkas kosong: tidak ada baris data presensi." };
  const header = lines[0].split(p.pemisah).map((h) => h.trim());
  const kolom = [p.kolomIdMesin, p.kolomTanggal, p.kolomJamMasuk, p.kolomJamPulang];
  const posisi = kolom.map((k) => header.indexOf(k));
  if (posisi.some((i) => i < 0)) {
    return {
      ok: false,
      pesan: `Format berkas tidak sesuai profil: diharapkan pemisah ${LABEL_PEMISAH[p.pemisah]}, kolom ${kolom.join(", ")}, dan tanggal ${p.formatTanggal}. Tidak ada baris yang disimpan.`,
    };
  }
  const hasil: BarisCsv[] = [];
  for (let i = 1; i < lines.length; i++) {
    const nomor = i + 1;
    const sel = lines[i].split(p.pemisah).map((s) => s.trim());
    const rusak = (alasan: string) => ({ ok: false as const, pesan: `Baris ${nomor} rusak: ${alasan}. Seluruh berkas ditolak; tidak ada baris yang disimpan.` });
    if (sel.length !== header.length) return rusak(`jumlah kolom ${sel.length}, seharusnya ${header.length}`);
    const [idMesin, tanggalTeks, jamMasuk, jamPulang] = posisi.map((x) => sel[x]);
    const tanggal = tanggalIso(tanggalTeks, p.formatTanggal);
    if (!idMesin) return rusak("ID mesin kosong");
    if (!tanggal) return rusak(`tanggal "${tanggalTeks}" bukan format ${p.formatTanggal}`);
    if (menitDariJam(jamMasuk) === null) return rusak(`jam masuk "${jamMasuk}" tidak valid`);
    if (menitDariJam(jamPulang) === null) return rusak(`jam pulang "${jamPulang}" tidak valid`);
    hasil.push({ baris: nomor, idMesin, tanggal, jamMasuk, jamPulang });
  }
  return { ok: true, baris: hasil };
}
