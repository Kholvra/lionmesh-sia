"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { ArrowIcon } from "@/components/ui/arrow-icon";
import { ProduksiSubnav } from "../components/produksi-subnav";
import {
  INITIAL_PR_LIST,
  PrFilterTab,
  PurchaseRequestItem,
} from "./types";

const PR_STORAGE_KEY = "lionmesh_pr_list_v1";

const DEFAULT_FALLBACK_PR: PurchaseRequestItem = {
  id: "pr-2611-010",
  nomorPr: "PR-2611-010",
  nomorSpk: "SPK-2611-013",
  produkLabel: "SPK-2611-013 · Wiremesh M6 · 120 lembar",
  bahanNama: "Wire rod 6 mm",
  bahanKode: "BB-WR06",
  jumlahDimintaTon: 1.1,
  dibutuhkanPalingLambat: "27 November 2026 · 07.00",
  status: "DIPERIKSA_PURCHASING",
  createdAtShort: "21 Nov 2026",
};

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

function renderPrStatusBadge(status: PurchaseRequestItem["status"]) {
  switch (status) {
    case "DIPERIKSA_PURCHASING":
      return (
        <span className="inline-flex items-center rounded-[6px] bg-[#FEF3C7] px-2.5 py-1 text-[11px] font-semibold text-[#B45309]">
          Diperiksa Purchasing
        </span>
      );
    case "MENUNGGU_PEMBELIAN":
      return (
        <span className="inline-flex items-center rounded-[6px] bg-[#FEF3C7] px-2.5 py-1 text-[11px] font-semibold text-[#B45309]">
          Menunggu pembelian · disetujui
        </span>
      );
    case "DIKELUARKAN":
      return (
        <span className="inline-flex items-center rounded-[6px] bg-[#DCFCE7] px-2.5 py-1 text-[11px] font-semibold text-[#15803D]">
          Dikeluarkan
        </span>
      );
  }
}

