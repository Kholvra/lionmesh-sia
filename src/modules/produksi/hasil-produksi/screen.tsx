"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowIcon } from "@/components/ui/arrow-icon";
import { ProduksiSubnav } from "../components/produksi-subnav";
import {
  HasilProduksiSpkItem,
  INITIAL_HASIL_PRODUKSI_LIST,
} from "./types";

const HASIL_PRODUKSI_STORAGE_KEY = "lionmesh_hasil_produksi_list_v1";

export function HasilProduksiScreen() {
  const [items] = useState<HasilProduksiSpkItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem(HASIL_PRODUKSI_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as HasilProduksiSpkItem[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch {
        // Abaikan jika sessionStorage tidak tersedia
      }
    }
    return INITIAL_HASIL_PRODUKSI_LIST;
  });

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
        <span>PR-005 Mencatat hasil produksi</span>
      </nav>

      {/* Header */}
      <h1 className="mt-1.5 text-[28px] leading-tight font-bold tracking-tight text-[#172335]">
        Hasil produksi
      </h1>
      <p className="mt-1.5 text-[13px] text-[#526174]">
        Catat hasil dan pemakaian bahan aktual setelah produksi selesai.
        Hasil diteruskan ke QC.
      </p>

      {/* Callout Banner Rework dari QC */}
      <div className="shadow-card mt-5 rounded-[10px] border border-transparent bg-[#FEF3C7]/85 px-5 py-3.5 animate-slide-down">
        <p className="text-[13px] font-semibold text-[#92400E]">
          QC mengembalikan 2 lembar SPK-2611-013 untuk rework.
        </p>
      </div>

      {/* Card Sedang diproses */}
      <section className="shadow-card mt-5 flex flex-col gap-[14px] rounded-[10px] border border-transparent bg-white p-[20px]">
        <h2 className="text-[15px] leading-none font-semibold text-[#172335]">
          Sedang diproses
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-[#F3F4F6] text-[12px] font-semibold text-[#526174]">
                <th className="rounded-l-[6px] px-[12px] py-2.5">
                  Perintah
                </th>
                <th className="px-[12px] py-2.5">Produk</th>
                <th className="px-[12px] py-2.5">Target</th>
                <th className="px-[12px] py-2.5">Bahan diterima</th>
                <th className="px-[12px] py-2.5">Status</th>
                <th className="rounded-r-[6px] px-[12px] py-2.5 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]/80">
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="transition-colors hover:bg-slate-50/70"
                >
                  <td className="px-[12px] py-4">
                    <p className="text-[13px] font-semibold text-[#172335]">
                      {item.nomorSpk}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#526174]">
                      {item.jadwalText}
                    </p>
                  </td>
                  <td className="px-[12px] py-4 text-[13px] text-[#172335]">
                    {item.produkNama}
                  </td>
                  <td className="px-[12px] py-4 text-[13px] text-[#172335] tabular-nums">
                    {item.targetLembar.toLocaleString("id-ID")} lembar
                  </td>
                  <td className="px-[12px] py-4 text-[13px] text-[#172335] tabular-nums">
                    {item.bahanDiterimaText}
                  </td>
                  <td className="px-[12px] py-4">
                    {item.status === "REWORK" ? (
                      <span className="inline-flex items-center rounded-[6px] bg-[#FEF3C7] px-2.5 py-1 text-[11px] font-semibold text-[#B45309]">
                        Rework
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-[6px] bg-[#DBEAFE] px-2.5 py-1 text-[11px] font-semibold text-[#1D4ED8]">
                        Diproses
                      </span>
                    )}
                  </td>
                  <td className="px-[12px] py-4 text-right">
                    <Link
                      href={`/produksi/hasil-produksi/${item.nomorSpk.toLowerCase()}`}
                      className="group inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#C96A00] hover:text-[#E88A06]"
                    >
                      <span>
                        {item.status === "REWORK"
                          ? "Lihat rework"
                          : "Catat hasil"}
                      </span>
                      <ArrowIcon className="transition-transform duration-150 group-hover:translate-x-0.5" />
                    </Link>
                  </td>
                </tr>
              ))}

              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-[13px] text-[#526174]"
                  >
                    Belum ada SPK yang sedang diproses.
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
