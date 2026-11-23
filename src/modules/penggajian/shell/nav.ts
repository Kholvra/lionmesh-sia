import type { Peran } from "@/lib/auth/types";

export type ItemNav = {
  label: string;
  /** Missing href = the screen is not built yet; the item renders disabled. */
  href?: string;
};

export type GrupNav = {
  label: string | null;
  items: readonly ItemNav[];
};

const BERANDA: GrupNav = { label: null, items: [{ label: "Beranda" }] };
const UMUM: GrupNav = { label: "Umum", items: [{ label: "Laporan" }] };
const DATA_KARYAWAN: ItemNav = { label: "Data karyawan", href: "/penggajian/karyawan" };

/*
 * Temporary navigation for the payroll routes only, following the per-role
 * sidebar in the Figma prototype. The shared app shell replaces it.
 */
const NAV_PER_PERAN: Partial<Record<Peran, readonly GrupNav[]>> = {
  HR: [
    BERANDA,
    {
      label: "Penggajian",
      items: [
        DATA_KARYAWAN,
        { label: "Rekap & validasi" },
        { label: "Perhitungan gaji" },
        { label: "Slip gaji" },
        { label: "Impor presensi" },
        { label: "Presensi atas nama" },
      ],
    },
    UMUM,
  ],
  Accounting: [
    BERANDA,
    { label: "Penggajian", items: [DATA_KARYAWAN, { label: "Periksa payroll" }] },
    UMUM,
  ],
  Finance: [
    BERANDA,
    { label: "Penggajian", items: [DATA_KARYAWAN, { label: "Pembayaran gaji" }] },
    UMUM,
  ],
};

export const NAV_BAWAH: readonly ItemNav[] = [
  { label: "Notifikasi" },
  { label: "Pengaturan akun" },
];

export function navUntuk(peran: Peran | null): readonly GrupNav[] {
  return (peran && NAV_PER_PERAN[peran]) || [BERANDA, UMUM];
}
