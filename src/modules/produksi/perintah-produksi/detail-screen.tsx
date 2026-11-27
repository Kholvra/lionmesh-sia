"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { SpkStepper } from "@/components/ui/spk-stepper";
import { LoadingState } from "@/components/ui/states";
import { ProduksiSubnav } from "../components/produksi-subnav";
import { BomItem, INITIAL_BOM_LIST } from "../bom-produk/types";
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

      <PageHeader
        back={{ href: "/produksi/perintah-produksi", label: "Perintah produksi" }}
        breadcrumb={[
          { href: "/produksi", label: "Siklus Produksi" },
          "PR-002 Membuat perintah produksi",
        ]}
        title={currentSpk.nomorSpk}
        variant="cycle"
      />

      {isJustSaved && (
        <Notice
          title={`${currentSpk.nomorSpk} tersimpan`}
          tone="success"
          variant="card"
        >
          <p className="mt-0.5 text-[12px]">
            Status Direncanakan. SPK masuk daftar Gudang untuk dicek bahannya.
          </p>
        </Notice>
      )}

      <SpkStepper
        activeStep={activeStep}
        completedMarker="number"
        connectorTone="neutral"
        hoverable
      />

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
    <Suspense fallback={<LoadingState judul="Memuat data SPK..." variant="inline" />}>
      <DetailSpkContent initialNomorSpk={nomorSpk} />
    </Suspense>
  );
}
