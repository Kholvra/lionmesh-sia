"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface SubnavItem {
  label: string;
  href: string;
}

const PRODUKSI_SUBNAV: SubnavItem[] = [
  { label: "Beranda", href: "/produksi" },
  { label: "BOM produk", href: "/produksi/bom-produk" },
  { label: "Perintah produksi", href: "/produksi/perintah-produksi" },
  { label: "Pembelian bahan", href: "/produksi/pembelian-bahan/daftar" },
  { label: "Hasil produksi", href: "/produksi/hasil-produksi" },
  { label: "Kartu jam kerja & HPP", href: "/produksi/kartu-jam-kerja" },
  { label: "Laporan & efisiensi", href: "/produksi/laporan" },
];

export function ProduksiSubnav() {
  const rawPathname = usePathname() ?? "";
  const pathname =
    rawPathname.length > 1 && rawPathname.endsWith("/")
      ? rawPathname.slice(0, -1)
      : rawPathname;

  return (
    <nav
      aria-label="Navigasi sub-modul produksi"
      className="mb-6 flex flex-wrap items-center gap-1.5 border-b border-[#E2E8F0] pb-2 text-[13px]"
    >
      {PRODUKSI_SUBNAV.map((item) => {
        const isBeranda = item.href === "/produksi";
        const isActive = isBeranda
          ? pathname === "/produksi"
          : pathname === item.href ||
            pathname.startsWith(`${item.href}/`) ||
            (item.href === "/produksi/pembelian-bahan/daftar" &&
              pathname.startsWith("/produksi/pembelian-bahan")) ||
            (item.href === "/produksi/kartu-jam-kerja" &&
              (pathname.startsWith("/produksi/kartu-jam-kerja") ||
                pathname.startsWith("/produksi/biaya-hpp")));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-[6px] px-3 py-1.5 font-medium transition-all duration-150 ease-out active:scale-[0.98] ${
              isActive
                ? "bg-[#ED8B00]/10 font-semibold text-[#B45309] shadow-2xs"
                : "text-[#526174] hover:bg-slate-100 hover:text-[#172335]"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
