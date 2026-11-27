"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowIcon } from "@/components/ui/arrow-icon";
import { useProduksiActor } from "@/modules/produksi/context/actor-context";
import { tabLaporanProduksi } from "@/modules/produksi/auth/actor";
import { ProduksiSubnav } from "@/modules/produksi/components/produksi-subnav";
import {
  INITIAL_LAPORAN_PRODUKSI,
  INITIAL_LAPORAN_WIP,
  INITIAL_REKAP_PERSEDIAAN,
  LaporanProduksiRow,
  LaporanWipRow,
  RekapPersediaanRow,
} from "./types";

type LaporanTab = "produksi" | "wip" | "persediaan";

export function LaporanProduksiScreen() {
  const [periode, setPeriode] = useState("November 2026");
  const [activeTab, setActiveTab] = useState<LaporanTab>("produksi");
  const { can, activeRole } = useProduksiActor();

  const canViewProduksi = can("view_report_produksi");
  const canViewWip = can("view_report_wip");
  const canViewPersediaan = can("view_report_persediaan");

  const effectiveActiveTab: LaporanTab | null = useMemo(
    () => tabLaporanProduksi(activeRole, activeTab),
    [activeRole, activeTab],
  );

  const [dataProduksi] = useState<LaporanProduksiRow[]>(INITIAL_LAPORAN_PRODUKSI);
  const [dataWip] = useState<LaporanWipRow[]>(INITIAL_LAPORAN_WIP);
  const [dataPersediaan] = useState<RekapPersediaanRow[]>(INITIAL_REKAP_PERSEDIAAN);

  if (effectiveActiveTab === null) {
    return (
      <div className="mx-auto max-w-[1156px] text-[#172335] animate-fade-in">
        <ProduksiSubnav />
        <section
          aria-labelledby="akses-ditolak-laporan"
          className="shadow-card mt-5 rounded-[10px] border border-transparent bg-white p-[20px]"
        >
          <h1 className="text-[15px] font-semibold" id="akses-ditolak-laporan">
            Akses ditolak
          </h1>
          <p className="mt-1 text-[13px] text-[#526174]">
            Peran Anda tidak memiliki akses ke laporan produksi. Hubungi
            administrator bila akses ini dibutuhkan.
          </p>
        </section>
      </div>
    );
  }

  // Perhitungan agregasi metrik
  const totalDiproses = dataProduksi.reduce((acc, c) => acc + c.jumlahDiproses, 0);
  const totalLulusQc = dataProduksi.reduce((acc, c) => acc + c.lulusQc, 0);
  const totalRework = dataProduksi.reduce((acc, c) => acc + c.rework, 0);
  const totalReject = dataProduksi.reduce((acc, c) => acc + c.reject, 0);

  const avgYield =
    totalDiproses > 0
      ? Number(((totalLulusQc / totalDiproses) * 100).toFixed(1))
      : 0;

  const avgEfisiensiBahan =
    dataProduksi.length > 0
      ? Number(
          (
            dataProduksi.reduce((acc, c) => acc + c.efisiensiBahanPersen, 0) /
            dataProduksi.length
          ).toFixed(1)
        )
      : 0;

  const totalNilaiWip = dataWip.reduce((acc, c) => acc + c.totalSaldoWipRp, 0);
  const totalNilaiPersediaan = dataPersediaan.reduce(
    (acc, c) => acc + c.totalNilaiRp,
    0
  );

  return (
    <div className="mx-auto max-w-[1156px] text-[#172335] animate-fade-in">
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
        <span>PR-007 Laporan produksi dan efisiensi</span>
      </nav>

      {/* Header & Filter Periode */}
      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="text-[28px] leading-tight font-bold tracking-tight text-[#172335]">
            Laporan produksi & efisiensi
          </h1>
          <p className="mt-1 text-[13px] text-[#526174]">
            Ringkasan hasil pabrik, analisis yield dan efisiensi bahan standar
            BOM, posisi WIP, serta rekapitulasi persediaan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-[#526174]">Periode:</label>
          <select
            value={periode}
            onChange={(e) => setPeriode(e.target.value)}
            className="rounded-[8px] border border-[#E5E7EB] bg-white px-3 py-1.5 text-[13px] font-semibold text-[#172335] shadow-2xs outline-none focus:border-[#E88A06]"
          >
            <option value="November 2026">November 2026</option>
            <option value="Oktober 2026">Oktober 2026</option>
            <option value="September 2026">September 2026</option>
          </select>
        </div>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="mt-5 grid grid-cols-1 gap-[16px] sm:grid-cols-2 md:grid-cols-4">
        {/* Card 1: Output Lulus */}
        <div className="shadow-card flex flex-col justify-start gap-[6px] rounded-[10px] border border-transparent bg-white px-[20px] py-[16px] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-[13px] text-[#526174]">Total Output Lulus</p>
          <p className="text-[26px] font-bold text-[#172335] tabular-nums">
            {totalLulusQc.toLocaleString("id-ID")}{" "}
            <span className="text-[14px] font-normal text-[#526174]">lembar</span>
          </p>
          <p className="text-[11px] text-[#526174]">
            Dari {totalDiproses} lembar diproses
          </p>
        </div>

        {/* Card 2: Yield */}
        <div className="shadow-card flex flex-col justify-start gap-[6px] rounded-[10px] border border-transparent bg-white px-[20px] py-[16px] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-[13px] text-[#526174]">Rata-rata Yield</p>
          <p className="text-[26px] font-bold text-[#15803D] tabular-nums">
            {avgYield}%
          </p>
          <p className="text-[11px] text-[#526174]">Lolos QC ÷ Jumlah diproses</p>
        </div>

        {/* Card 3: Efisiensi Bahan */}
        <div className="shadow-card flex flex-col justify-start gap-[6px] rounded-[10px] border border-transparent bg-white px-[20px] py-[16px] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-[13px] text-[#526174]">Efisiensi Bahan</p>
          <p className="text-[26px] font-bold text-[#B45309] tabular-nums">
            {avgEfisiensiBahan}%
          </p>
          <p className="text-[11px] text-[#526174]">Standar BOM ÷ Bahan aktual</p>
        </div>

        {/* Card 4: Saldo WIP */}
        <div className="shadow-card flex flex-col justify-start gap-[6px] rounded-[10px] border border-transparent bg-white px-[20px] py-[16px] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-[13px] text-[#526174]">Total Saldo WIP</p>
          <p className="text-[26px] font-bold text-[#172335] tabular-nums">
            Rp {(totalNilaiWip / 1000000).toFixed(1)} jt
          </p>
          <p className="text-[11px] text-[#526174]">1 perintah dalam proses</p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="mt-5">
        <div className="inline-flex items-center gap-1 rounded-[8px] bg-[#F1F5F9] p-1">
          {canViewProduksi && (
            <button
              type="button"
              onClick={() => setActiveTab("produksi")}
              className={`rounded-[6px] border px-3.5 py-1.5 text-[12px] transition-all duration-150 active:scale-[0.98] ${
                effectiveActiveTab === "produksi"
                  ? "border-[#E5E7EB] bg-white font-semibold text-[#172335] shadow-2xs"
                  : "border-transparent font-medium text-[#526174] hover:text-[#172335]"
              }`}
            >
              Laporan Produksi & Efisiensi ({dataProduksi.length})
            </button>
          )}
          {canViewWip && (
            <button
              type="button"
              onClick={() => setActiveTab("wip")}
              className={`rounded-[6px] border px-3.5 py-1.5 text-[12px] transition-all duration-150 active:scale-[0.98] ${
                effectiveActiveTab === "wip"
                  ? "border-[#E5E7EB] bg-white font-semibold text-[#172335] shadow-2xs"
                  : "border-transparent font-medium text-[#526174] hover:text-[#172335]"
              }`}
            >
              Posisi Saldo WIP ({dataWip.length})
            </button>
          )}
          {canViewPersediaan && (
            <button
              type="button"
              onClick={() => setActiveTab("persediaan")}
              className={`rounded-[6px] border px-3.5 py-1.5 text-[12px] transition-all duration-150 active:scale-[0.98] ${
                effectiveActiveTab === "persediaan"
                  ? "border-[#E5E7EB] bg-white font-semibold text-[#172335] shadow-2xs"
                  : "border-transparent font-medium text-[#526174] hover:text-[#172335]"
              }`}
            >
              Persediaan Jadi & Mutasi ({dataPersediaan.length})
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: LAPORAN PRODUKSI */}
      {effectiveActiveTab === "produksi" && (
        <section className="shadow-card mt-4 flex flex-col gap-[14px] rounded-[10px] border border-transparent bg-white p-[20px]">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[15px] font-semibold text-[#172335]">
              Hasil Perintah Produksi Periode {periode}
            </h2>
            <span className="text-[12px] text-[#526174]">
              Rework: {totalRework} lbr · Reject: {totalReject} lbr
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-[#F3F4F6] text-[12px] font-semibold text-[#526174]">
                  <th className="rounded-l-[6px] px-[12px] py-2.5">Perintah</th>
                  <th className="px-[12px] py-2.5">Produk</th>
                  <th className="px-[12px] py-2.5">Diproses</th>
                  <th className="px-[12px] py-2.5">Lolos QC</th>
                  <th className="px-[12px] py-2.5">Rework</th>
                  <th className="px-[12px] py-2.5">Reject</th>
                  <th className="px-[12px] py-2.5">Yield (%)</th>
                  <th className="px-[12px] py-2.5">Efisiensi Bahan</th>
                  <th className="rounded-r-[6px] px-[12px] py-2.5 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]/80 text-[13px]">
                {dataProduksi.map((row) => (
                  <tr
                    key={row.nomorSpk}
                    className="transition-colors hover:bg-slate-50/70"
                  >
                    <td className="px-[12px] py-3.5">
                      <p className="font-semibold text-[#172335]">
                        {row.nomorSpk}
                      </p>
                      <p className="text-[11px] text-[#526174]">
                        {row.tanggalSelesai}
                      </p>
                    </td>
                    <td className="px-[12px] py-3.5 text-[#172335]">
                      {row.produkNama}
                    </td>
                    <td className="px-[12px] py-3.5 tabular-nums">
                      {row.jumlahDiproses} lbr
                    </td>
                    <td className="px-[12px] py-3.5 font-semibold text-[#15803D] tabular-nums">
                      {row.lulusQc} lbr
                    </td>
                    <td className="px-[12px] py-3.5 text-[#B45309] tabular-nums">
                      {row.rework > 0 ? `${row.rework} lbr` : "—"}
                    </td>
                    <td className="px-[12px] py-3.5 text-[#DC2626] tabular-nums">
                      {row.reject > 0 ? `${row.reject} lbr` : "0"}
                    </td>
                    <td className="px-[12px] py-3.5 font-semibold text-[#172335] tabular-nums">
                      {row.yieldPersen}%
                    </td>
                    <td className="px-[12px] py-3.5 font-semibold text-[#172335] tabular-nums">
                      {row.efisiensiBahanPersen}%
                    </td>
                    <td className="px-[12px] py-3.5 text-right">
                      <Link
                        href={`/produksi/perintah-produksi/${row.nomorSpk.toLowerCase()}`}
                        className="group inline-flex items-center gap-1 text-[12px] font-semibold text-[#C96A00] hover:text-[#E88A06]"
                      >
                        <span>Lihat SPK</span>
                        <ArrowIcon className="transition-transform duration-150 group-hover:translate-x-0.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 2: LAPORAN WIP */}
      {effectiveActiveTab === "wip" && (
        <section className="shadow-card mt-4 flex flex-col gap-[14px] rounded-[10px] border border-transparent bg-white p-[20px]">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[15px] font-semibold text-[#172335]">
              Posisi Barang Dalam Proses (Akun 11400 WIP)
            </h2>
            <div className="text-[12px] text-[#526174]">
              Total Saldo Akun WIP:{" "}
              <span className="font-semibold text-[#172335]">
                Rp {totalNilaiWip.toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-[#F3F4F6] text-[12px] font-semibold text-[#526174]">
                  <th className="rounded-l-[6px] px-[12px] py-2.5">Perintah</th>
                  <th className="px-[12px] py-2.5">Produk</th>
                  <th className="px-[12px] py-2.5">Progress</th>
                  <th className="px-[12px] py-2.5">Bahan Terserap</th>
                  <th className="px-[12px] py-2.5">TKL Terserap</th>
                  <th className="px-[12px] py-2.5">Overhead</th>
                  <th className="rounded-r-[6px] px-[12px] py-2.5 text-right">
                    Total Nilai WIP (Rp)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]/80 text-[13px]">
                {dataWip.map((row) => (
                  <tr
                    key={row.nomorSpk}
                    className="transition-colors hover:bg-slate-50/70"
                  >
                    <td className="px-[12px] py-3.5">
                      <p className="font-semibold text-[#172335]">
                        {row.nomorSpk}
                      </p>
                      <p className="text-[11px] text-[#526174]">
                        Mulai {row.tanggalMulai}
                      </p>
                    </td>
                    <td className="px-[12px] py-3.5 text-[#172335]">
                      {row.produkNama}
                    </td>
                    <td className="px-[12px] py-3.5 tabular-nums">
                      {row.selesaiLembar} / {row.targetLembar} lbr
                    </td>
                    <td className="px-[12px] py-3.5 tabular-nums">
                      Rp {row.biayaBahanWipRp.toLocaleString("id-ID")}
                    </td>
                    <td className="px-[12px] py-3.5 tabular-nums">
                      Rp {row.biayaTklWipRp.toLocaleString("id-ID")}
                    </td>
                    <td className="px-[12px] py-3.5 tabular-nums">
                      Rp {row.biayaOverheadWipRp.toLocaleString("id-ID")}
                    </td>
                    <td className="px-[12px] py-3.5 text-right font-semibold text-[#B45309] tabular-nums">
                      Rp {row.totalSaldoWipRp.toLocaleString("id-ID")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 3: REKAP PERSEDIAAN */}
      {effectiveActiveTab === "persediaan" && (
        <section className="shadow-card mt-4 flex flex-col gap-[14px] rounded-[10px] border border-transparent bg-white p-[20px]">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[15px] font-semibold text-[#172335]">
              Rekapitulasi Persediaan Pabrik (Bahan, WIP, Barang Jadi)
            </h2>
            <div className="text-[12px] text-[#526174]">
              Total Nilai Buku Persediaan:{" "}
              <span className="font-semibold text-[#172335]">
                Rp {totalNilaiPersediaan.toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-[#F3F4F6] text-[12px] font-semibold text-[#526174]">
                  <th className="rounded-l-[6px] px-[12px] py-2.5">Kategori</th>
                  <th className="px-[12px] py-2.5">Kode & Nama Barang</th>
                  <th className="px-[12px] py-2.5">Kuantitas</th>
                  <th className="px-[12px] py-2.5">Harga Rata-rata</th>
                  <th className="px-[12px] py-2.5">Total Nilai Buku (Rp)</th>
                  <th className="rounded-r-[6px] px-[12px] py-2.5">Lokasi Gudang</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]/80 text-[13px]">
                {dataPersediaan.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/70">
                    <td className="px-[12px] py-3.5 font-medium">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          row.kategori === "Bahan Baku"
                            ? "bg-[#DBEAFE] text-[#1D4ED8]"
                            : row.kategori === "Barang Dalam Proses (WIP)"
                              ? "bg-[#FEF3C7] text-[#92400E]"
                              : "bg-[#DCFCE7] text-[#15803D]"
                        }`}
                      >
                        {row.kategori}
                      </span>
                    </td>
                    <td className="px-[12px] py-3.5">
                      <p className="font-semibold text-[#172335]">
                        {row.namaBarang}
                      </p>
                      <p className="text-[11px] text-[#526174]">
                        {row.kodeBarang}
                      </p>
                    </td>
                    <td className="px-[12px] py-3.5 font-medium tabular-nums">
                      {row.kuantitas.toLocaleString("id-ID")} {row.satuan}
                    </td>
                    <td className="px-[12px] py-3.5 text-[#526174] tabular-nums">
                      Rp {row.hargaRataRp.toLocaleString("id-ID")}
                    </td>
                    <td className="px-[12px] py-3.5 font-semibold text-[#172335] tabular-nums">
                      Rp {row.totalNilaiRp.toLocaleString("id-ID")}
                    </td>
                    <td className="px-[12px] py-3.5 text-[#526174]">
                      {row.gudang}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
