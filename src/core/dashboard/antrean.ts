import type { Peran } from "@/lib/auth/types";

import {
  SIKLUS_DASHBOARD,
  type DokumenMenunggu,
  type KartuSiklus,
  type PersetujuanTercatat,
  type SiklusDashboard,
  type StatusSumber,
  type TindakanAntrean,
} from "./types.ts";

/**
 * Satu-satunya tempat memetakan jenis dokumen FND-004 ke siklus. Pemilik modul
 * menambahkan entri saat mendaftarkan jenis dokumen baru; tipe tanpa entri tidak
 * dihitung diam-diam.
 */
export const SIKLUS_PER_TIPE: Readonly<Record<string, SiklusDashboard>> = {
  PERMINTAAN_PEMBELIAN: "Pengeluaran",
  PERIODE_GAJI: "Penggajian",
};

export function siklusUntukTipe(tipe: string): SiklusDashboard | null {
  return SIKLUS_PER_TIPE[tipe] ?? null;
}

function persetujuanDokumen(
  dokumen: DokumenMenunggu,
  riwayat: readonly PersetujuanTercatat[],
): PersetujuanTercatat[] {
  return riwayat.filter(
    (item) =>
      item.dokumenId === dokumen.id &&
      item.siklusApproval === dokumen.siklusApproval,
  );
}

/**
 * Level approval yang sedang menunggu, atau null bila dokumen tidak sedang
 * menunggu approval pada siklus berjalan.
 */
export function levelMenunggu(
  dokumen: DokumenMenunggu,
  riwayat: readonly PersetujuanTercatat[],
): number | null {
  if (!dokumen.perluApproval) return null;
  if (
    dokumen.statusMenungguApproval === null ||
    dokumen.status !== dokumen.statusMenungguApproval
  ) {
    return null;
  }

  const total = dokumen.approvalSnapshot.length;
  if (total === 0) return null;

  const levelDisetujui = new Set(
    persetujuanDokumen(dokumen, riwayat).map((item) => item.level),
  ).size;
  const berikutnya = levelDisetujui + 1;

  return berikutnya <= total ? berikutnya : null;
}

export function bolehMenindaklanjuti(
  dokumen: DokumenMenunggu,
  riwayat: readonly PersetujuanTercatat[],
  aktor: { id: string; peran: Peran | null },
): boolean {
  if (!aktor.peran) return false;
  if (dokumen.pembuatId === aktor.id) return false;

  const level = levelMenunggu(dokumen, riwayat);
  if (level === null) return false;

  const aturan = dokumen.approvalSnapshot.find((item) => item.level === level);
  if (!aturan || aturan.peran !== aktor.peran) return false;

  const sebelumnya = persetujuanDokumen(dokumen, riwayat).find(
    (item) => item.level === level - 1,
  );
  if (sebelumnya?.actorId === aktor.id) return false;

  return true;
}

function tahap(dokumen: DokumenMenunggu, level: number): string {
  return `Persetujuan level ${level} dari ${dokumen.approvalSnapshot.length}`;
}

export interface HasilSusunAntrean {
  antrean: TindakanAntrean[];
  tanpaSiklus: number;
}

export function susunAntrean(
  dokumenList: readonly DokumenMenunggu[],
  riwayat: readonly PersetujuanTercatat[],
  aktor: { id: string; peran: Peran | null },
): HasilSusunAntrean {
  const antrean: TindakanAntrean[] = [];
  let tanpaSiklus = 0;

  for (const dokumen of dokumenList) {
    if (!bolehMenindaklanjuti(dokumen, riwayat, aktor)) continue;

    const level = levelMenunggu(dokumen, riwayat);
    if (level === null) continue;

    const siklus = siklusUntukTipe(dokumen.tipe);
    if (!siklus) {
      tanpaSiklus += 1;
      continue;
    }

    antrean.push({
      dokumenId: dokumen.id,
      nomor: dokumen.nomor,
      jenis: dokumen.namaJenis,
      siklus,
      tahap: tahap(dokumen, level),
      mulaiMenunggu: dokumen.mulaiMenunggu,
      // No cycle page is available yet; a dead link would teach the user the
      // app is broken. The owning module turns this on when its route exists.
      tautan: null,
    });
  }

  antrean.sort((kiri, kanan) => {
    const selisih =
      Date.parse(kiri.mulaiMenunggu) - Date.parse(kanan.mulaiMenunggu);
    if (selisih !== 0) return selisih;
    return kiri.nomor.localeCompare(kanan.nomor, "id");
  });

  return { antrean, tanpaSiklus };
}

export function sumberPerSiklus(
  tipeTerdaftar: readonly string[],
  gagal: boolean,
): Record<SiklusDashboard, StatusSumber> {
  const hasil = {} as Record<SiklusDashboard, StatusSumber>;

  for (const siklus of SIKLUS_DASHBOARD) {
    const punyaSumber = tipeTerdaftar.some(
      (tipe) => siklusUntukTipe(tipe) === siklus,
    );
    if (!punyaSumber) {
      hasil[siklus] = "belum-tersedia";
    } else {
      hasil[siklus] = gagal ? "gagal" : "tersedia";
    }
  }

  return hasil;
}

export function hitungKartu(
  antrean: readonly TindakanAntrean[],
  sumber: Readonly<Record<SiklusDashboard, StatusSumber>>,
): KartuSiklus[] {
  return SIKLUS_DASHBOARD.map((siklus) => {
    const status = sumber[siklus] ?? "belum-tersedia";
    if (status !== "tersedia") {
      return { siklus, status, jumlah: null };
    }

    const dokumen = new Set(
      antrean
        .filter((item) => item.siklus === siklus)
        .map((item) => item.dokumenId),
    );
    return { siklus, status, jumlah: dokumen.size };
  });
}
