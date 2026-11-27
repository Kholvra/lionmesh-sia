"use client";

import { useParams } from "next/navigation";
import { Suspense, useMemo } from "react";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { SpkStepper } from "@/components/ui/spk-stepper";
import { EmptyState, LoadingState } from "@/components/ui/states";
import { useTableState } from "@/components/ui/use-table-state";
import { bacaHasilTercatat } from "@/modules/produksi/store";


function RiwayatHasilSpkContent({ initialNomorSpk }: { initialNomorSpk?: string }) {
  const params = useParams<{ nomorSpk: string }>();

  const nomorSpkSlug = useMemo(() => {
    return (initialNomorSpk ?? params?.nomorSpk ?? "spk-2611-013").toLowerCase();
  }, [initialNomorSpk, params?.nomorSpk]);

  const summary = useMemo(() => {
    const saved = bacaHasilTercatat(nomorSpkSlug);
    if (!saved) return null;
    return {
      ...saved,
      selesaiPada: saved.selesaiPada
        .replace("November 2026 · ", "Nov ")
        .replace("November 2026 ", "Nov "),
    };
  }, [nomorSpkSlug]);

  const riwayatRows = useMemo(
    () =>
      summary
        ? [
            {
              waktu: summary.selesaiPada,
              kejadian: `Hasil ${summary.jumlahJadi} lembar dicatat`,
              oleh: "Produksi",
            },
          ]
        : [],
    [summary],
  );
  const tabel = useTableState(riwayatRows, {
    pageSize: riwayatRows.length || 1,
  });

  return (
    <div className="w-full text-[#172335] animate-fade-in">
      <PageHeader
        title={summary?.nomorSpk ?? nomorSpkSlug.toUpperCase()}
        variant="cycle"
      />

      {summary && (
        <Notice
          title={`Hasil ${summary.nomorSpk} tercatat`}
          tone="success"
          variant="card"
        >
          <p className="mt-0.5 text-[12px]">
            {summary.jumlahJadi} lembar {summary.produkNama} menunggu
            pemeriksaan QC. Scrap {summary.scrapText} dicatat untuk
            perhitungan biaya.
          </p>
        </Notice>
      )}

      <SpkStepper activeStep={4} />

      {/* Card Riwayat */}
      <section className="shadow-card mt-4 flex flex-col gap-[14px] rounded-[10px] border border-transparent bg-white p-[20px]">
        <h2 className="text-[15px] leading-none font-semibold text-[#172335]">
          Riwayat
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-[#F3F4F6] text-[12px] font-semibold text-[#526174]">
                <th className="w-[220px] rounded-l-[6px] px-[12px] py-2.5">
                  Waktu
                </th>
                <th className="px-[12px] py-2.5">Kejadian</th>
                <th className="w-[240px] rounded-r-[6px] px-[12px] py-2.5">
                  Oleh
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]/80">
                {tabel.visibleRows.map((row, index) => (
                <tr
                  key={index}
                  className="transition-colors hover:bg-slate-50/70"
                >
                  <td className="px-[12px] py-4 text-[13px] text-[#172335] tabular-nums">
                    {row.waktu}
                  </td>
                  <td className="px-[12px] py-4 text-[13px] text-[#172335]">
                    {row.kejadian}
                  </td>
                  <td className="px-[12px] py-4 text-[13px] text-[#172335]">
                    {row.oleh}
                  </td>
                </tr>
              ))}
              {tabel.isEmpty && (
                <tr>
                  <td colSpan={3}>
                    <div className="py-8 text-center">
                      <EmptyState
                        judul="Belum ada hasil produksi yang dicatat untuk perintah ini."
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

export function RiwayatHasilSpkScreen({ nomorSpk }: { nomorSpk?: string }) {
  return (
    <Suspense fallback={<LoadingState judul="Memuat riwayat..." variant="inline" />}>
      <RiwayatHasilSpkContent initialNomorSpk={nomorSpk} />
    </Suspense>
  );
}
