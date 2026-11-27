"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { ArrowIcon } from "@/components/ui/arrow-icon";
import { BomItem, INITIAL_BOM_LIST } from "../bom-produk/types";
import { ProduksiSubnav } from "../components/produksi-subnav";
import {
  INITIAL_SPK_LIST,
  SpkItem,
  SpkStatusType,
  STOK_BAHAN_TERSEDIA_TON,
} from "./types";

const SPK_STORAGE_KEY = "lionmesh_spk_list_v1";
const BOM_STORAGE_KEY = "lionmesh_bom_list_v1";

const BULAN_LENGKAP_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

function formatJadwalLengkap(mulaiISO: string, selesaiISO: string, fallback: string): string {
  if (!mulaiISO || !selesaiISO) return fallback;
  const [y1, m1, d1] = mulaiISO.split("-").map(Number);
  const [y2, m2, d2] = selesaiISO.split("-").map(Number);
  if (!y1 || !m1 || !d1 || !y2 || !m2 || !d2) return fallback;
  if (y1 === y2 && m1 === m2) {
    return `${d1}–${d2} ${BULAN_LENGKAP_ID[m1 - 1]} ${y1}`;
  }
  return `${d1} ${BULAN_LENGKAP_ID[m1 - 1]}–${d2} ${BULAN_LENGKAP_ID[m2 - 1]} ${y2}`;
}

