import type { AksiDomain } from "@/lib/auth/permissions";

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
  /** False keeps a planned route from becoming a dead link. */
  tersedia: boolean;
  /** When set, only roles holding this action see the item. */
  aksi?: AksiDomain;
};

export type NavCycle = NavItem & {
  /** Stable accordion key; the cycle row itself never navigates. */
  id: string;
  children: readonly NavItem[];
};

/**
 * Cycle rows are accordion headers, so a cycle href is a route prefix used
 * for active-state matching — not a navigable landing entry (D-69).
 */
export const NAV_CYCLES: readonly NavCycle[] = [
  {
    id: "pendapatan",
    label: "Pendapatan",
    href: "/pendapatan",
    icon: "pendapatan",
    tersedia: false,
    children: [
      {
        label: "Pelanggan",
        href: "/pendapatan/pelanggan",
        icon: "pendapatan",
        tersedia: false,
      },
      {
        label: "Pesanan",
        href: "/pendapatan/pesanan",
        icon: "pendapatan",
        tersedia: false,
      },
      {
        label: "Faktur penjualan",
        href: "/pendapatan/faktur",
        icon: "pendapatan",
        tersedia: false,
      },
      {
        label: "Piutang",
        href: "/pendapatan/piutang",
        icon: "pendapatan",
        tersedia: false,
      },
      {
        label: "Pembayaran",
        href: "/pendapatan/pembayaran",
        icon: "pendapatan",
        tersedia: false,
      },
      {
        label: "Laporan pendapatan",
        href: "/pendapatan/laporan",
        icon: "laporan",
        tersedia: false,
      },
    ],
  },
  {
    id: "pengeluaran",
    label: "Pengeluaran",
    href: "/pengeluaran",
    icon: "pengeluaran",
    tersedia: true,
    children: [
      {
        label: "Pemasok",
        href: "/pengeluaran/pemasok",
        icon: "pengeluaran",
        tersedia: true,
      },
      {
        label: "Permintaan pembelian",
        href: "/pengeluaran/permintaan",
        icon: "pengeluaran",
        tersedia: true,
        aksi: "lihat_permintaan_pembelian",
      },
      {
        label: "Purchase Order (PO)",
        href: "/pengeluaran/po",
        icon: "pengeluaran",
        tersedia: false,
      },
      {
        label: "Penerimaan barang",
        href: "/pengeluaran/penerimaan",
        icon: "pengeluaran",
        tersedia: false,
      },
      {
        label: "Faktur pemasok",
        href: "/pengeluaran/faktur",
        icon: "pengeluaran",
        tersedia: false,
      },
      {
        label: "Pembayaran pemasok",
        href: "/pengeluaran/pembayaran",
        icon: "pengeluaran",
        tersedia: false,
      },
    ],
  },
  {
    id: "produksi",
    label: "Produksi",
    href: "/produksi",
    icon: "produksi",
    tersedia: true,
    children: [
      {
        label: "BOM produk",
        href: "/produksi/bom-produk",
        icon: "produksi",
        tersedia: true,
        aksi: "lihat_bom",
      },
      {
        label: "Perintah produksi",
        href: "/produksi/perintah-produksi",
        icon: "produksi",
        tersedia: true,
        aksi: "lihat_perintah_produksi",
      },
      {
        label: "Pembelian bahan",
        href: "/produksi/pembelian-bahan/daftar",
        icon: "produksi",
        tersedia: true,
      },
      {
        label: "Hasil produksi",
        href: "/produksi/hasil-produksi",
        icon: "produksi",
        tersedia: true,
      },
      {
        label: "Kartu jam kerja & HPP",
        href: "/produksi/kartu-jam-kerja",
        icon: "produksi",
        tersedia: true,
      },
      {
        label: "Laporan & efisiensi",
        href: "/produksi/laporan",
        icon: "laporan",
        tersedia: true,
        aksi: "lihat_laporan_produksi",
      },
    ],
  },
  {
    id: "penggajian",
    label: "Penggajian",
    href: "/penggajian",
    icon: "penggajian",
    tersedia: true,
    children: [
      {
        label: "Karyawan",
        href: "/penggajian/karyawan",
        icon: "penggajian",
        tersedia: true,
        aksi: "baca_data_karyawan",
      },
      {
        label: "Presensi & lembur",
        href: "/penggajian/presensi",
        icon: "penggajian",
        tersedia: false,
      },
      {
        label: "Periode gaji",
        href: "/penggajian/periode",
        icon: "periode",
        tersedia: false,
      },
      {
        label: "Hitung gaji",
        href: "/penggajian/hitung",
        icon: "penggajian",
        tersedia: false,
      },
      {
        label: "Daftar gaji",
        href: "/penggajian/daftar-gaji",
        icon: "penggajian",
        tersedia: false,
      },
      {
        label: "Pembayaran gaji",
        href: "/penggajian/pembayaran",
        icon: "penggajian",
        tersedia: false,
      },
      {
        label: "Laporan penggajian",
        href: "/penggajian/laporan",
        icon: "laporan",
        tersedia: false,
      },
    ],
  },
  {
    id: "laporan",
    label: "Laporan",
    href: "/laporan",
    icon: "laporan",
    tersedia: true,
    aksi: "lihat_laporan_keuangan",
    children: [
      {
        label: "Semua laporan",
        href: "/laporan",
        icon: "laporan",
        tersedia: true,
        aksi: "lihat_laporan_keuangan",
      },
      {
        label: "Buku besar",
        href: "/laporan/buku-besar",
        icon: "laporan",
        tersedia: true,
        aksi: "lihat_laporan_keuangan",
      },
      {
        label: "Neraca saldo",
        href: "/laporan/neraca-saldo",
        icon: "laporan",
        tersedia: true,
        aksi: "lihat_laporan_keuangan",
      },
      {
        label: "Laba rugi",
        href: "/laporan/laba-rugi",
        icon: "laporan",
        tersedia: true,
        aksi: "lihat_laporan_keuangan",
      },
      {
        label: "Neraca",
        href: "/laporan/neraca",
        icon: "laporan",
        tersedia: true,
        aksi: "lihat_laporan_keuangan",
      },
      {
        label: "Daftar jurnal",
        href: "/laporan/daftar-jurnal",
        icon: "laporan",
        tersedia: true,
        aksi: "lihat_laporan_keuangan",
      },
      {
        label: "Arus kas",
        href: "/laporan/arus-kas",
        icon: "laporan",
        tersedia: true,
        aksi: "lihat_laporan_keuangan",
      },
      {
        label: "Kartu persediaan",
        href: "/laporan/kartu-persediaan",
        icon: "laporan",
        tersedia: true,
        aksi: "lihat_laporan_keuangan",
      },
    ],
  },
];

