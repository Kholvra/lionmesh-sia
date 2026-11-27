"use client";

import { useState } from "react";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/states";
import {
  STATUS_HASIL_PRODUKSI,
  StatusBadge,
} from "@/components/ui/status-badge";
import { TableActionLink } from "@/components/ui/table-action-link";
import { useTableState } from "@/components/ui/use-table-state";
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
  const table = useTableState(items, { pageSize: items.length || 1 });

  return (
    <div className="w-full text-[#172335] animate-fade-in">
      <ProduksiSubnav />

      <PageHeader
        breadcrumb={[
          { href: "/produksi", label: "Siklus Produksi" },
          "PR-005 Mencatat hasil produksi",
        ]}
        description="Catat hasil dan pemakaian bahan aktual setelah produksi selesai. Hasil diteruskan ke QC."
        title="Hasil produksi"
        variant="cycle"
      />

      <Notice
        className="mt-5"
        tone="warning"
        title="QC mengembalikan 2 lembar SPK-2611-013 untuk rework."
        variant="card"
      />

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
              {table.visibleRows.map((item) => (
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
                    <StatusBadge
                      status={item.status}
                      statuses={STATUS_HASIL_PRODUKSI}
                      variant="compact"
                    />
                  </td>
                  <td className="px-[12px] py-4 text-right">
                    <TableActionLink
                      href={`/produksi/hasil-produksi/${item.nomorSpk.toLowerCase()}`}
                    >
                      {item.status === "REWORK" ? "Lihat rework" : "Catat hasil"}
                    </TableActionLink>
                  </td>
                </tr>
              ))}

              {table.isEmpty && (
                <tr>
                  <td colSpan={6}>
                  <div className="py-8 text-center">
                    <EmptyState
                      judul="Belum ada SPK yang sedang diproses."
                      variant="inline"
                    />
                  </div>
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
