"use client";

import { useMemo, useState } from "react";
import { MetricCardGrid } from "@/components/ui/metric-card";
import { useParams } from "next/navigation";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import {
  STATUS_POSTING_HPP,
  StatusBadge,
} from "@/components/ui/status-badge";
import { useTableState } from "@/components/ui/use-table-state";
import { useProduksiActor } from "@/modules/produksi/context/actor-context";
import { ProduksiSubnav } from "@/modules/produksi/components/produksi-subnav";
import { HppSpkSummary, INITIAL_HPP_LIST } from "./types";

export function DetailHppScreen() {
  const params = useParams<{ nomorSpk: string }>();
  const spkSlug = (params?.nomorSpk ?? "spk-2611-013").toLowerCase();

  const [hppData, setHppData] = useState<HppSpkSummary>(() => {
    const found = INITIAL_HPP_LIST.find(
      (item) => item.nomorSpk.toLowerCase() === spkSlug
    );
    return found ?? INITIAL_HPP_LIST[0];
  });

  const { can, activeRole } = useProduksiActor();
  const canPostHpp = can("post_final_hpp");

  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handlePostingFinalHpp = () => {
    if (hppData.statusWo !== "SELESAI") {
      setNotification({
        type: "error",
        message: `HPP final hanya bisa dihitung dan diposting saat perintah SELESAI (Status saat ini: ${hppData.statusWo}). Pembebanan sementara tetap dicatat di akun WIP.`,
      });
      return;
    }

    setHppData((prev) => ({
      ...prev,
      statusPostingHpp: "FINAL_DIPOSTING",
      tanggalPosting: "24 Nov 2026 · 10.00",
    }));

    setNotification({
      type: "success",
      message: `Jurnal HPP Final untuk ${hppData.nomorSpk} sebesar Rp ${hppData.totalHppRp.toLocaleString("id-ID")} berhasil diposting ke Buku Besar. Akun Barang Dalam Proses (WIP) telah ditutup ke Persediaan Barang Jadi.`,
    });
  };
  const hppAction =
    hppData.statusPostingHpp === "FINAL_DIPOSTING" ? (
      <div className="inline-flex items-center gap-2">
        <StatusBadge
          status={hppData.statusPostingHpp}
          statuses={STATUS_POSTING_HPP}
          variant="compact"
        />
        <span className="text-[12px] font-semibold text-[#15803D]">
          ({hppData.tanggalPosting})
        </span>
      </div>
    ) : canPostHpp ? (
      <button
        type="button"
        onClick={handlePostingFinalHpp}
        className="inline-flex items-center justify-center rounded-[8px] bg-[#E88A06] px-4 py-2 text-[13px] font-semibold text-white shadow-2xs transition-all duration-150 ease-out hover:bg-[#D17B05] active:scale-[0.98]"
      >
        Posting Jurnal HPP Final
      </button>
    ) : (
      <div
        className="inline-flex items-center rounded-[8px] border border-slate-200 bg-slate-100 px-3.5 py-2 text-[12px] font-medium text-slate-500"
        title="Wewenang posting jurnal HPP final dipegang oleh peran Accounting."
      >
        Posting HPP: Wewenang Accounting (Aktor: {activeRole})
      </div>
    );

  const jurnalRows = useMemo(() => {
    return [
      {
        akun: "11400 · Barang Dalam Proses (WIP)",
        posisi: "Debit",
        debit: hppData.biayaTklRp,
        kredit: 0,
        keterangan: "Pembebanan Tenaga Kerja Langsung",
      },
      {
        akun: "51200 · Beban Tenaga Kerja Langsung",
        posisi: "Kredit",
        debit: 0,
        kredit: hppData.biayaTklRp,
        keterangan: "Alokasi jam kerja TKL",
      },
      {
        akun: "11400 · Barang Dalam Proses (WIP)",
        posisi: "Debit",
        debit: hppData.biayaOverheadRp,
        kredit: 0,
        keterangan: "Pembebanan Overhead Pabrik",
      },
      {
        akun: "51300 · Overhead Pabrik Dibebankan",
        posisi: "Kredit",
        debit: 0,
        kredit: hppData.biayaOverheadRp,
        keterangan: `${hppData.totalDlh} DLH × Rp ${hppData.tarifOverheadPerDlh.toLocaleString("id-ID")}`,
      },
      {
        akun: "11300 · Persediaan Barang Jadi",
        posisi: "Debit",
        debit: hppData.totalHppRp,
        kredit: 0,
        keterangan: `Penyelesaian ${hppData.jumlahLulus} lembar ${hppData.produkNama}`,
      },
      {
        akun: "11400 · Barang Dalam Proses (WIP)",
        posisi: "Kredit",
        debit: 0,
        kredit: hppData.totalHppRp,
        keterangan: "Penutupan WIP ke Barang Jadi",
      },
    ];
  }, [hppData]);
  const tabelJurnal = useTableState(jurnalRows, {
    pageSize: jurnalRows.length || 1,
  });

  return (
    <div className="mx-auto max-w-[1156px] text-[#172335] animate-fade-in">
      <ProduksiSubnav />

      <PageHeader
        actions={hppAction}
        back={{ href: "/produksi/kartu-jam-kerja", label: "Kembali ke daftar HPP" }}
        breadcrumb={[
          { href: "/produksi", label: "Siklus Produksi" },
          "PR-006 Biaya produksi dan HPP",
          hppData.nomorSpk,
        ]}
        description={`${hppData.produkNama} · ${hppData.jumlahLulus} lembar lulus QC · Jadwal ${hppData.jadwalText}`}
        title={`Rincian HPP ${hppData.nomorSpk}`}
        variant="cycle"
      />

      {notification && (
        <Notice
          className="mt-4"
          title={
            notification.type === "success"
              ? "Berhasil Diposting"
              : "Tidak Dapat Memposting HPP"
          }
          tone={notification.type === "success" ? "success" : "error"}
          variant="card"
        >
          <p className="mt-0.5 text-[12px]">{notification.message}</p>
        </Notice>
      )}

      <MetricCardGrid
        className="mt-5"
        columns={3}
        items={[
          {
            hint: "Akumulasi 5 komponen biaya",
            label: "Total HPP Perintah",
            value: `Rp ${hppData.totalHppRp.toLocaleString("id-ID")}`,
          },
          {
            hint: `Total HPP ÷ ${hppData.jumlahLulus} lembar lulus`,
            label: "HPP per Lembar",
            tone: "warning",
            value: `Rp ${hppData.hppPerUnitRp.toLocaleString("id-ID")}`,
          },
          {
            hint:
              hppData.statusPostingHpp === "FINAL_DIPOSTING"
                ? "Akun WIP telah ditutup"
                : "Pembebanan WIP berjalan",
            label: "Status Dokumen SPK",
            value: hppData.statusWo,
          },
        ]}
      />

      {/* Breakdown 5 Komponen Sesuai Rumus Mengikat */}
      <section className="shadow-card mt-5 flex flex-col gap-[14px] rounded-[10px] border border-transparent bg-white p-[20px]">
        <h2 className="text-[15px] font-semibold text-[#172335]">
          Rincian Komponen Biaya & Dokumen Sumber (Rumus Mengikat)
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-[#F3F4F6] text-[12px] font-semibold text-[#526174]">
                <th className="rounded-l-[6px] px-[12px] py-2.5">
                  Komponen Biaya
                </th>
                <th className="px-[12px] py-2.5">Rumus / Perhitungan</th>
                <th className="px-[12px] py-2.5">Dokumen Sumber</th>
                <th className="rounded-r-[6px] px-[12px] py-2.5 text-right">
                  Subtotal Biaya (Rp)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]/80 text-[13px]">
              <tr>
                <td className="px-[12px] py-3.5 font-medium text-[#172335]">
                  1. Biaya Bahan Baku
                </td>
                <td className="px-[12px] py-3.5 text-[#526174]">
                  Bahan terpakai × Harga rata bergerak persediaan
                </td>
                <td className="px-[12px] py-3.5 font-medium text-[#C96A00]">
                  {hppData.sumberBahanDoc}
                </td>
                <td className="px-[12px] py-3.5 text-right font-semibold text-[#172335] tabular-nums">
                  Rp {hppData.biayaBahanRp.toLocaleString("id-ID")}
                </td>
              </tr>
              <tr>
                <td className="px-[12px] py-3.5 font-medium text-[#172335]">
                  2. Tenaga Kerja Langsung (TKL)
                </td>
                <td className="px-[12px] py-3.5 text-[#526174]">
                  Σ (Jam kerja per karyawan × Tarif per jam)
                </td>
                <td className="px-[12px] py-3.5 font-medium text-[#C96A00]">
                  {hppData.sumberTklDoc}
                </td>
                <td className="px-[12px] py-3.5 text-right font-semibold text-[#172335] tabular-nums">
                  Rp {hppData.biayaTklRp.toLocaleString("id-ID")}
                </td>
              </tr>
              <tr>
                <td className="px-[12px] py-3.5 font-medium text-[#172335]">
                  3. Biaya Overhead Pabrik
                </td>
                <td className="px-[12px] py-3.5 text-[#526174]">
                  {hppData.totalDlh} DLH × Tarif Predeterminasi (Rp{" "}
                  {hppData.tarifOverheadPerDlh.toLocaleString("id-ID")}/DLH)
                </td>
                <td className="px-[12px] py-3.5 font-medium text-[#C96A00]">
                  {hppData.sumberOverheadDoc}
                </td>
                <td className="px-[12px] py-3.5 text-right font-semibold text-[#172335] tabular-nums">
                  Rp {hppData.biayaOverheadRp.toLocaleString("id-ID")}
                </td>
              </tr>
              <tr>
                <td className="px-[12px] py-3.5 font-medium text-[#172335]">
                  4. Biaya Rework QC
                </td>
                <td className="px-[12px] py-3.5 text-[#526174]">
                  Bahan tambahan + Jam kerja rework mesin las
                </td>
                <td className="px-[12px] py-3.5 font-medium text-[#C96A00]">
                  Catatan QC: Rework 2 lembar
                </td>
                <td className="px-[12px] py-3.5 text-right font-semibold text-[#172335] tabular-nums">
                  Rp {hppData.biayaReworkRp.toLocaleString("id-ID")}
                </td>
              </tr>
              <tr>
                <td className="px-[12px] py-3.5 font-medium text-[#172335]">
                  5. Reject Abnormal (Pengurang)
                </td>
                <td className="px-[12px] py-3.5 text-[#526174]">
                  Kerugian produksi di atas batas toleransi
                </td>
                <td className="px-[12px] py-3.5 font-medium text-[#526174]">
                  Tidak ada reject abnormal
                </td>
                <td className="px-[12px] py-3.5 text-right font-semibold text-[#15803D] tabular-nums">
                  − Rp {hppData.rejectAbnormalRp.toLocaleString("id-ID")}
                </td>
              </tr>
              <tr className="bg-[#F8FAFC] font-bold">
                <td colSpan={3} className="px-[12px] py-3.5 text-[#172335]">
                  Total HPP (1 + 2 + 3 + 4 − 5)
                </td>
                <td className="px-[12px] py-3.5 text-right text-[15px] text-[#B45309] tabular-nums">
                  Rp {hppData.totalHppRp.toLocaleString("id-ID")}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Simulasi Jurnal Akuntansi */}
      <section className="shadow-card mt-5 flex flex-col gap-[14px] rounded-[10px] border border-transparent bg-white p-[20px]">
        <h2 className="text-[15px] font-semibold text-[#172335]">
          Simulasi Jurnal Akuntansi Biaya (Buku Besar)
        </h2>
        <p className="text-xs text-[#526174]">
          Jurnal pembebanan otomatis seimbang (Debit = Kredit) diposting ke
          modul buku besar.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-[#F3F4F6] text-[12px] font-semibold text-[#526174]">
                <th className="rounded-l-[6px] px-[12px] py-2.5">Nama Akun</th>
                <th className="px-[12px] py-2.5">Keterangan Transaksi</th>
                <th className="px-[12px] py-2.5 text-right">Debit (Rp)</th>
                <th className="rounded-r-[6px] px-[12px] py-2.5 text-right">
                  Kredit (Rp)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]/80 text-[13px]">
              {tabelJurnal.visibleRows.map((j, i) => (
                <tr key={i} className="hover:bg-slate-50/70">
                  <td className="px-[12px] py-3 font-medium text-[#172335]">
                    {j.akun}
                  </td>
                  <td className="px-[12px] py-3 text-[#526174]">
                    {j.keterangan}
                  </td>
                  <td className="px-[12px] py-3 text-right font-medium text-[#172335] tabular-nums">
                    {j.debit > 0
                      ? `Rp ${j.debit.toLocaleString("id-ID")}`
                      : "—"}
                  </td>
                  <td className="px-[12px] py-3 text-right font-medium text-[#172335] tabular-nums">
                    {j.kredit > 0
                      ? `Rp ${j.kredit.toLocaleString("id-ID")}`
                      : "—"}
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