export const NAV_LEAVES: readonly NavItem[] = [
  { label: "Dashboard", href: "/", icon: "dashboard", tersedia: true },
  {
    label: "Periode akuntansi",
    href: "/laporan/periode",
    icon: "periode",
    tersedia: true,
    aksi: "tutup_periode",
  },
];

export const NAV_UTILITY: readonly NavItem[] = [
  { label: "Notifikasi", href: "/notifikasi", icon: "notifikasi", tersedia: true },
  { label: "Pengaturan", href: "/pengaturan", icon: "pengaturan", tersedia: true },
];

/** Alternate route prefixes that activate a child whose list href differs. */
export const NAV_ALIASES: Readonly<Record<string, readonly string[]>> = {
  "/produksi/pembelian-bahan/daftar": ["/produksi/pembelian-bahan"],
  "/produksi/kartu-jam-kerja": ["/produksi/biaya-hpp"],
};

export function cocokRute(pathname: string, href: string): boolean {
  const bersih =
    pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  if (href === "/") return bersih === "/";
  return bersih === href || bersih.startsWith(`${href}/`);
}

/** Longest match wins: exact child href, then alias prefix, then cycle prefix. */
export function bobotCocokRute(pathname: string, href: string): number {
  if (cocokRute(pathname, href)) return href.length;
  const alias = NAV_ALIASES[href]?.find((prefiks) => cocokRute(pathname, prefiks));
  return alias ? alias.length : 0;
}
