"use client";

import { useState } from "react";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import {
  STATUS_KARTU_JAM_KERJA,
  STATUS_POSTING_HPP,
  StatusBadge,
} from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/states";
import { TableActionLink } from "@/components/ui/table-action-link";
import { useTableState } from "@/components/ui/use-table-state";
import { bacaKoleksi, simpanKoleksi } from "@/modules/produksi/store";
import { useProduksiActor } from "@/modules/produksi/context/actor-context";
import type { HppSpkSummary, KartuJamKerjaItem } from "./types";

type ActiveTab = "jam_kerja" | "kalkulasi_hpp";

export function KartuJamKerjaScreen() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("jam_kerja");
  const { can, activeRole } = useProduksiActor();
  const canRecordKjk = can("record_kartu_jam_kerja");
  const [kjkList, setKjkList] = useState<KartuJamKerjaItem[]>(() =>
    bacaKoleksi("kartuJamKerja"),
  );
  const [hppList] = useState<HppSpkSummary[]>([]);
  const tabelKjk = useTableState(kjkList, {
    pageSize: kjkList.length || 1,
  });
  const tabelHpp = useTableState(hppList, {
    pageSize: hppList.length || 1,
  });

  // Form modal tambah jam kerja
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formSpk, setFormSpk] = useState("SPK-2611-013");
  const [formKaryawan, setFormKaryawan] = useState("Budi Santoso");
  const [formNik, setFormNik] = useState("K-042");
  const [formTanggal, setFormTanggal] = useState("2026-11-28");
  const [formJamReguler, setFormJamReguler] = useState("7");
  const [formJamLembur, setFormJamLembur] = useState("0");
  const [formKegiatan, setFormKegiatan] = useState("Operator Mesin Las 1");
  const [formError, setFormError] = useState<string | null>(null);

  const totalJamKeseluruhan = kjkList.reduce((acc, c) => acc + c.totalJam, 0);
  const totalTklKeseluruhan = kjkList.reduce((acc, c) => acc + c.totalTkl, 0);

  const handleSimpanKjk = (e: React.FormEvent) => {
    e.preventDefault();
    const reg = parseFloat(formJamReguler);
    const lem = parseFloat(formJamLembur);

    if (Number.isNaN(reg) || reg < 0 || Number.isNaN(lem) || lem < 0) {
      setFormError("Jam kerja reguler dan lembur harus berupa angka positif.");
      return;
    }
    if (reg + lem <= 0) {
      setFormError("Total jam kerja harus lebih dari 0 jam.");
      return;
    }

    const totalJam = reg + lem;
    const tarif = 35000;
    const totalTkl = totalJam * tarif;

    const newItem: KartuJamKerjaItem = {
      id: `kjk-${Date.now()}`,
      nomorSpk: formSpk,
      namaKaryawan: formKaryawan,
      nik: formNik,
      tanggal: "28 Nov 2026",
      tanggalISO: formTanggal,
      jamReguler: reg,
      jamLembur: lem,
      totalJam,
      tarifPerJam: tarif,
      totalTkl,
      kegiatan: formKegiatan,
      status: "TERCATAT",
    };

    const nextList = [newItem, ...kjkList];
    setKjkList(nextList);
    simpanKoleksi("kartuJamKerja", nextList);

    setIsModalOpen(false);
    setFormError(null);
  };

  return (
    <div className="mx-auto max-w-[1156px] text-[#172335] animate-fade-in">
      <PageHeader
        description="Pencatatan kartu jam kerja tenaga kerja langsung (TKL) per SPK dan perhitungan HPP produk selesai menggunakan rumus mengikat (Bahan + TKL + Overhead + Rework − Reject abnormal)."
        title="Biaya produksi & HPP"
        variant="cycle"
      />

      <Notice
        className="mt-5"
        title="Tarif Overhead Predeterminasi Periode Nov 2026: Rp 45.000 / DLH"
        tone="warning"
        variant="card"
      >
        <p className="mt-0.5 text-[12px] text-[#B45309]">
          Pembebanan TKL dan overhead otomatis dialokasikan ke akun WIP (Barang
          Dalam Proses) saat hasil dicatat. Jurnal HPP final diposting oleh
          Accounting saat SPK selesai.
        </p>
      </Notice>

      {/* Action Bar & Tab Switcher */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <SegmentedTabs
          items={[
            {
              key: "jam_kerja",
              label: `Kartu Jam Kerja TKL (${kjkList.length})`,
            },
            {
              key: "kalkulasi_hpp",
              label: `Kalkulasi HPP Perintah (${hppList.length})`,
            },
          ]}
          onValueChange={(key) => setActiveTab(key as ActiveTab)}
          value={activeTab}
        />

        {activeTab === "jam_kerja" &&
          (canRecordKjk ? (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center rounded-[8px] bg-[#E88A06] px-4 py-2 text-[13px] font-semibold text-white shadow-2xs transition-all duration-150 ease-out hover:bg-[#D17B05] active:scale-[0.98]"
            >
              + Catat jam kerja
            </button>
          ) : (
            <span className="inline-flex items-center rounded-[6px] border border-slate-200 bg-slate-100 px-3 py-1.5 text-[11px] font-medium text-slate-500">
              Pencatatan jam kerja: Wewenang Produksi (Aktor: {activeRole})
            </span>
          ))}
      </div>

      {/* TAB 1: KARTU JAM KERJA */}
      {activeTab === "jam_kerja" && (
        <section className="shadow-card mt-4 flex flex-col gap-[14px] rounded-[10px] border border-transparent bg-white p-[20px]">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[15px] font-semibold text-[#172335]">
              Daftar kartu jam kerja per perintah produksi
            </h2>
            <div className="text-[12px] text-[#526174]">
              Total jam:{" "}
              <span className="font-semibold text-[#172335]">
                {totalJamKeseluruhan} jam
              </span>{" "}
              · Akumulasi TKL:{" "}
              <span className="font-semibold text-[#172335]">
                Rp {totalTklKeseluruhan.toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-[#F3F4F6] text-[12px] font-semibold text-[#526174]">
                  <th className="rounded-l-[6px] px-[12px] py-2.5">Perintah</th>
                  <th className="px-[12px] py-2.5">Karyawan</th>
                  <th className="px-[12px] py-2.5">Tanggal</th>
                  <th className="px-[12px] py-2.5">Reguler · Lembur</th>
                  <th className="px-[12px] py-2.5">Total Jam</th>
                  <th className="px-[12px] py-2.5">Tarif / Jam</th>
                  <th className="px-[12px] py-2.5">Biaya TKL</th>
                  <th className="px-[12px] py-2.5">Status</th>
                  <th className="rounded-r-[6px] px-[12px] py-2.5">Kegiatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]/80">
                {tabelKjk.visibleRows.map((item) => (
                  <tr
                    key={item.id}
                    className="transition-colors hover:bg-slate-50/70"
                  >
                    <td className="px-[12px] py-3.5">
                      <span className="text-[13px] font-semibold text-[#172335]">
                        {item.nomorSpk}
                      </span>
                    </td>
                    <td className="px-[12px] py-3.5">
                      <p className="text-[13px] font-medium text-[#172335]">
                        {item.namaKaryawan}
                      </p>
                      <p className="text-[11px] text-[#526174]">{item.nik}</p>
                    </td>
                    <td className="px-[12px] py-3.5 text-[13px] text-[#172335]">
                      {item.tanggal}
                    </td>
                    <td className="px-[12px] py-3.5 text-[13px] text-[#172335] tabular-nums">
                      {item.jamReguler}j · {item.jamLembur}j
                    </td>
                    <td className="px-[12px] py-3.5 text-[13px] font-medium text-[#172335] tabular-nums">
                      {item.totalJam} jam
                    </td>
                    <td className="px-[12px] py-3.5 text-[13px] text-[#172335] tabular-nums">
                      Rp {item.tarifPerJam.toLocaleString("id-ID")}
                    </td>
                    <td className="px-[12px] py-3.5 text-[13px] font-semibold text-[#172335] tabular-nums">
                      Rp {item.totalTkl.toLocaleString("id-ID")}
                    </td>
                    <td className="px-[12px] py-3.5">
                      <StatusBadge
                        status={item.status}
                        statuses={STATUS_KARTU_JAM_KERJA}
                        variant="compact"
                      />
                    </td>
                    <td className="px-[12px] py-3.5 text-[12px] text-[#526174]">
                      {item.kegiatan}
                    </td>
                  </tr>
                ))}
                {tabelKjk.isEmpty && (
                  <tr>
                    <td colSpan={9}>
                      <div className="py-8 text-center">
                        <EmptyState
                          judul="Belum ada kartu jam kerja yang dicatat."
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

      {/* TAB 2: KALKULASI HPP */}
      {activeTab === "kalkulasi_hpp" && (
        <section className="shadow-card mt-4 flex flex-col gap-[14px] rounded-[10px] border border-transparent bg-white p-[20px]">
          <h2 className="text-[15px] font-semibold text-[#172335]">
            Ringkasan HPP & biaya per perintah produksi
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-[#F3F4F6] text-[12px] font-semibold text-[#526174]">
                  <th className="rounded-l-[6px] px-[12px] py-2.5">Perintah</th>
                  <th className="px-[12px] py-2.5">Produk</th>
                  <th className="px-[12px] py-2.5">Lulus QC</th>
                  <th className="px-[12px] py-2.5">Bahan Baku</th>
                  <th className="px-[12px] py-2.5">TKL</th>
                  <th className="px-[12px] py-2.5">Overhead</th>
                  <th className="px-[12px] py-2.5">Total HPP</th>
                  <th className="px-[12px] py-2.5">HPP / Lembar</th>
                  <th className="px-[12px] py-2.5">Status HPP</th>
                  <th className="rounded-r-[6px] px-[12px] py-2.5 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]/80">
                {tabelHpp.visibleRows.map((item) => (
                  <tr
                    key={item.nomorSpk}
                    className="transition-colors hover:bg-slate-50/70"
                  >
                    <td className="px-[12px] py-3.5">
                      <p className="text-[13px] font-semibold text-[#172335]">
                        {item.nomorSpk}
                      </p>
                      <p className="text-[11px] text-[#526174]">
                        {item.jadwalText}
                      </p>
                    </td>
                    <td className="px-[12px] py-3.5 text-[13px] text-[#172335]">
                      {item.produkNama}
                    </td>
                    <td className="px-[12px] py-3.5 text-[13px] text-[#172335] tabular-nums">
                      {item.jumlahLulus} lembar
                    </td>
                    <td className="px-[12px] py-3.5 text-[13px] text-[#172335] tabular-nums">
                      Rp {item.biayaBahanRp.toLocaleString("id-ID")}
                    </td>
                    <td className="px-[12px] py-3.5 text-[13px] text-[#172335] tabular-nums">
                      Rp {item.biayaTklRp.toLocaleString("id-ID")}
                    </td>
                    <td className="px-[12px] py-3.5 text-[13px] text-[#172335] tabular-nums">
                      Rp {item.biayaOverheadRp.toLocaleString("id-ID")}
                    </td>
                    <td className="px-[12px] py-3.5 text-[13px] font-semibold text-[#172335] tabular-nums">
                      Rp {item.totalHppRp.toLocaleString("id-ID")}
                    </td>
                    <td className="px-[12px] py-3.5 text-[13px] font-semibold text-[#B45309] tabular-nums">
                      Rp {item.hppPerUnitRp.toLocaleString("id-ID")}
                    </td>
                    <td className="px-[12px] py-3.5">
                      <StatusBadge
                        status={item.statusPostingHpp}
                        statuses={STATUS_POSTING_HPP}
                        variant="compact"
                      />
                    </td>
                    <td className="px-[12px] py-3.5 text-right">
                      <TableActionLink
                        href={`/produksi/biaya-hpp/${item.nomorSpk.toLowerCase()}`}
                      >
                        Lihat HPP
                      </TableActionLink>
                    </td>
                  </tr>
                ))}
                {tabelHpp.isEmpty && (
                  <tr>
                    <td colSpan={10}>
                      <div className="py-8 text-center">
                        <EmptyState
                          judul="Belum ada perhitungan HPP yang tersedia."
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

      {/* MODAL TAMBAH JAM KERJA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-fade-in">
          <div className="shadow-card w-full max-w-[500px] rounded-[10px] bg-white p-5 text-[#172335] animate-scale-in">
            <h3 className="text-[16px] font-semibold">
              Catat Jam Kerja Tenaga Kerja Langsung (TKL)
            </h3>
            <p className="mt-1 text-xs text-[#526174]">
              Data jam kerja akan dibebankan ke biaya WIP perintah produksi.
            </p>

            <Notice className="mt-3" tone="error" variant="plain">
              {formError}
            </Notice>

            <form onSubmit={handleSimpanKjk} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#172335]">
                  Nomor SPK
                </label>
                <select
                  value={formSpk}
                  onChange={(e) => setFormSpk(e.target.value)}
                  className="mt-1 w-full rounded-[8px] border border-[#E5E7EB] bg-white px-3 py-2 text-[13px] outline-none focus:border-[#E88A06]"
                >
                  <option value="SPK-2611-013">
                    SPK-2611-013 (Wiremesh M6)
                  </option>
                  <option value="SPK-2611-012">
                    SPK-2611-012 (Wiremesh M8)
                  </option>
                  <option value="SPK-2611-011">
                    SPK-2611-011 (Wiremesh M6)
                  </option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#172335]">
                    Nama Karyawan
                  </label>
                  <input
                    type="text"
                    value={formKaryawan}
                    onChange={(e) => setFormKaryawan(e.target.value)}
                    className="mt-1 w-full rounded-[8px] border border-[#E5E7EB] px-3 py-1.5 text-[13px] outline-none focus:border-[#E88A06]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#172335]">
                    NIK / ID Karyawan
                  </label>
                  <input
                    type="text"
                    value={formNik}
                    onChange={(e) => setFormNik(e.target.value)}
                    className="mt-1 w-full rounded-[8px] border border-[#E5E7EB] px-3 py-1.5 text-[13px] outline-none focus:border-[#E88A06]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#172335]">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    value={formTanggal}
                    onChange={(e) => setFormTanggal(e.target.value)}
                    className="mt-1 w-full rounded-[8px] border border-[#E5E7EB] px-3 py-1.5 text-[13px] outline-none focus:border-[#E88A06]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#172335]">
                    Jam Reguler
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={formJamReguler}
                    onChange={(e) => setFormJamReguler(e.target.value)}
                    className="mt-1 w-full rounded-[8px] border border-[#E5E7EB] px-3 py-1.5 text-[13px] outline-none focus:border-[#E88A06]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#172335]">
                    Jam Lembur
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={formJamLembur}
                    onChange={(e) => setFormJamLembur(e.target.value)}
                    className="mt-1 w-full rounded-[8px] border border-[#E5E7EB] px-3 py-1.5 text-[13px] outline-none focus:border-[#E88A06]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#172335]">
                  Kegiatan / Mesin
                </label>
                <input
                  type="text"
                  value={formKegiatan}
                  onChange={(e) => setFormKegiatan(e.target.value)}
                  placeholder="Contoh: Operator Mesin Las 1"
                  className="mt-1 w-full rounded-[8px] border border-[#E5E7EB] px-3 py-1.5 text-[13px] outline-none focus:border-[#E88A06]"
                />
              </div>

              <div className="mt-5 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setFormError(null);
                  }}
                  className="rounded-[8px] border border-[#E5E7EB] px-3 py-1.5 text-[13px] font-medium text-[#526174] transition-all duration-150 hover:bg-slate-50 active:scale-[0.98]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-[8px] bg-[#E88A06] px-4 py-1.5 text-[13px] font-semibold text-white transition-all duration-150 hover:bg-[#D17B05] active:scale-[0.98]"
                >
                  Simpan Catatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
