"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import {
  STATUS_HASIL_PRODUKSI,
  StatusBadge,
} from "@/components/ui/status-badge";
import { TableActionLink } from "@/components/ui/table-action-link";
import { useTableState } from "@/components/ui/use-table-state";
import { muatHasilList } from "@/modules/produksi/queries";
import type { HasilProduksiSpkItem } from "./types";
import { useProduksiActor } from "@/modules/produksi/context/actor-context";

export function HasilProduksiScreen() {
  const { can } = useProduksiActor();
  const [items, setItems] = useState<HasilProduksiSpkItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const table = useTableState(items ?? [], { pageSize: items?.length || 1 });

  useEffect(() => {
    let aktif = true;
    muatHasilList().then((hasil) => {
      if (!aktif) return;
      if (hasil.ok) setItems(hasil.data);
      else setError(hasil.message);
    });
    return () => {
      aktif = false;
    };
  }, []);

  if (error) {
    return (
      <div className="w-full text-[#172335] animate-fade-in">
        <PageHeader title="Hasil produksi" variant="cycle" />
        <ErrorState judul="Data hasil produksi tidak dapat dimuat." teks={error} variant="compact" />
      </div>
    );
  }

  if (!items) {
    return (
      <div className="w-full text-[#172335] animate-fade-in">
        <PageHeader title="Hasil produksi" variant="cycle" />
        <LoadingState judul="Memuat hasil produksi..." variant="inline" />
      </div>
    );
  }

  return (
    <div className="w-full text-[#172335] animate-fade-in">
      <PageHeader
        description="Catat hasil dan pemakaian bahan aktual setelah produksi selesai. Hasil diteruskan ke QC."
        title="Hasil produksi"
        variant="cycle"
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
                      {item.statusInti === "HASIL_DICATAT"
                        ? can("inspect_qc")
                          ? "Periksa QC"
                          : "Lihat hasil"
                        : item.statusInti === "QC_PASSED"
                          ? can("receive_finish_goods")
                            ? "Terima barang jadi"
                            : "Lihat hasil"
                          : item.status === "REWORK"
                            ? "Lihat rework"
                            : "Catat hasil"}
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
