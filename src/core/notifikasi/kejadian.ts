/**
 * Kejadian pemicu notifikasi (PT-01, `[USULAN-AGEN]`). The list is the single
 * source of truth: modules pass one of these names to `kirimNotifikasi()`.
 */
export const JENIS_NOTIFIKASI = [
  "DOKUMEN_MENUNGGU_PERSETUJUAN",
  "PR_DISETUJUI",
  "PR_DITOLAK",
  "PAYROLL_DIVERIFIKASI",
  "PAYROLL_DISETUJUI",
  "PAYROLL_DIBAYAR",
] as const;

export type JenisNotifikasi = (typeof JENIS_NOTIFIKASI)[number];

export function isJenisNotifikasi(value: unknown): value is JenisNotifikasi {
  return (
    typeof value === "string" &&
    (JENIS_NOTIFIKASI as readonly string[]).includes(value)
  );
}
