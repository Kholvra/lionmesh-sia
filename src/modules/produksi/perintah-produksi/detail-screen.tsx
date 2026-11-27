"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState, useTransition } from "react";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { SpkStepper } from "@/components/ui/spk-stepper";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { keluarkanBahanUntukSpk, ubahStatusSpk } from "@/modules/produksi/actions";
import { useProduksiActor } from "@/modules/produksi/context/actor-context";
import { hitungKebutuhanBahan } from "@/modules/produksi/kebutuhan-bahan";
import { muatSpkDetail } from "@/modules/produksi/queries";
import type { SpkDetailData, SpkStatusType, StatusSpkInti } from "./types";

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
  const searchParams = useSearchParams();
  const isJustSaved = searchParams.get("saved") === "1";
  const [data, setData] = useState<SpkDetailData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { can } = useProduksiActor();
  const [notifikasi, setNotifikasi] = useState<string | null>(null);
  const [qtyIssue, setQtyIssue] = useState("");
  const [pending, startTransition] = useTransition();

  const transisi: Partial<Record<StatusSpkInti, { tujuan: StatusSpkInti; aksi: string; label: string }>> = {
    DIRENCANAKAN: { tujuan: "CEK_BAHAN", aksi: "CEK_BAHAN", label: "Ajukan cek bahan" },
    CEK_BAHAN: { tujuan: "BAHAN_CUKUP", aksi: "CEK_BAHAN", label: "Tandai bahan cukup" },
    BAHAN_CUKUP: { tujuan: "BERJALAN", aksi: "MULAI", label: "Mulai produksi" },
    BAHAN_SIAP: { tujuan: "BERJALAN", aksi: "MULAI", label: "Mulai produksi" },
  };

  const kirimStatus = () => {
    if (!currentSpk || !statusLanjutan) return;
    const formData = new FormData();
    formData.set("wo_id", currentSpk.woId);
    formData.set("versi", String(currentSpk.versiDokumen));
    formData.set("status_tujuan", statusLanjutan.tujuan);
    formData.set("aksi", statusLanjutan.aksi);
    startTransition(async () => {
      const hasil = await ubahStatusSpk(formData);
      setNotifikasi(hasil.ok ? `Status diperbarui menjadi ${statusLanjutan.tujuan}.` : hasil.message);
    });
  };

  const kirimIssue = () => {
    if (!currentSpk || !relatedBom || !qtyIssue) return;
    const formData = new FormData();
    formData.set("wo_id", currentSpk.woId);
    formData.set("produk_id", relatedBom.komponenProdukId);
    formData.set("satuan_id", relatedBom.satuanId);
    formData.set("gudang_id", currentSpk.gudangId);
    formData.set("qty_keluar", qtyIssue);
    formData.set("tanggal", new Date().toISOString());
    startTransition(async () => {
      const hasil = await keluarkanBahanUntukSpk(formData);
      setNotifikasi(hasil.ok ? "Pengeluaran bahan tercatat." : hasil.message);
    });
  };

  useEffect(() => {
    if (!initialNomorSpk) return;
    let aktif = true;
    muatSpkDetail(initialNomorSpk).then((hasil) => {
      if (!aktif) return;
      if (hasil.ok) setData(hasil.data);
      else setError(hasil.message);
    });
    return () => {
      aktif = false;
    };
  }, [initialNomorSpk]);

  const currentSpk = data?.spk ?? null;
  const statusLanjutan = transisi[currentSpk?.statusInti as StatusSpkInti];
  const relatedBom = data?.bom ?? null;

  const kebutuhanBahan = useMemo(
    () =>
      currentSpk && relatedBom
        ? hitungKebutuhanBahan(currentSpk.jumlahLembar, relatedBom, data?.stokTon ?? null)
        : null,
    [currentSpk, relatedBom, data?.stokTon],
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

  if (error) {
    return (
      <div className="w-full text-[#172335] animate-fade-in">
        <ErrorState judul="Data SPK tidak dapat dimuat." teks={error} variant="compact" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full text-[#172335] animate-fade-in">
        <LoadingState judul="Memuat data SPK..." variant="inline" />
      </div>
    );
  }

  if (!currentSpk || !relatedBom || !kebutuhanBahan) {
    return (
      <div className="w-full text-[#172335] animate-fade-in">
        <EmptyState
          judul="Perintah produksi atau versi BOM terkait tidak ditemukan."
          variant="inline"
        />
      </div>
    );
  }

  return (
    <div className="w-full text-[#172335] animate-fade-in">
      {notifikasi && <Notice className="mt-3" tone="info" variant="card">{notifikasi}</Notice>}
      <PageHeader
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
              {jadwalLengkap} · Mesin ditentukan saat pelaksanaan
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

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {statusLanjutan && can("check_stok_bahan") && (
          <button type="button" disabled={pending} onClick={kirimStatus} className="rounded-[8px] border border-[#E5E7EB] bg-white px-4 py-2 text-[13px] font-semibold text-[#172335]">{statusLanjutan.label}</button>
        )}
        {can("issue_bahan_gudang") && (
          <>
            <input type="number" min="0" step="0.0001" value={qtyIssue} onChange={(e) => setQtyIssue(e.target.value)} placeholder="Qty keluar (ton)" className="w-[180px] rounded-[8px] border border-[#E5E7EB] px-3 py-2 text-[13px]" />
            <button type="button" disabled={pending} onClick={kirimIssue} className="rounded-[8px] bg-[#E88A06] px-4 py-2 text-[13px] font-semibold text-white">Keluarkan bahan</button>
          </>
        )}
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
