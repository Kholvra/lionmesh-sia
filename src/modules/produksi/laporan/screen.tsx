"use client";

import { useEffect, useMemo, useState } from "react";
import { MetricCardGrid } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import {
  STATUS_KATEGORI_PERSEDIAAAN,
  StatusBadge,
} from "@/components/ui/status-badge";
import { TableActionLink } from "@/components/ui/table-action-link";
import { useTableState } from "@/components/ui/use-table-state";
import { useProduksiActor } from "@/modules/produksi/context/actor-context";
import { tabLaporanProduksi } from "@/modules/produksi/auth/actor";
import { muatLaporan } from "@/modules/produksi/queries-pembelian-laporan";
import type { LaporanData } from "./types";

type LaporanTab = "produksi" | "wip" | "persediaan";

export function LaporanProduksiScreen() {
  const [periode, setPeriode] = useState("semua");
  const [laporan, setLaporan] = useState<LaporanData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<LaporanTab>("produksi");
  const { can, activeRole } = useProduksiActor();

  const canViewProduksi = can("view_report_produksi");
  const canViewWip = can("view_report_wip");
  const canViewPersediaan = can("view_report_persediaan");

  const effectiveActiveTab: LaporanTab | null = useMemo(
    () => tabLaporanProduksi(activeRole, activeTab),
    [activeRole, activeTab],
  );

  const dataProduksi = laporan?.produksi ?? [];
  const dataWip = laporan?.wip ?? [];
  const dataPersediaan = laporan?.persediaan ?? [];
  const tabelProduksi = useTableState(dataProduksi, {
    pageSize: dataProduksi.length || 1,
  });
  const tabelWip = useTableState(dataWip, { pageSize: dataWip.length || 1 });
  const tabelPersediaan = useTableState(dataPersediaan, {
    pageSize: dataPersediaan.length || 1,
  });

  useEffect(() => {
    let aktif = true;
    muatLaporan(periode, activeTab).then((hasil) => {
      if (!aktif) return;
      if (hasil.ok) setLaporan(hasil.data);
      else setError(hasil.message);
    });
    return () => {
      aktif = false;
    };
  }, [periode, activeTab]);


  if (error) {
    return (
      <div className="mx-auto max-w-[1156px] text-[#172335] animate-fade-in">
        <ErrorState judul="Laporan tidak dapat dimuat." teks={error} variant="compact" />
      </div>
    );
  }

  if (!laporan) {
    return (
      <div className="mx-auto max-w-[1156px] text-[#172335] animate-fade-in">
        <LoadingState judul="Memuat laporan..." variant="inline" />
      </div>
    );
  }

  if (effectiveActiveTab === null) {
    return (
      <div className="mx-auto max-w-[1156px] text-[#172335] animate-fade-in">
        <ErrorState
          judul="Akses ditolak"
          teks="Peran Anda tidak memiliki akses ke laporan produksi. Hubungi administrator bila akses ini dibutuhkan."
          variant="compact"
        />
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
      <PageHeader
        actions={
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-[#526174]">Periode:</label>
            <select
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
              className="rounded-[8px] border border-[#E5E7EB] bg-white px-3 py-1.5 text-[13px] font-semibold text-[#172335] shadow-2xs outline-none focus:border-[#E88A06]"
            >
              {(laporan.periodeOptions.length > 0
                ? laporan.periodeOptions
                : [{ value: "semua", label: "Semua periode" }]
              ).map((opsi) => (
                <option key={opsi.value} value={opsi.value}>
                  {opsi.label}
                </option>
              ))}
            </select>
          </div>
        }
        description="Ringkasan hasil pabrik, analisis yield dan efisiensi bahan standar BOM, posisi WIP, serta rekapitulasi persediaan."
        title="Laporan produksi & efisiensi"
        variant="cycle"
      />

      <MetricCardGrid
        className="mt-5"
        columns={4}
        items={[
          {
            hint: `Dari ${totalDiproses} lembar diproses`,
            hover: "lift",
            label: "Total Output Lulus",
            unit: "lembar",
            value: totalLulusQc.toLocaleString("id-ID"),
          },
          {
            hint: "Lolos QC ÷ Jumlah diproses",
            hover: "lift",
            label: "Rata-rata Yield",
            tone: "success",
            value: `${avgYield}%`,
          },
          {
            hint: "Standar BOM ÷ Bahan aktual",
            hover: "lift",
            label: "Efisiensi Bahan",
            tone: "warning",
            value: `${avgEfisiensiBahan}%`,
          },
          {
            hint: "1 perintah dalam proses",
            hover: "lift",
            label: "Total Saldo WIP",
            value: `Rp ${(totalNilaiWip / 1000000).toFixed(1)} jt`,
          },
        ]}
      />

      <SegmentedTabs
        items={[
          {
            hidden: !canViewProduksi,
            key: "produksi",
            label: `Laporan Produksi & Efisiensi (${dataProduksi.length})`,
          },
          {
            hidden: !canViewWip,
            key: "wip",
            label: `Posisi Saldo WIP (${dataWip.length})`,
          },
          {
            hidden: !canViewPersediaan,
            key: "persediaan",
            label: `Persediaan Jadi & Mutasi (${dataPersediaan.length})`,
          },
        ]}
        onValueChange={(key) => setActiveTab(key as LaporanTab)}
        spacing="wide"
        value={effectiveActiveTab}
      />

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
                {tabelProduksi.visibleRows.map((row) => (
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
                      <TableActionLink
                        href={`/produksi/perintah-produksi/${row.nomorSpk.toLowerCase()}`}
                      >
                        Lihat SPK
                      </TableActionLink>
                    </td>
                  </tr>
                ))}
                {tabelProduksi.isEmpty && (
                  <tr>
                    <td colSpan={9}>
                      <div className="py-8 text-center">
                        <EmptyState
                          judul="Belum ada hasil produksi pada periode ini."
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
                {tabelWip.visibleRows.map((row) => (
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
                {tabelWip.isEmpty && (
                  <tr>
                    <td colSpan={7}>
                      <div className="py-8 text-center">
                        <EmptyState
                          judul="Belum ada saldo WIP pada periode ini."
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
                {tabelPersediaan.visibleRows.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/70">
                    <td className="px-[12px] py-3.5 font-medium">
                      <StatusBadge
                        status={row.kategori}
                        statuses={STATUS_KATEGORI_PERSEDIAAAN}
                        variant="compact"
                      />
                    </td>
                    <td className="px-[12px] py-3.5">
                      <p className="font-semibold text-[#172335]">
                        {row.produkNama}
                      </p>
                      <p className="text-[11px] text-[#526174]">
                        {row.produkKode}
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
                {tabelPersediaan.isEmpty && (
                  <tr>
                    <td colSpan={6}>
                      <div className="py-8 text-center">
                        <EmptyState
                          judul="Belum ada rekap persediaan pada periode ini."
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
      )}
    </div>
  );
}
