import type { SesiPenggajian } from "@/modules/penggajian/akun/akun";

/*
 * GJ-004 "Siapa boleh melihat" (P-13): HR and Accounting see every component,
 * Finance sees the net per employee for transfers, Direksi only the totals.
 */
export type AksesPayroll = { ringkasan: boolean; neto: boolean; rincian: boolean; hitung: boolean };

export function aksesPayroll(sesi: SesiPenggajian): AksesPayroll {
  const p = sesi.peran;
  const rincian = p === "HR" || p === "Accounting";
  const neto = rincian || p === "Finance";
  return { ringkasan: neto || p === "Direksi", neto, rincian, hitung: p === "HR" };
}
