"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { SpkStepper } from "@/components/ui/spk-stepper";
import { EmptyState, LoadingState } from "@/components/ui/states";
import { hitungKebutuhanBahan } from "@/modules/produksi/kebutuhan-bahan";
import { bacaKoleksi } from "@/modules/produksi/store";
import type { BomItem } from "../bom-produk/types";
import { ProduksiSubnav } from "../components/produksi-subnav";
import type { SpkItem, SpkStatusType } from "./types";

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

  const [spkList] = useState<SpkItem[]>(() => bacaKoleksi("spk"));
  const [bomList] = useState<BomItem[]>(() => bacaKoleksi("bom"));

  const currentSpk = useMemo<SpkItem | null>(() => {
    const slug = (initialNomorSpk ?? params?.nomorSpk ?? "spk-2611-013").toLowerCase();
    return (
      spkList.find((item) => item.nomorSpk.toLowerCase() === slug) ?? null
    );
  }, [initialNomorSpk, params?.nomorSpk, spkList]);

  const relatedBom = useMemo<BomItem | null>(
    () =>
      bomList.find((b) => b.produkKode === currentSpk?.produkKode) ?? null,
    [bomList, currentSpk?.produkKode],
  );

  const kebutuhanBahan = useMemo(
    () =>
      currentSpk && relatedBom
        ? hitungKebutuhanBahan(currentSpk.jumlahLembar, relatedBom)
        : null,
    [currentSpk, relatedBom],
  );

  const activeStep = currentSpk ? getActiveStepFromStatus(currentSpk.status) : 1;
  const jadwalLengkap = currentSpk
    ? formatJadwalLengkap(
        currentSpk.tanggalMulaiISO,
        currentSpk.tanggalSelesaiISO,
        currentSpk.jadwalText,
      )
    : "";
  const versiBomKeterangan = currentSpk
    ? `${currentSpk.versiBom} · ${currentSpk.sumberInfo}`
    : "";

  if (!currentSpk || !relatedBom || !kebutuhanBahan) {
    return (
      <div className="w-full text-[#172335] animate-fade-in">
        <ProduksiSubnav />
        <EmptyState
          judul="Perintah produksi atau versi BOM terkait tidak ditemukan."
          variant="inline"
        />
      </div>
    );
  }

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