function parsePercent(val: string): number {
  const num = parseFloat(val.replace("%", "").replace(",", ".").trim());
  return Number.isFinite(num) ? num : 0;
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

function getActiveStepFromStatus(status: SpkStatusType): number {
  switch (status) {
    case "DIRENCANAKAN":
      return 1;
    case "MENUNGGU_BAHAN":
      return 2;
    case "DIPROSES":
      return 3;
    case "MENUNGGU_QC":
      return 5;
    case "BARANG_JADI":
      return 6;
    default:
      return 1;
  }
}

function DetailSpkContent({ initialNomorSpk }: { initialNomorSpk?: string }) {
  const params = useParams<{ nomorSpk: string }>();
  const searchParams = useSearchParams();
  const isJustSaved = searchParams.get("saved") === "1";

  const [spkList] = useState<SpkItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const savedSpk = sessionStorage.getItem(SPK_STORAGE_KEY);
        if (savedSpk) {
          const parsed = JSON.parse(savedSpk) as SpkItem[];
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {
        // Abaikan
      }
    }
    return INITIAL_SPK_LIST;
  });

  const [bomList] = useState<BomItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const savedBom = sessionStorage.getItem(BOM_STORAGE_KEY);
        if (savedBom) {
          const parsed = JSON.parse(savedBom) as BomItem[];
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {
        // Abaikan
      }
    }
    return INITIAL_BOM_LIST;
  });

  const currentSpk = useMemo<SpkItem>(() => {
    const slug = (initialNomorSpk ?? params?.nomorSpk ?? "spk-2611-013").toLowerCase();
    const found = spkList.find((item) => item.nomorSpk.toLowerCase() === slug);
    if (found) return found;

    // Fallback default SPK-2611-013
    return {
      id: "spk-2611-013",
      nomorSpk: "SPK-2611-013",
      sumberInfo: "dari SO-2611-015",
      produkNama: "Wiremesh M6",
      produkKode: "WM-M6",
      versiBom: "v2",
      mesin: "Mesin las 1",
      jumlahLembar: 120,
      jadwalText: "27–28 Nov",
      tanggalMulaiISO: "2026-11-27",
      tanggalSelesaiISO: "2026-11-28",
      status: "DIRENCANAKAN",
      filterCategory: "direncanakan",
    };
  }, [initialNomorSpk, params?.nomorSpk, spkList]);

  const relatedBom = useMemo(() => {
    return (
      bomList.find((b) => b.produkKode === currentSpk.produkKode) ??
      INITIAL_BOM_LIST[0]
    );
  }, [bomList, currentSpk.produkKode]);

  const kebutuhanBahan = useMemo(() => {
    const perLembarKg = relatedBom.jumlahPerLembarKg;
    const scrapPct = parsePercent(relatedBom.toleransiScrap);
    const totalKg = currentSpk.jumlahLembar * perLembarKg * (1 + scrapPct / 100);
    const totalTon = totalKg / 1000;
    const tersediaTon = STOK_BAHAN_TERSEDIA_TON[relatedBom.komponenKode] ?? 3.2;

    return {
      perLembarText: `${perLembarKg.toLocaleString("id-ID", {
        minimumFractionDigits: 1,
      })} kg + scrap ${relatedBom.toleransiScrap}`,
      totalTonText: `${totalTon.toLocaleString("id-ID", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })} ton`,
      tersediaTonText: `${tersediaTon.toLocaleString("id-ID", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })} ton`,
    };
  }, [currentSpk.jumlahLembar, relatedBom]);

  const activeStep = getActiveStepFromStatus(currentSpk.status);
  const jadwalLengkap = formatJadwalLengkap(
    currentSpk.tanggalMulaiISO,
    currentSpk.tanggalSelesaiISO,
    currentSpk.jadwalText
  );

  const versiBomKeterangan =
    currentSpk.sumberInfo === "dari SO-2611-015"
      ? `${currentSpk.versiBom} · untuk SO-2611-015 PT Graha Konstruksi`
      : `${currentSpk.versiBom} · ${currentSpk.sumberInfo}`;

  return (
    <div className="w-full text-[#172335] animate-fade-in">
      <ProduksiSubnav />

      {/* Back Link */}
      <Link
        href="/produksi/perintah-produksi"
        className="group inline-flex items-center gap-1.5 text-xs font-semibold text-[#C96A00] hover:text-[#E88A06]"
      >
        <ArrowIcon
          direction="left"
          className="transition-transform duration-150 group-hover:-translate-x-0.5"
        />
        <span>Perintah produksi</span>
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
        <span>PR-002 Membuat perintah produksi</span>
      </nav>

      {/* Page Title */}
      <h1 className="mt-1.5 text-[28px] leading-tight font-bold tracking-tight text-[#172335]">
        {currentSpk.nomorSpk}
      </h1>

      {/* Banner Tersimpan */}
      {isJustSaved && (
        <div className="shadow-card mt-4 rounded-[10px] border border-transparent bg-[#E6F4EA]/85 px-5 py-3 text-[#166534] animate-slide-down">
          <p className="text-[13px] font-semibold">
            {currentSpk.nomorSpk} tersimpan
          </p>
          <p className="mt-0.5 text-[12px]">
            Status Direncanakan. SPK masuk daftar Gudang untuk dicek bahannya.
          </p>
        </div>
      )}

      {/* Stepper Card (6 Tahap SPK) */}
      <section className="shadow-card mt-4 rounded-[10px] border border-transparent bg-white px-5 py-3.5 transition-shadow duration-150 hover:shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {SPK_STEPS.map((item, idx) => {
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
                    {item.step}
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
                  <div className="hidden h-[2px] w-[56px] shrink-0 bg-[#CBD5E1] lg:block xl:w-[80px]" />
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Card 1: Perintah produksi */}
      <section className="shadow-card mt-4 rounded-[10px] border border-transparent bg-white p-5">
        <h2 className="text-[15px] font-semibold text-[#172335]">
          Perintah produksi
        </h2>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <p className="text-[11px] font-medium text-[#526174]">Produk</p>
            <p className="mt-1 text-[13px] font-medium text-[#172335]">
              {currentSpk.produkNama} ·{" "}
              {currentSpk.jumlahLembar.toLocaleString("id-ID")} lembar
            </p>
          </div>

          <div>
            <p className="text-[11px] font-medium text-[#526174]">Jadwal</p>
            <p className="mt-1 text-[13px] font-medium text-[#172335]">
              {jadwalLengkap} · {currentSpk.mesin ?? "Mesin las 1"}
            </p>
          </div>

          <div>
            <p className="text-[11px] font-medium text-[#526174]">Versi BOM</p>
            <p className="mt-1 text-[13px] font-medium text-[#172335]">
              {versiBomKeterangan}
            </p>
          </div>
        </div>
      </section>

      {/* Card 2: Kebutuhan bahan (otomatis) */}
      <section className="shadow-card mt-4 flex flex-col gap-[14px] rounded-[10px] border border-transparent bg-white p-5">
        <h2 className="text-[15px] leading-none font-semibold text-[#172335]">
          Kebutuhan bahan (otomatis)
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-[#F3F4F6] text-[12px] font-semibold text-[#526174]">
                <th className="rounded-l-[6px] px-[12px] py-2.5">Bahan</th>
                <th className="px-[12px] py-2.5">Per lembar</th>
                <th className="px-[12px] py-2.5">Total</th>
                <th className="rounded-r-[6px] px-[12px] py-2.5">Tersedia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]/80">
              <tr>
                <td className="px-[12px] py-3.5 text-[13px] text-[#172335]">
                  {relatedBom.komponenNama} · {relatedBom.komponenKode}
                </td>
                <td className="px-[12px] py-3.5 text-[13px] text-[#172335] tabular-nums">
                  {kebutuhanBahan.perLembarText}
                </td>
                <td className="px-[12px] py-3.5 text-[13px] font-medium text-[#172335] tabular-nums">
                  {kebutuhanBahan.totalTonText}
                </td>
                <td className="px-[12px] py-3.5 text-[13px] text-[#172335] tabular-nums">
                  {kebutuhanBahan.tersediaTonText}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Primary Action Button */}
      <div className="mt-5">
        <Link
          href={`/produksi/pembelian-bahan?spk=${currentSpk.nomorSpk.toLowerCase()}`}
          className="inline-flex items-center justify-center rounded-[8px] bg-[#E88A06] px-4 py-2.5 text-[13px] font-semibold text-white shadow-2xs transition-all duration-150 ease-out hover:bg-[#D17B05] active:scale-[0.98]"
        >
          Lihat status bahan
        </Link>
      </div>
    </div>
  );
}

export function DetailSpkScreen({ nomorSpk }: { nomorSpk?: string }) {
  return (
    <Suspense fallback={<div className="h-40 flex items-center justify-center text-sm text-[#526174]">Memuat data SPK...</div>}>
      <DetailSpkContent initialNomorSpk={nomorSpk} />
    </Suspense>
  );
}
