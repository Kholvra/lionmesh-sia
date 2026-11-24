export type NavIcon =
  | "dashboard"
  | "pendapatan"
  | "pengeluaran"
  | "produksi"
  | "penggajian"
  | "laporan"
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
};

export const NAV_PRIMARY: NavItem[] = [
  { label: "Dashboard", href: "/", icon: "dashboard", tersedia: true },
  { label: "Pendapatan", href: "/pendapatan", icon: "pendapatan", tersedia: true },
  { label: "Pengeluaran", href: "/pengeluaran", icon: "pengeluaran", tersedia: false },
  { label: "Produksi", href: "/produksi", icon: "produksi", tersedia: false },
  { label: "Penggajian", href: "/penggajian", icon: "penggajian", tersedia: false },
  { label: "Laporan", href: "/laporan", icon: "laporan", tersedia: false },
];

export const NAV_UTILITY: NavItem[] = [
  { label: "Pengaturan", href: "/pengaturan", icon: "pengaturan", tersedia: true },
];

export function cocokRute(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
