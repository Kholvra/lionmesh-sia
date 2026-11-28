"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { SpkStepper } from "@/components/ui/spk-stepper";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { useTableState } from "@/components/ui/use-table-state";
import { muatRiwayatHasil } from "@/modules/produksi/queries";
import type { RiwayatHasilData } from "./types";


function RiwayatHasilSpkContent({ initialNomorSpk }: { initialNomorSpk?: string }) {
  const [data, setData] = useState<RiwayatHasilData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dimuat, setDimuat] = useState(false);

  useEffect(() => {
    if (!initialNomorSpk) return;
    let aktif = true;
    muatRiwayatHasil(initialNomorSpk).then((hasil) => {
      if (!aktif) return;
      if (!hasil.ok) setError(hasil.message);
      else setData(hasil.data);
      setDimuat(true);
    });
    return () => {
      aktif = false;
    };
  }, [initialNomorSpk]);

  const summary = data;

  const riwayatRows = useMemo(
    () => summary?.kejadian ?? [],
    [summary],
  );
  const tabel = useTableState(riwayatRows, {
    pageSize: riwayatRows.length || 1,
  });


  if (error) {
    return (
      <div className="w-full text-[#172335] animate-fade-in">
        <ErrorState judul="Riwayat tidak dapat dimuat." teks={error} variant="compact" />
      </div>
    );
  }

  if (!dimuat) {
    return (
      <div className="w-full text-[#172335] animate-fade-in">
        <LoadingState judul="Memuat riwayat..." variant="inline" />
      </div>
    );
  }

  return (
    <div className="w-full text-[#172335] animate-fade-in">
      <PageHeader
        title={summary?.nomorSpk ?? initialNomorSpk?.toUpperCase() ?? "Riwayat hasil"}
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
