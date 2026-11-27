"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import {
  STATUS_PERINTAH_PRODUKSI,
  StatusBadge,
} from "@/components/ui/status-badge";
import { TableActionLink } from "@/components/ui/table-action-link";
import { useTableState } from "@/components/ui/use-table-state";
import { bacaKoleksi } from "@/modules/produksi/store";
import { useProduksiActor } from "../context/actor-context";
import type { SpkFilterTab, SpkItem } from "./types";


export function PerintahProduksiScreen() {
  const [spkList] = useState<SpkItem[]>(() => bacaKoleksi("spk"));
  const { can, activeRole } = useProduksiActor();
  const canCreate = can("create_spk");

  const counts = useMemo(() => {
    return {
      semua: spkList.length,
      direncanakan: spkList.filter((s) => s.filterCategory === "direncanakan").length,
      menunggu_bahan: spkList.filter((s) => s.filterCategory === "menunggu_bahan").length,
      diproses: spkList.filter((s) => s.filterCategory === "diproses").length,
      hasil_dicatat: spkList.filter((s) => s.filterCategory === "hasil_dicatat").length,
    };
  }, [spkList]);

  const table = useTableState(spkList, {
    getFilterValue: (item) => item.filterCategory,
    initialFilterValue: "semua",
    matchAllFilterValue: "semua",
    pageSize: spkList.length || 1,
  });

  const tabs: { key: SpkFilterTab; label: string }[] = [
    { key: "semua", label: `Semua (${counts.semua})` },
    {
      key: "direncanakan",
      label:
        counts.direncanakan > 0
          ? `Direncanakan (${counts.direncanakan})`
          : "Direncanakan",
    },
    {
      key: "menunggu_bahan",
      label:
        counts.menunggu_bahan > 0
          ? `Menunggu bahan (${counts.menunggu_bahan})`
          : "Menunggu bahan",
    },
    {
      key: "diproses",
      label: counts.diproses > 0 ? `Diproses (${counts.diproses})` : "Diproses",
    },
    {
      key: "hasil_dicatat",
      label:
        counts.hasil_dicatat > 0
          ? `Hasil dicatat (${counts.hasil_dicatat})`
          : "Hasil dicatat",
    },
  ];

  return (
    <div className="w-full text-[#172335] animate-fade-in">
      <PageHeader
        description="Satu perintah produksi (SPK) untuk satu produk dan jadwal. Kebutuhan bahan dihitung dari data produksi."
        title="Perintah produksi"
        variant="cycle"
      />


      {/* Primary Action Button */}
      <div className="mt-5 flex items-center gap-3">
        {canCreate ? (
          <Link
            href="/produksi/perintah-produksi/tambah"
            className="inline-flex items-center justify-center rounded-[8px] bg-[#E88A06] px-4 py-2.5 text-[13px] font-semibold text-white shadow-2xs transition-all duration-150 ease-out hover:bg-[#D17B05] active:scale-[0.98]"
          >
            Tambah perintah produksi
          </Link>
        ) : (
          <div className="inline-flex items-center gap-2 rounded-[8px] border border-slate-200 bg-slate-100 px-3.5 py-2 text-[12px] text-slate-500">
            <span>Pembuatan SPK dibatasi hanya untuk peran <strong>Produksi</strong> (Aktor saat ini: {activeRole})</span>
          </div>
        )}
      </div>

      {/* Card Daftar Perintah Produksi */}
      <section className="shadow-card mt-5 flex flex-col gap-[14px] rounded-[10px] border border-transparent bg-white p-[20px] transition-all duration-150 ease-out hover:shadow-md">
        <h2 className="text-[15px] leading-none font-semibold text-[#172335]">
          Daftar perintah produksi
        </h2>

        <SegmentedTabs
          eased
          items={tabs}
          onValueChange={(key) => table.setFilterValue(key)}
          value={table.filterValue}
        />

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-[#F3F4F6] text-[12px] font-semibold text-[#526174]">
                <th className="rounded-l-[6px] px-[12px] py-2.5">Perintah</th>
                <th className="px-[12px] py-2.5">Produk</th>
                <th className="px-[12px] py-2.5">Jumlah</th>
                <th className="px-[12px] py-2.5">Jadwal</th>
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
                      {item.sumberInfo}
                    </p>
                  </td>
                  <td className="px-[12px] py-4 text-[13px] text-[#172335]">
                    {item.produkNama}
                  </td>
                  <td className="px-[12px] py-4 text-[13px] text-[#172335] tabular-nums">
                    {item.jumlahLembar.toLocaleString("id-ID")} lembar
                  </td>
                  <td className="px-[12px] py-4 text-[13px] text-[#172335] tabular-nums">
                    {item.jadwalText}
                  </td>
                  <td className="px-[12px] py-4">
                    <StatusBadge
                      status={item.status}
                      statuses={STATUS_PERINTAH_PRODUKSI}
                      variant="compact"
                    />
                  </td>
                  <td className="px-[12px] py-4 text-right">
                    <TableActionLink
                      href={`/produksi/perintah-produksi/${item.nomorSpk.toLowerCase()}`}
                    >
                      Lihat
                    </TableActionLink>
                  </td>
                </tr>
              ))}

              {table.isEmpty && (
                <tr>
                  <td colSpan={6}>
                  <div className="py-8 text-center">
                    <EmptyState
                      judul="Belum ada perintah produksi pada kategori ini."
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
