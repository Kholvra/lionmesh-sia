import type { Peran } from "@/lib/auth/types";

export type NavIcon =
  | "dashboard"
  | "notifikasi"
  | "pendapatan"
  | "pengeluaran"
  | "produksi"
  | "penggajian"
  | "laporan"
  | "periode"
  | "pengaturan";

export type NavItem = {
  label: string;
  href: string;
  icon: NavIcon;
  /**
   * False while the route does not exist yet. A dead link teaches the user that
   * the app is broken, so the item is rendered as unavailable instead.
   */
  tersedia: boolean;
  /** When set, only these roles see the item. */
  peran?: readonly Peran[];
};

export const NAV_PRIMARY: NavItem[] = [
  { label: "Dashboard", href: "/", icon: "dashboard", tersedia: true },
  { label: "Pendapatan", href: "/pendapatan", icon: "pendapatan", tersedia: false },
  { label: "Pengeluaran", href: "/pengeluaran", icon: "pengeluaran", tersedia: false },
  { label: "Produksi", href: "/produksi", icon: "produksi", tersedia: false },
  { label: "Penggajian", href: "/penggajian", icon: "penggajian", tersedia: false },
  { label: "Laporan", href: "/laporan", icon: "laporan", tersedia: true },
  {
    label: "Periode akuntansi",
    href: "/laporan/periode",
    icon: "periode",
    tersedia: true,
    peran: ["Accounting"],
  },
];

export const NAV_UTILITY: NavItem[] = [
  { label: "Notifikasi", href: "/notifikasi", icon: "notifikasi", tersedia: true },
  { label: "Pengaturan", href: "/pengaturan", icon: "pengaturan", tersedia: true },
];

export function cocokRute(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
