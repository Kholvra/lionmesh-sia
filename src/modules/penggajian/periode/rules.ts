import { formatTanggal } from "@/modules/penggajian/karyawan/format";
import type { PeriodeGaji } from "@/modules/penggajian/periode/types";

const LABEL_STATUS: Record<PeriodeGaji["status"], string> = {
  TERBUKA: "Terbuka",
  REKAP: "Rekap",
  TERVALIDASI: "Tervalidasi",
};

export function rentangPeriode(periode: PeriodeGaji): string {
  return `${formatTanggal(periode.mulai)} sampai ${formatTanggal(periode.selesai)}`;
}

/**
 * PRE-02: entries only for a date inside an open period. The message names
 * the period and its status, and points closed periods to the HR correction.
 */
export function cekPeriodeTerbuka(tanggal: string, periode: PeriodeGaji | undefined): string | null {
  if (!periode) return `Tanggal ${formatTanggal(tanggal)} tidak masuk periode penggajian mana pun.`;
  if (periode.status !== "TERBUKA") {
    return `Periode ${periode.nama} berstatus ${LABEL_STATUS[periode.status]}. Entri baru ditolak; perubahan perlu otorisasi khusus Manajemen lewat koreksi periode oleh HR.`;
  }
  return null;
}

export function labelStatusPeriode(status: PeriodeGaji["status"]): string {
  return LABEL_STATUS[status];
}
