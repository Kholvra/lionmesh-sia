"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowIcon } from "@/components/ui/arrow-icon";
import { useProduksiActor } from "../context/actor-context";
import { ProduksiSubnav } from "../components/produksi-subnav";
import { BomItem, INITIAL_BOM_LIST } from "./types";

const STORAGE_KEY = "lionmesh_bom_list_v1";

export function BomProdukScreen() {
  const [bomList] = useState<BomItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as BomItem[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch {
        // Abaikan jika error membaca storage
      }
    }
    return INITIAL_BOM_LIST;
  });
  const [searchQuery, setSearchQuery] = useState("");
  const { can, activeRole } = useProduksiActor();
  const canEdit = can("create_bom_version");

  const filteredBom = bomList.filter((item) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      item.produkNama.toLowerCase().includes(q) ||
      item.produkKode.toLowerCase().includes(q) ||
      item.komponenNama.toLowerCase().includes(q)
    );
  });

  const formatKomponenPerLembar = (item: BomItem) => {
    const formattedKg = item.jumlahPerLembarKg.toLocaleString("id-ID", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    });
    return `${formattedKg} kg ${item.komponenNama.toLowerCase()}`;
  };

  return (
    <div className="w-full text-[#172335] animate-fade-in">
      <ProduksiSubnav />

      {/* Breadcrumb */}
      <nav className="text-xs font-medium text-[#526174]">
        <Link
          href="/produksi"
          className="text-[#C96A00] underline decoration-[#C96A00]/60 underline-offset-2 hover:text-[#E88A06]"
        >
          Siklus Produksi
        </Link>
        <span className="mx-1.5">/</span>
        <span>PR-001 Mengelola BOM berversi</span>
      </nav>

      {/* Page Heading */}
      <h1 className="mt-2 text-[28px] leading-tight font-bold tracking-tight text-[#172335]">
        Data produksi
      </h1>
      <p className="mt-1.5 text-[13px] text-[#526174]">
        Resep bahan per produk. Setiap perubahan dibuat sebagai versi baru; versi lama tetap
        tersimpan dan perintah produksi memakai versi yang dipilih saat dibuat.
      </p>

      {/* Primary Action Button */}
      <div className="mt-5">
        <Link
          href="/produksi/bom-produk/versi-baru?mode=new"
          className="inline-flex items-center rounded-[8px] bg-[#E88A06] px-4 py-2.5 text-[13px] font-semibold text-white shadow-2xs transition-all duration-150 ease-out hover:bg-[#D17B05] active:scale-[0.98]"
        >
          Buat BOM
        </Link>
      </div>

      {/* Main Table Card */}
      <section className="shadow-card mt-5 flex flex-col gap-[14px] rounded-[10px] border border-transparent bg-white p-[20px] transition-all duration-150 ease-out hover:shadow-md">
        <h2 className="text-[15px] leading-none font-semibold text-[#172335]">
          BOM per produk
        </h2>

        {/* Search Input */}
        <div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kode atau nama"
            className="w-full max-w-[300px] rounded-[8px] border border-[#E5E7EB] bg-white px-3.5 py-2 text-[13px] text-[#172335] placeholder-[#94A3B8] transition outline-none focus:border-[#E88A06] focus:ring-2 focus:ring-[#E88A06]/15"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="h-[38px] bg-[#F1F2F4] text-[12px] leading-tight font-semibold text-[#4b5563]">
                <th className="rounded-l-[6px] px-[12px] py-[10px]">Produk</th>
                <th className="px-[12px] py-[10px]">Versi berlaku</th>
                <th className="px-[12px] py-[10px]">Berlaku dari</th>
                <th className="px-[12px] py-[10px]">
                  Toleransi scrap ·<br />
                  reject
                </th>
                <th className="px-[12px] py-[10px]">Komponen per lembar</th>
                <th className="rounded-r-[6px] px-[12px] py-[10px]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBom.map((item) => (
                <tr key={item.id} className="transition-colors hover:bg-slate-50/70">
                  <td className="px-[12px] py-4">
                    <p className="text-[13px] leading-none font-semibold text-[#172335]">
                      {item.produkNama}
                    </p>
                    <p className="mt-1.5 text-[12px] leading-none font-normal text-[#526174]">
                      {item.produkKode}
                    </p>
                  </td>
                  <td className="px-[12px] py-4 text-[13px] font-medium text-[#172335]">
                    v{item.versiNumber}
                  </td>
                  <td className="px-[12px] py-4 text-[13px] text-[#172335]">
                    {item.berlakuDari}
                  </td>
                  <td className="px-[12px] py-4 text-[13px] text-[#172335] tabular-nums">
                    <span className="inline-grid grid-cols-[36px_14px_36px] items-center">
                      <span>{item.toleransiScrap}</span>
                      <span className="text-center text-[#526174]">·</span>
                      <span>{item.toleransiReject}</span>
                    </span>
                  </td>
                  <td className="px-[12px] py-4 text-[13px] text-[#172335]">
                    {formatKomponenPerLembar(item)}
                  </td>
                  <td className="px-[12px] py-4 text-right">
                    {canEdit ? (
                      <Link
                        href={`/produksi/bom-produk/versi-baru?kode=${encodeURIComponent(
                          item.produkKode
                        )}`}
                        className="group inline-flex flex-col items-start text-left text-[12px] leading-tight font-semibold text-[#C96A00] transition hover:text-[#E88A06] hover:underline"
                      >
                        <span>Buat versi</span>
                        <span className="inline-flex items-center gap-1">
                          <span>baru</span>
                          <ArrowIcon className="transition-transform duration-150 group-hover:translate-x-0.5" />
                        </span>
                      </Link>
                    ) : (
                      <span
                        className="inline-flex items-center rounded-[6px] bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-500"
                        title="Hanya peran Produksi yang dapat membuat versi baru. Peran Anda saat ini hanya memiliki hak baca."
                      >
                        Hanya baca ({activeRole})
                      </span>
                    )}
                  </td>
                </tr>
              ))}

              {filteredBom.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-[12px] py-8 text-center text-[13px] text-[#526174]"
                  >
                    Tidak ada produk BOM yang cocok dengan pencarian “{searchQuery}”.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
