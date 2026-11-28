"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import {
  STATUS_PERMINTAAN_BAHAN,
  StatusBadge,
} from "@/components/ui/status-badge";
import { SpkStepper } from "@/components/ui/spk-stepper";
import { TableActionLink } from "@/components/ui/table-action-link";
import { useTableState } from "@/components/ui/use-table-state";
import { muatPrList } from "@/modules/produksi/queries-pembelian-laporan";
import type { PrFilterTab, PurchaseRequestItem } from "./types";


function DaftarPermintaanBahanContent() {
  const searchParams = useSearchParams();
  const submittedNomor = searchParams.get("submitted");
  const tabParam = searchParams.get("tab") as PrFilterTab | null;

  const [prList, setPrList] = useState<PurchaseRequestItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let aktif = true;
    muatPrList().then((hasil) => {
      if (!aktif) return;
      if (hasil.ok) setPrList(hasil.data);
      else setError(hasil.message);
    });
    return () => {
      aktif = false;
    };
  }, []);
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
      prList?.find(
        (item) => item.nomorPr.toLowerCase() === submittedNomor.toLowerCase(),
      ) ?? null
    );
  }, [prList, submittedNomor, activeTab]);

  const menungguPembelianItems = useMemo(
    () => (prList ?? []).filter((p) => p.status === "MENUNGGU_PEMBELIAN"),
    [prList],
  );

  const counts = useMemo(() => {
    return {
      diperiksa_purchasing: (prList ?? []).filter(
        (p) => p.status === "DIPERIKSA_PURCHASING",
      ).length,
      menunggu_pembelian: menungguPembelianItems.length,
      dikeluarkan: (prList ?? []).filter((p) => p.status === "DIKELUARKAN").length,
    };
  }, [prList, menungguPembelianItems.length]);

  const filteredList = useMemo(() => {
    if (activeTab === "diperiksa_purchasing") {
      return (prList ?? []).filter((item) => item.status === "DIPERIKSA_PURCHASING");
    }
    if (activeTab === "menunggu_pembelian") {
      return menungguPembelianItems;
    }
    return (prList ?? []).filter((item) => item.status === "DIKELUARKAN");
  }, [prList, activeTab, menungguPembelianItems]);
  const tabel = useTableState(filteredList, {
    pageSize: filteredList.length || 1,
  });

  const featuredMenungguItem = menungguPembelianItems[0] ?? null;

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


  if (error) {
    return (
      <div className="w-full text-[#172335] animate-fade-in">
        <ErrorState judul="Daftar permintaan tidak dapat dimuat." teks={error} variant="compact" />
      </div>
    );
  }

  if (!prList) {
    return (
      <div className="w-full text-[#172335] animate-fade-in">
        <LoadingState judul="Memuat daftar permintaan..." variant="inline" />
      </div>
    );
  }
  return (
    <div className="w-full text-[#172335] animate-fade-in">
      <PageHeader
        title="Permintaan bahan"
        variant="cycle"
      />

      {justSubmittedItem && (
        <Notice
          title={`${justSubmittedItem.nomorPr} diajukan ke Purchasing`}
          tone="success"
          variant="card"
        >
          <p className="mt-0.5 text-[12px]">
            Purchasing memeriksa, lalu Manajemen menyetujui. Jika ditolak,{" "}
            {justSubmittedItem.nomorSpk} dibatalkan dan perlu SPK baru.
          </p>
        </Notice>
      )}

      {/* Banner & Stepper saat tab Menunggu pembelian aktif */}
      {activeTab === "menunggu_pembelian" && featuredMenungguItem && (
        <>
          <Notice
            title={`${featuredMenungguItem.nomorSpk} menunggu pembelian`}
            tone="warning"
            variant="card"
          >
            <p className="mt-0.5 text-[12px] text-[#B45309]">
              {featuredMenungguItem.nomorPr} (
              {featuredMenungguItem.jumlahDimintaTon.toLocaleString(
                "id-ID",
                {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                }
              )}{" "}
              ton) menunggu proses pembelian. Gudang mengeluarkan bahan
              setelah wire rod diterima dan lolos QC; status SPK lalu menjadi
              Bahan siap.
            </p>
          </Notice>

          <SpkStepper activeStep={2} />
        </>
      )}

      {/* Card Permintaan Saya */}
      <section className="shadow-card mt-4 flex flex-col gap-[14px] rounded-[10px] border border-transparent bg-white p-[20px]">
        <h2 className="text-[15px] leading-none font-semibold text-[#172335]">
          Permintaan saya
        </h2>

        {/* Segmented Filter Tabs */}
        <SegmentedTabs
          items={tabs}
          onValueChange={(key) => setActiveTab(key as PrFilterTab)}
          value={activeTab}
        />

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
              {tabel.visibleRows.map((item) => (
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
                    <StatusBadge
                      status={item.status}
                      statuses={STATUS_PERMINTAAN_BAHAN}
                      variant="compact"
                    />
                  </td>
                  <td className="px-[12px] py-4 text-right">
                    <TableActionLink
                      href={`/produksi/perintah-produksi/${item.nomorSpk.toLowerCase()}`}
                    >
                      Lihat
                    </TableActionLink>
                  </td>
                </tr>
              ))}

              {tabel.isEmpty && (
                <tr>
                  <td colSpan={5}>
                  <div className="py-8 text-center">
                    <EmptyState
                      judul="Belum ada permintaan bahan pada kategori ini."
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

export function DaftarPembelianBahanScreen() {
  return (
    <Suspense fallback={<LoadingState judul="Memuat daftar permintaan..." variant="inline" />}>
      <DaftarPermintaanBahanContent />
    </Suspense>
  );
}
