/*
 * Status history rows (riwayat_status, D-08). Core dokumen owns the real
 * table; until it exists the payroll stores append rows through this helper
 * so every transition keeps actor, time, reason, and before/after status.
 */
export type RiwayatStatus = {
  id: string;
  dari: string | null;
  ke: string;
  oleh: string;
  pada: string;
  alasan?: string;
};

export function catatRiwayat(
  riwayat: RiwayatStatus[],
  entri: Omit<RiwayatStatus, "id">,
): void {
  riwayat.push({ id: crypto.randomUUID(), ...entri });
}
