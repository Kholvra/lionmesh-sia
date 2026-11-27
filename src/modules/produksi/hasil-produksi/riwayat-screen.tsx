"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { ArrowIcon } from "@/components/ui/arrow-icon";
import { ProduksiSubnav } from "../components/produksi-subnav";

interface RecordedSummary {
  nomorSpk: string;
  produkNama: string;
  jumlahJadi: number;
  scrapText: string;
  selesaiPada: string;
}

interface StepDefinition {
  step: number;
  title: string;
  actor: string;
}

const SPK_STEPS: StepDefinition[] = [
  { step: 1, title: "Direncanakan", actor: "Produksi" },
  { step: 2, title: "Cek bahan", actor: "Gudang" },
  { step: 3, title: "Berjalan", actor: "Gudang · Produksi" },
  { step: 4, title: "Hasil dicatat", actor: "Produksi" },
  { step: 5, title: "QC lulus", actor: "QC" },
  { step: 6, title: "Selesai", actor: "Gudang" },
];

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

  return (
    <div className="w-full text-[#172335] animate-fade-in">
      <ProduksiSubnav />

      {/* Back Link */}
      <Link
        href="/produksi/hasil-produksi"
        className="group inline-flex items-center gap-1.5 text-xs font-semibold text-[#C96A00] hover:text-[#E88A06]"
      >
        <ArrowIcon
          direction="left"
          className="transition-transform duration-150 group-hover:-translate-x-0.5"
        />
        <span>Hasil produksi</span>
      </Link>

      {/* Breadcrumb */}
      <nav className="mt-2 text-xs font-medium text-[#526174]">
        <Link
          href="/produksi"
          className="text-[#C96A00] underline decoration-[#C96A00]/60 underline-offset-2 hover:text-[#E88A06]"
        >
          Siklus Produksi
        </Link>
        <span className="mx-1.5">/</span>
        <span>PR-004 Mencatat hasil dan pemakaian bahan</span>
      </nav>

      {/* Page Title */}
      <h1 className="mt-1.5 text-[28px] leading-tight font-bold tracking-tight text-[#172335]">
        {summary.nomorSpk}
      </h1>

      {/* Banner Sukses Hasil Tercatat */}
      <div className="shadow-card mt-4 rounded-[10px] border border-transparent bg-[#DCFCE7]/85 px-5 py-3.5 text-[#15803D] animate-slide-down">
        <p className="text-[13px] font-semibold">
          Hasil {summary.nomorSpk} tercatat
        </p>
        <p className="mt-0.5 text-[12px]">
          {summary.jumlahJadi} lembar {summary.produkNama} menunggu
          pemeriksaan QC. Scrap {summary.scrapText} dicatat untuk
          perhitungan biaya.
        </p>
      </div>

      {/* Stepper Card */}
      <section className="shadow-card mt-4 rounded-[10px] border border-transparent bg-white px-5 py-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {SPK_STEPS.map((item, idx) => {
            const activeStep = 4;
            const isCurrent = item.step === activeStep;
            const isCompleted = item.step < activeStep;
            return (
              <div key={item.step} className="contents">
                <div className="flex shrink-0 items-center gap-2.5">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                      isCurrent
                        ? "bg-[#E88A06] text-white"
                        : isCompleted
                          ? "bg-[#DCFCE7] text-[#15803D]"
                          : "border border-[#94A3B8] bg-white text-[#526174]"
                    }`}
                  >
                    {isCompleted ? "✓" : item.step}
                  </span>
                  <div className="leading-tight whitespace-nowrap">
                    <p
                      className={`text-[12px] ${
                        isCurrent
                          ? "font-semibold text-[#172335]"
                          : "font-medium text-[#526174]"
                      }`}
                    >
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-[10px] text-[#94A3B8]">
                      {item.actor}
                    </p>
                  </div>
                </div>

                {idx < SPK_STEPS.length - 1 && (
                  <div
                    className={`hidden h-[2px] w-[56px] shrink-0 lg:block xl:w-[80px] ${
                      isCompleted ? "bg-[#86EFAC]" : "bg-[#CBD5E1]"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </section>

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
              {riwayatRows.map((row, index) => (
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
    <Suspense fallback={<div className="h-40 flex items-center justify-center text-sm text-[#526174]">Memuat riwayat...</div>}>
      <RiwayatHasilSpkContent initialNomorSpk={nomorSpk} />
    </Suspense>
  );
}
