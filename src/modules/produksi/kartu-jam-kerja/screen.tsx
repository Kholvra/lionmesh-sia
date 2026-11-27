"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowIcon } from "@/components/ui/arrow-icon";
import { useProduksiActor } from "@/modules/produksi/context/actor-context";
import { ProduksiSubnav } from "@/modules/produksi/components/produksi-subnav";
import {
  HppSpkSummary,
  INITIAL_HPP_LIST,
  INITIAL_KARTU_JAM_KERJA,
  KartuJamKerjaItem,
} from "./types";

const KJK_STORAGE_KEY = "lionmesh_kjk_list_v1";

type ActiveTab = "jam_kerja" | "kalkulasi_hpp";

export function KartuJamKerjaScreen() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("jam_kerja");
  const { can, activeRole } = useProduksiActor();
  const canRecordKjk = can("record_kartu_jam_kerja");
  const [kjkList, setKjkList] = useState<KartuJamKerjaItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem(KJK_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as KartuJamKerjaItem[];
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {
        // Fallback default
      }
    }
    return INITIAL_KARTU_JAM_KERJA;
  });

  const [hppList] = useState<HppSpkSummary[]>(INITIAL_HPP_LIST);

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
    try {
      sessionStorage.setItem(KJK_STORAGE_KEY, JSON.stringify(nextList));
    } catch {
      // Abaikan
    }

    setIsModalOpen(false);
    setFormError(null);
  };

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
        <span>PR-006 Biaya produksi dan HPP</span>
      </nav>

      {/* Header */}
      <h1 className="mt-1.5 text-[28px] leading-tight font-bold tracking-tight text-[#172335]">
        Biaya produksi & HPP
      </h1>
      <p className="mt-1.5 text-[13px] text-[#526174]">
        Pencatatan kartu jam kerja tenaga kerja langsung (TKL) per SPK dan
        perhitungan HPP produk selesai menggunakan rumus mengikat (Bahan + TKL +
        Overhead + Rework − Reject abnormal).
      </p>

      {/* Callout Info Tarif & Formula */}
      <div className="shadow-card mt-5 rounded-[10px] border border-transparent bg-[#FEF3C7]/85 px-5 py-3.5">
        <p className="text-[13px] font-semibold text-[#92400E]">
          Tarif Overhead Predeterminasi Periode Nov 2026: Rp 45.000 / DLH
        </p>
        <p className="mt-0.5 text-[12px] text-[#B45309]">
          Pembebanan TKL dan overhead otomatis dialokasikan ke akun WIP (Barang
          Dalam Proses) saat hasil dicatat. Jurnal HPP final diposting oleh
          Accounting saat SPK selesai.
        </p>
      </div>

      {/* Action Bar & Tab Switcher */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 rounded-[8px] bg-[#F1F5F9] p-1">
          <button
            type="button"
            onClick={() => setActiveTab("jam_kerja")}
            className={`rounded-[6px] border px-3 py-1.5 text-[12px] transition-all duration-150 active:scale-[0.98] ${
              activeTab === "jam_kerja"
                ? "border-[#E5E7EB] bg-white font-semibold text-[#172335] shadow-2xs"
                : "border-transparent font-medium text-[#526174] hover:text-[#172335]"
            }`}
          >
            Kartu Jam Kerja TKL ({kjkList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("kalkulasi_hpp")}
            className={`rounded-[6px] border px-3 py-1.5 text-[12px] transition-all duration-150 active:scale-[0.98] ${
              activeTab === "kalkulasi_hpp"
                ? "border-[#E5E7EB] bg-white font-semibold text-[#172335] shadow-2xs"
                : "border-transparent font-medium text-[#526174] hover:text-[#172335]"
            }`}
          >
            Kalkulasi HPP Perintah ({hppList.length})
          </button>
        </div>

        {activeTab === "jam_kerja" && (
          canRecordKjk ? (
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
          )
        )}
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
                {kjkList.map((item) => (
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
                      {item.status === "DIBEBANKAN" ? (
                        <span className="inline-flex items-center rounded-[6px] bg-[#DCFCE7] px-2 py-0.5 text-[11px] font-semibold text-[#15803D]">
                          Dibebankan
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-[6px] bg-[#FEF3C7] px-2 py-0.5 text-[11px] font-semibold text-[#B45309]">
                          Tercatat
                        </span>
                      )}
                    </td>
                    <td className="px-[12px] py-3.5 text-[12px] text-[#526174]">
                      {item.kegiatan}
                    </td>
                  </tr>
                ))}
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
                {hppList.map((item) => (
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
                      {item.statusPostingHpp === "FINAL_DIPOSTING" ? (
                        <span className="inline-flex items-center rounded-[6px] bg-[#DCFCE7] px-2.5 py-1 text-[11px] font-semibold text-[#15803D]">
                          Final Diposting
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-[6px] bg-[#FEF3C7] px-2.5 py-1 text-[11px] font-semibold text-[#B45309]">
                          WIP Dibebankan
                        </span>
                      )}
                    </td>
                    <td className="px-[12px] py-3.5 text-right">
                      <Link
                        href={`/produksi/biaya-hpp/${item.nomorSpk.toLowerCase()}`}
                        className="group inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#C96A00] hover:text-[#E88A06]"
                      >
                        <span>Lihat HPP</span>
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

            {formError && (
              <div className="mt-3 rounded-[6px] bg-[#FEE2E2] px-3 py-2 text-[12px] font-medium text-[#B91C1C] animate-slide-down">
                {formError}
              </div>
            )}

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
