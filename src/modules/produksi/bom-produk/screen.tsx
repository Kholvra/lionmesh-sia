"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { TableActionLink } from "@/components/ui/table-action-link";
import { useTableState } from "@/components/ui/use-table-state";
import { muatBomProduk } from "@/modules/produksi/queries";
import { useProduksiActor } from "../context/actor-context";
import type { BomItem } from "./types";

export function BomProdukScreen() {
  const [bomList, setBomList] = useState<BomItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { can, activeRole } = useProduksiActor();
  const canEdit = can("create_bom_version");

  useEffect(() => {
    let aktif = true;
    muatBomProduk().then((hasil) => {
      if (!aktif) return;
      if (hasil.ok) setBomList(hasil.data);
      else setError(hasil.message);
    });
    return () => {
      aktif = false;
    };
  }, []);

  const table = useTableState(bomList ?? [], {
    getFilterValues: (item: BomItem) => [
      item.produkNama,
      item.produkKode,
      item.komponenNama,
    ],
    pageSize: bomList?.length || 1,
  });

  const formatKomponenPerLembar = (item: BomItem) => {
    const formattedKg = item.jumlahPerLembarKg.toLocaleString("id-ID", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    });
    return `${formattedKg} kg ${item.komponenNama.toLowerCase()}`;
  };


  if (error) {
    return (
      <div className="w-full text-[#172335] animate-fade-in">
        <PageHeader title="Data produksi" variant="cycle" />
        <ErrorState judul="Data BOM tidak dapat dimuat." teks={error} variant="compact" />
      </div>
    );
  }

  if (!bomList) {
    return (
      <div className="w-full text-[#172335] animate-fade-in">
        <PageHeader title="Data produksi" variant="cycle" />
        <LoadingState judul="Memuat BOM..." variant="inline" />
      </div>
    );
  }
  return (
    <div className="w-full text-[#172335] animate-fade-in">
      <PageHeader
        description="Resep bahan per produk. Setiap perubahan dibuat sebagai versi baru; versi lama tetap tersimpan dan perintah produksi memakai versi yang dipilih saat dibuat."
        title="Data produksi"
        variant="cycle"
      />

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
            value={table.filterText}
            onChange={(e) => table.setFilterText(e.target.value)}
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
              {table.visibleRows.map((item) => (
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
                      <TableActionLink
                        className="flex-col items-start text-left leading-tight"
                        href={`/produksi/bom-produk/versi-baru?kode=${encodeURIComponent(
                          item.produkKode
                        )}`}
                      >
                        <span>Buat versi</span>
                        <span>baru</span>
                      </TableActionLink>
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

              {table.isEmpty && (
                <tr>
                  <td colSpan={6}>
                  <div className="py-8 text-center">
                    <EmptyState
                      judul={`Tidak ada produk BOM yang cocok dengan pencarian “${table.filterText}”.`}
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
