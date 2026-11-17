"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const MAIN_MENUS = [
  { label: "Dashboard Umum", href: "/dashboard" },
  { label: "Siklus Pendapatan", href: "/siklus-pendapatan" },
  { label: "Siklus Pengeluaran", href: "/siklus-pengeluaran" },
  { label: "Siklus Produksi", href: "/siklus-produksi", activeMatch: "/siklus-produksi" },
  { label: "Siklus Penggajian", href: "/siklus-penggajian" },
  { label: "Laporan", href: "/laporan" },
];

const SUB_MENUS_PRODUKSI = [
  { label: "Perencanaan & bahan", href: "/siklus-produksi/data-produksi" },
  { label: "Pembelian & penerimaan", href: "/siklus-produksi/pembelian" },
  { label: "Produksi & kualitas", href: "/siklus-produksi/proses" },
  { label: "Biaya & laporan", href: "/siklus-produksi/biaya" },
];

export function SidebarProduksi() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 shrink-0 flex-col justify-between bg-[#182026] px-4 py-6 text-slate-300">
      <div>
        {/* Brand Header */}
        <div className="px-2 pb-7">
          <div className="text-lg font-bold tracking-tight text-white">Lionmesh</div>
          <div className="mt-0.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
            SISTEM INFORMASI AKUNTANSI
          </div>
        </div>

        {/* Navigasi Utama */}
        <nav className="space-y-1">
          {MAIN_MENUS.map((item) => {
            const isActive =
              item.activeMatch ? pathname.startsWith(item.activeMatch) : pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#ED8B00] font-semibold text-slate-950 shadow-sm"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Sub-menu Modul Produksi */}
        <div className="mt-8">
          <div className="px-3.5 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            MODUL PRODUKSI
          </div>
          <nav className="space-y-1">
            {SUB_MENUS_PRODUKSI.map((sub) => {
              const isSubActive = pathname === sub.href;
              return (
                <Link
                  key={sub.href}
                  href={sub.href}
                  className={`block rounded-lg px-3.5 py-2 text-sm transition-colors ${
                    isSubActive
                      ? "font-semibold text-white"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {sub.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer Role & Logout */}
      <div className="border-t border-slate-700/80 pt-4">
        <div className="px-2">
          <div className="text-sm font-semibold text-white">Produksi</div>
          <div className="mt-0.5 text-xs text-slate-400">Akses sesuai hak pengguna</div>
          <Link
            href="/login"
            className="mt-4 inline-block text-sm font-medium text-slate-300 transition-colors hover:text-white"
          >
            Keluar dari SIA
          </Link>
        </div>
      </div>
    </aside>
  );
}