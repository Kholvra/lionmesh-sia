"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowIcon } from "@/components/ui/arrow-icon";
import { useProduksiActor } from "../context/actor-context";
import { ProduksiSubnav } from "../components/produksi-subnav";
import {
  INITIAL_SPK_LIST,
  SpkFilterTab,
  SpkItem,
  SpkStatusType,
} from "./types";

const SPK_STORAGE_KEY = "lionmesh_spk_list_v1";

function renderStatusBadge(status: SpkStatusType) {
  switch (status) {
    case "MENUNGGU_QC":
      return (
        <span className="inline-flex items-center rounded-[6px] bg-[#FEF3C7] px-2.5 py-1 text-[11px] font-semibold text-[#B45309]">
          Menunggu QC
        </span>
      );
    case "BARANG_JADI":
      return (
        <span className="inline-flex items-center rounded-[6px] bg-[#DCFCE7] px-2.5 py-1 text-[11px] font-semibold text-[#15803D]">
          Barang jadi
        </span>
      );
    case "DIRENCANAKAN":
      return (
        <span className="inline-flex items-center rounded-[6px] bg-[#F1F5F9] px-2.5 py-1 text-[11px] font-semibold text-[#475569]">
          Direncanakan
        </span>
      );
    case "MENUNGGU_BAHAN":
      return (
        <span className="inline-flex items-center rounded-[6px] bg-[#DBEAFE] px-2.5 py-1 text-[11px] font-semibold text-[#1D4ED8]">
          Menunggu bahan
        </span>
      );
    case "DIPROSES":
      return (
        <span className="inline-flex items-center rounded-[6px] bg-[#FFEDD5] px-2.5 py-1 text-[11px] font-semibold text-[#C2410C]">
          Diproses
        </span>
      );
  }
}

export function PerintahProduksiScreen() {
  const [spkList] = useState<SpkItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem(SPK_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as SpkItem[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch {
        // Abaikan
      }
    }
    return INITIAL_SPK_LIST;
  });
  const [activeTab, setActiveTab] = useState<SpkFilterTab>("semua");
  const { can, activeRole } = useProduksiActor();
  const canCreate = can("create_spk");

  const counts = useMemo(() => {
    return {
      semua: spkList.length,
      direncanakan: spkList.filter((s) => s.filterCategory === "direncanakan").length,
      menunggu_bahan: spkList.filter((s) => s.filterCategory === "menunggu_bahan").length,
      diproses: spkList.filter((s) => s.filterCategory === "diproses").length,
      hasil_dicatat:
        spkList.length === INITIAL_SPK_LIST.length
          ? 1
          : spkList.filter((s) => s.filterCategory === "hasil_dicatat").length,
    };
  }, [spkList]);

  const filteredSpk = useMemo(() => {
    if (activeTab === "semua") return spkList;
    return spkList.filter((item) => item.filterCategory === activeTab);
  }, [spkList, activeTab]);

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
        <span>PR-002 Membuat perintah produksi</span>
      </nav>

      {/* Header */}
      <h1 className="mt-1.5 text-[28px] leading-tight font-bold tracking-tight text-[#172335]">
        Perintah produksi
      </h1>
      <p className="mt-1.5 text-[13px] text-[#526174]">
        Satu perintah produksi (SPK) untuk satu produk dan jadwal. Kebutuhan bahan dihitung
        dari data produksi.
      </p>

      {/* Alert Callout Permintaan dari Gudang */}
      <div className="shadow-card mt-5 rounded-[10px] border border-transparent bg-[#FEF3C7]/85 px-5 py-3.5 animate-slide-down">
        <p className="text-[13px] font-semibold text-[#92400E]">
          Permintaan dari Gudang: Wiremesh M6 kurang 120 lembar
        </p>
        <p className="mt-0.5 text-[12px] text-[#B45309]">
          Untuk SO-2611-015 PT Graha Konstruksi, dikirim 28 Nov.
        </p>
      </div>

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

        {/* Filter Tabs */}
        <div>
          <div className="inline-flex flex-wrap items-center gap-1 rounded-[8px] bg-[#F1F5F9] p-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded-[6px] border px-3 py-1.5 text-[12px] transition-all duration-150 ease-out active:scale-[0.98] ${
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
                <th className="rounded-l-[6px] px-[12px] py-2.5">Perintah</th>
                <th className="px-[12px] py-2.5">Produk</th>
                <th className="px-[12px] py-2.5">Jumlah</th>
                <th className="px-[12px] py-2.5">Jadwal</th>
                <th className="px-[12px] py-2.5">Status</th>
                <th className="rounded-r-[6px] px-[12px] py-2.5 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]/80">
              {filteredSpk.map((item) => (
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
                    {renderStatusBadge(item.status)}
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

              {filteredSpk.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-[13px] text-[#526174]"
                  >
                    Belum ada perintah produksi pada kategori ini.
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
