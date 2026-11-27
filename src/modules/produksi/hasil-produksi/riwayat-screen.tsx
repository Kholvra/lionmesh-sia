"use client";

import { useParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { SpkStepper } from "@/components/ui/spk-stepper";
import { LoadingState } from "@/components/ui/states";
import { useTableState } from "@/components/ui/use-table-state";
import { ProduksiSubnav } from "../components/produksi-subnav";

interface RecordedSummary {
  nomorSpk: string;
  produkNama: string;
  jumlahJadi: number;
  scrapText: string;
  selesaiPada: string;
}


function RiwayatHasilSpkContent({ initialNomorSpk }: { initialNomorSpk?: string }) {
  const params = useParams<{ nomorSpk: string }>();

  const nomorSpkSlug = useMemo(() => {
    return (initialNomorSpk ?? params?.nomorSpk ?? "spk-2611-013").toLowerCase();
  }, [initialNomorSpk, params?.nomorSpk]);

  const [summary] = useState<RecordedSummary>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem(
          `lionmesh_hasil_recorded_${nomorSpkSlug}`
        );
        if (saved) {
          const parsed = JSON.parse(saved) as RecordedSummary;
          if (parsed && parsed.nomorSpk) {
            return {
              ...parsed,
              selesaiPada: parsed.selesaiPada
                .replace("November 2026 · ", "Nov ")
                .replace("November 2026 ", "Nov "),
            };
          }
        }
      } catch {
        // Abaikan
      }
    }
    return {
      nomorSpk: nomorSpkSlug.toUpperCase(),
      produkNama: "Wiremesh M6",
      jumlahJadi: 120,
      scrapText: "0,08 ton",
      selesaiPada: "28 Nov 15.30",
    };
  });

  const riwayatRows = useMemo(
    () => [
      {
        waktu: summary.selesaiPada,
        kejadian: `Hasil ${summary.jumlahJadi} lembar dicatat`,
        oleh: "Produksi · Bayu",
      },
      {
        waktu: "27 Nov 06.40",
        kejadian: "Bahan 4,3 ton diterima dari Gudang",
        oleh: "Gudang · Sari",
      },
      {
        waktu: "21 Nov 09.10",
        kejadian: "Cek bahan: kurang 1,1 ton; PR-2611-010 diajukan",
        oleh: "Produksi · Bayu",
      },
      {
        waktu: "21 Nov 08.00",
        kejadian: "SPK dibuat",
        oleh: "Produksi · Bayu",
      },
    ],
    [summary.jumlahJadi, summary.selesaiPada]
  );
  const tabel = useTableState(riwayatRows, {
    pageSize: riwayatRows.length || 1,
  });

  return (
    <div className="w-full text-[#172335] animate-fade-in">
      <ProduksiSubnav />

      <PageHeader
        back={{ href: "/produksi/hasil-produksi", label: "Hasil produksi" }}
        breadcrumb={[
          { href: "/produksi", label: "Siklus Produksi" },
          "PR-004 Mencatat hasil dan pemakaian bahan",
        ]}
        title={summary.nomorSpk}
        variant="cycle"
      />

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