function DaftarPermintaanBahanContent() {
  const searchParams = useSearchParams();
  const submittedNomor = searchParams.get("submitted");
  const tabParam = searchParams.get("tab") as PrFilterTab | null;

  const [prList] = useState<PurchaseRequestItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const savedPr = sessionStorage.getItem(PR_STORAGE_KEY);
        if (savedPr) {
          const parsed = JSON.parse(savedPr) as PurchaseRequestItem[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
        if (INITIAL_PR_LIST.length > 0) {
          return INITIAL_PR_LIST;
        }
      } catch {
        // Abaikan
      }
    }
    return [DEFAULT_FALLBACK_PR];
  });
  const [activeTab, setActiveTab] = useState<PrFilterTab>(
    tabParam &&
      ["diperiksa_purchasing", "menunggu_pembelian", "dikeluarkan"].includes(
        tabParam
      )
      ? tabParam
      : "diperiksa_purchasing"
  );

  const justSubmittedItem = useMemo(() => {
    if (!submittedNomor || activeTab !== "diperiksa_purchasing") return null;
    return (
      prList.find(
        (item) => item.nomorPr.toLowerCase() === submittedNomor.toLowerCase()
      ) ?? DEFAULT_FALLBACK_PR
    );
  }, [prList, submittedNomor, activeTab]);

  const menungguPembelianItems = useMemo(() => {
    const explicitItems = prList.filter(
      (p) => p.status === "MENUNGGU_PEMBELIAN"
    );
    if (explicitItems.length > 0) return explicitItems;

    const baseItem = prList[0] ?? DEFAULT_FALLBACK_PR;
    return [
      {
        ...baseItem,
        status: "MENUNGGU_PEMBELIAN" as const,
      },
    ];
  }, [prList]);

  const counts = useMemo(() => {
    const diperiksaCount =
      activeTab === "menunggu_pembelian"
        ? 0
        : prList.filter((p) => p.status === "DIPERIKSA_PURCHASING").length;

    const menungguCount =
      activeTab === "menunggu_pembelian"
        ? menungguPembelianItems.length
        : prList.filter((p) => p.status === "MENUNGGU_PEMBELIAN").length;

    const dikeluarkanCount = prList.filter(
      (p) => p.status === "DIKELUARKAN"
    ).length;

    return {
      diperiksa_purchasing: diperiksaCount,
      menunggu_pembelian: menungguCount,
      dikeluarkan: dikeluarkanCount,
    };
  }, [prList, activeTab, menungguPembelianItems.length]);

  const filteredList = useMemo(() => {
    if (activeTab === "diperiksa_purchasing") {
      return prList.filter((item) => item.status === "DIPERIKSA_PURCHASING");
    }
    if (activeTab === "menunggu_pembelian") {
      return menungguPembelianItems;
    }
    return prList.filter((item) => item.status === "DIKELUARKAN");
  }, [prList, activeTab, menungguPembelianItems]);

  const featuredMenungguItem = menungguPembelianItems[0] ?? DEFAULT_FALLBACK_PR;

  const tabs: { key: PrFilterTab; label: string }[] = [
    {
      key: "diperiksa_purchasing",
      label: `Diperiksa Purchasing (${counts.diperiksa_purchasing})`,
    },
    {
      key: "menunggu_pembelian",
      label: `Menunggu pembelian (${counts.menunggu_pembelian})`,
    },
    {
      key: "dikeluarkan",
      label:
        counts.dikeluarkan > 0
          ? `Dikeluarkan (${counts.dikeluarkan})`
          : "Dikeluarkan",
    },
  ];

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
        <span>PR-003 Mengajukan pembelian bahan</span>
      </nav>

      {/* Header */}
      <h1 className="mt-1.5 text-[28px] leading-tight font-bold tracking-tight text-[#172335]">
        Permintaan bahan
      </h1>

      {/* Banner Sukses Diajukan ke Purchasing (Tab Diperiksa Purchasing) */}
      {justSubmittedItem && (
        <div className="shadow-card mt-4 rounded-[10px] border border-transparent bg-[#E6F4EA]/85 px-5 py-3 text-[#166534] animate-slide-down">
          <p className="text-[13px] font-semibold">
            {justSubmittedItem.nomorPr} diajukan ke Purchasing
          </p>
          <p className="mt-0.5 text-[12px]">
            Purchasing memeriksa, lalu Manajemen menyetujui. Jika ditolak,{" "}
            {justSubmittedItem.nomorSpk} dibatalkan dan perlu SPK baru.
          </p>
        </div>
      )}

      {/* Banner & Stepper saat tab Menunggu pembelian aktif */}
      {activeTab === "menunggu_pembelian" && featuredMenungguItem && (
        <>
          <div className="shadow-card mt-4 rounded-[10px] border border-transparent bg-[#FEF3C7]/85 px-5 py-3.5 animate-slide-down">
            <p className="text-[13px] font-semibold text-[#92400E]">
              {featuredMenungguItem.nomorSpk} menunggu pembelian
            </p>
            <p className="mt-0.5 text-[12px] text-[#B45309]">
              {featuredMenungguItem.nomorPr} (
              {featuredMenungguItem.jumlahDimintaTon.toLocaleString(
                "id-ID",
                {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                }
              )}{" "}
              ton) disetujui Manajemen 22 Nov. Gudang mengeluarkan bahan
              setelah wire rod diterima dan lolos QC; status SPK lalu menjadi
              Bahan siap.
            </p>
          </div>

          {/* Stepper Card */}
          <section className="shadow-card mt-4 rounded-[10px] border border-transparent bg-white px-5 py-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {SPK_STEPS.map((item, idx) => {
                const activeStep = 2;
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
        </>
      )}

      {/* Card Permintaan Saya */}
      <section className="shadow-card mt-4 flex flex-col gap-[14px] rounded-[10px] border border-transparent bg-white p-[20px]">
        <h2 className="text-[15px] leading-none font-semibold text-[#172335]">
          Permintaan saya
        </h2>

        {/* Segmented Filter Tabs */}
        <div>
          <div className="inline-flex flex-wrap items-center gap-1 rounded-[8px] bg-[#F1F5F9] p-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded-[6px] border px-3 py-1.5 text-[12px] transition-all duration-150 active:scale-[0.98] ${
                    isActive
                      ? "border-[#E5E7EB] bg-white font-semibold text-[#172335] shadow-2xs"
                      : "border-transparent font-medium text-[#526174] hover:text-[#172335]"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-[#F3F4F6] text-[12px] font-semibold text-[#526174]">
                <th className="rounded-l-[6px] px-[12px] py-2.5">
                  Permintaan
                </th>
                <th className="px-[12px] py-2.5">Perintah</th>
                <th className="px-[12px] py-2.5">Bahan</th>
                <th className="px-[12px] py-2.5">Status</th>
                <th className="rounded-r-[6px] px-[12px] py-2.5 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]/80">
              {filteredList.map((item) => (
                <tr
                  key={item.id}
                  className="transition-colors hover:bg-slate-50/70"
                >
                  <td className="px-[12px] py-4">
                    <p className="text-[13px] font-semibold text-[#172335]">
                      {item.nomorPr}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#526174]">
                      {item.createdAtShort}
                    </p>
                  </td>
                  <td className="px-[12px] py-4 text-[13px] text-[#172335]">
                    {item.nomorSpk}
                  </td>
                  <td className="px-[12px] py-4 text-[13px] text-[#172335] tabular-nums">
                    {item.bahanNama} ·{" "}
                    {item.jumlahDimintaTon.toLocaleString("id-ID", {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    })}{" "}
                    ton
                  </td>
                  <td className="px-[12px] py-4">
                    {renderPrStatusBadge(item.status)}
                  </td>
                  <td className="px-[12px] py-4 text-right">
                    <Link
                      href={`/produksi/perintah-produksi/${item.nomorSpk.toLowerCase()}`}
                      className="group inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#C96A00] hover:text-[#E88A06]"
                    >
                      <span>Lihat</span>
                      <ArrowIcon className="transition-transform duration-150 group-hover:translate-x-0.5" />
                    </Link>
                  </td>
                </tr>
              ))}

              {filteredList.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-[13px] text-[#526174]"
                  >
                    Belum ada permintaan bahan pada kategori ini.
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

export function DaftarPembelianBahanScreen() {
  return (
    <Suspense fallback={<div className="h-40 flex items-center justify-center text-sm text-[#526174]">Memuat daftar permintaan...</div>}>
      <DaftarPermintaanBahanContent />
    </Suspense>
  );
}
