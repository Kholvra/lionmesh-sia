"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { ArrowIcon } from "@/components/ui/arrow-icon";
import { BomItem, INITIAL_BOM_LIST } from "../bom-produk/types";
import { ProduksiSubnav } from "../components/produksi-subnav";
import {
  INITIAL_SPK_LIST,
  SpkItem,
  STOK_BAHAN_TERSEDIA_TON,
} from "../perintah-produksi/types";
import { INITIAL_PR_LIST, PurchaseRequestItem } from "./types";

const SPK_STORAGE_KEY = "lionmesh_spk_list_v1";
const BOM_STORAGE_KEY = "lionmesh_bom_list_v1";
const PR_STORAGE_KEY = "lionmesh_pr_list_v1";

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

function formatTanggalDeadline(isoDate: string): string {
  if (!isoDate) return "27 November 2026 · 07.00";
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return `${isoDate} · 07.00`;
  return `${d} ${BULAN_LENGKAP_ID[m - 1]} ${y} · 07.00`;
}

function parsePercent(val: string): number {
  const num = parseFloat(val.replace("%", "").replace(",", ".").trim());
  return Number.isFinite(num) ? num : 0;
}

function parseTonInput(val: string): number {
  const cleaned = val.replace(/ton/gi, "").replace(",", ".").trim();
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : NaN;
}

interface FormErrors {
  jumlahBanner?: string;
  jumlahField?: string;
  deadlineBanner?: string;
  deadlineField?: string;
}

function AjukanPembelianBahanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const spkQuery = (searchParams.get("spk") ?? "spk-2611-013").toLowerCase();

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

  const [prList] = useState<PurchaseRequestItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const savedPr = sessionStorage.getItem(PR_STORAGE_KEY);
        if (savedPr) {
          const parsed = JSON.parse(savedPr) as PurchaseRequestItem[];
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {
        // Abaikan
      }
    }
    return INITIAL_PR_LIST;
  });

  const targetSpk = useMemo<SpkItem>(() => {
    const found = spkList.find((s) => s.nomorSpk.toLowerCase() === spkQuery);
    if (found) return found;

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
  }, [spkList, spkQuery]);

  const relatedBom = useMemo(() => {
    return (
      bomList.find((b) => b.produkKode === targetSpk.produkKode) ??
      INITIAL_BOM_LIST[0]
    );
  }, [bomList, targetSpk.produkKode]);

  const bahanSummary = useMemo(() => {
    const perLembarKg = relatedBom.jumlahPerLembarKg;
    const scrapPct = parsePercent(relatedBom.toleransiScrap);
    const totalKg = targetSpk.jumlahLembar * perLembarKg * (1 + scrapPct / 100);
    const kebutuhanTon = Number((totalKg / 1000).toFixed(1));
    const tersediaTon = Number(
      (STOK_BAHAN_TERSEDIA_TON[relatedBom.komponenKode] ?? 3.2).toFixed(1)
    );
    const kekuranganTon = Number(
      Math.max(0.1, kebutuhanTon - tersediaTon).toFixed(1)
    );

    return {
      kebutuhanTon,
      tersediaTon,
      kekuranganTon,
      kebutuhanText: `${kebutuhanTon.toLocaleString("id-ID", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })} ton`,
      tersediaText: `${tersediaTon.toLocaleString("id-ID", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })} ton`,
      kekuranganText: `${kekuranganTon.toLocaleString("id-ID", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })} ton`,
    };
  }, [relatedBom, targetSpk.jumlahLembar]);

  const [customJumlahDiminta, setCustomJumlahDiminta] = useState<string | null>(null);
  const jumlahDiminta = customJumlahDiminta ?? bahanSummary.kekuranganText;
  const setJumlahDiminta = (val: string) => setCustomJumlahDiminta(val);

  const [customDeadline, setCustomDeadline] = useState<string | null>(null);
  const dibutuhkanPalingLambat = customDeadline ?? formatTanggalDeadline(targetSpk.tanggalMulaiISO);
  const setDibutuhkanPalingLambat = (val: string) => setCustomDeadline(val);

  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});

  const existingPrForSpk = useMemo(() => {
    return (
      prList.find(
        (pr) => pr.nomorSpk.toLowerCase() === targetSpk.nomorSpk.toLowerCase()
      ) ?? null
    );
  }, [prList, targetSpk.nomorSpk]);

  const formatTonDisplay = (val: number) =>
    `${val.toLocaleString("id-ID", {
      minimumFractionDigits: Number.isInteger(val) ? 0 : 1,
      maximumFractionDigits: 1,
    })} ton`;

  const handleContohMelebihiKebutuhan = () => {
    const contohLebih = "2 ton";
    setJumlahDiminta(contohLebih);
    setFieldErrors({
      jumlahBanner: `Jumlah ${contohLebih} melebihi kekurangan ${targetSpk.nomorSpk} (${bahanSummary.kekuranganText}). Permintaan hanya untuk selisih kebutuhan dan stok tersedia.`,
      jumlahField: `Maksimal ${bahanSummary.kekuranganText} untuk SPK ini.`,
    });
  };

  const handleAjukan = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: FormErrors = {};

    const parsedTon = parseTonInput(jumlahDiminta);

    if (Number.isNaN(parsedTon) || parsedTon <= 0) {
      nextErrors.jumlahBanner = "Jumlah diminta harus lebih dari 0 ton.";
      nextErrors.jumlahField = "Jumlah diminta wajib lebih dari 0 ton.";
    } else if (parsedTon > bahanSummary.kekuranganTon + 0.001) {
      const formattedVal = formatTonDisplay(parsedTon);
      nextErrors.jumlahBanner = `Jumlah ${formattedVal} melebihi kekurangan ${targetSpk.nomorSpk} (${bahanSummary.kekuranganText}). Permintaan hanya untuk selisih kebutuhan dan stok tersedia.`;
      nextErrors.jumlahField = `Maksimal ${bahanSummary.kekuranganText} untuk SPK ini.`;
    }

    if (!dibutuhkanPalingLambat.trim()) {
      nextErrors.deadlineBanner = "Waktu dibutuhkan paling lambat wajib diisi.";
      nextErrors.deadlineField = "Wajib diisi.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});

    const nextSeq = 10 + prList.length;
    const nomorPrBaru = `PR-2611-${String(nextSeq).padStart(3, "0")}`;

    const newPr: PurchaseRequestItem = {
      id: nomorPrBaru.toLowerCase(),
      nomorPr: nomorPrBaru,
      nomorSpk: targetSpk.nomorSpk,
      produkLabel: `${targetSpk.nomorSpk} · ${targetSpk.produkNama} · ${targetSpk.jumlahLembar} lembar`,
      bahanNama: relatedBom.komponenNama,
      bahanKode: relatedBom.komponenKode,
      jumlahDimintaTon: parsedTon,
      dibutuhkanPalingLambat: dibutuhkanPalingLambat.trim(),
      status: "DIPERIKSA_PURCHASING",
      createdAtShort: "21 Nov 2026",
    };

    const updatedPrList = [newPr, ...prList];
    const updatedSpkList = spkList.map((item) =>
      item.nomorSpk.toLowerCase() === targetSpk.nomorSpk.toLowerCase()
        ? {
            ...item,
            status: "MENUNGGU_BAHAN" as const,
            filterCategory: "menunggu_bahan" as const,
          }
        : item
    );

    try {
      sessionStorage.setItem(PR_STORAGE_KEY, JSON.stringify(updatedPrList));
      sessionStorage.setItem(SPK_STORAGE_KEY, JSON.stringify(updatedSpkList));
    } catch {
      // Abaikan jika sessionStorage tidak tersedia
    }

    router.push(
      `/produksi/pembelian-bahan/daftar?submitted=${encodeURIComponent(nomorPrBaru)}`
    );
  };

  const bannerMessages = [
    fieldErrors.jumlahBanner,
    fieldErrors.deadlineBanner,
  ].filter(Boolean) as string[];
  const hasErrors = bannerMessages.length > 0;

  return (
    <div className="w-full text-[#172335] animate-fade-in">
      <ProduksiSubnav />

      {/* Back Link ke SPK terkait */}
      <Link
        href={`/produksi/perintah-produksi/${targetSpk.nomorSpk.toLowerCase()}`}
        className="group inline-flex items-center gap-1.5 text-xs font-semibold text-[#C96A00] hover:text-[#E88A06]"
      >
        <ArrowIcon
          direction="left"
          className="transition-transform duration-150 group-hover:-translate-x-0.5"
        />
        <span>{targetSpk.nomorSpk}</span>
      </Link>

      {/* Breadcrumb */}
      <nav className="mt-2 text-xs font-medium text-[#526174]">
        <Link
          href="/produksi"
          className="text-[#C96A00] underline decoration-[#C96A00]/60 underline-offset-2 hover:text-[#E88A06]"
        >
          Siklus Produksi
        </Link>
        <span className="mx-1.5">/</span>
        <span>PR-003 Mengajukan pembelian bahan</span>
      </nav>

      {/* Page Title */}
      <h1 className="mt-1.5 text-[28px] leading-tight font-bold tracking-tight text-[#172335]">
        Ajukan pembelian bahan
      </h1>

      {/* Banner Error Validasi */}
      {hasErrors && (
        <div className="mt-4 rounded-[10px] border border-[#FECACA] bg-[#FEE2E2]/80 px-5 py-3 text-[#B91C1C] animate-slide-down">
          <p className="text-[13px] font-semibold">
            Permintaan belum bisa diajukan
          </p>
          <div className="mt-0.5 space-y-0.5 text-[12px]">
            {bannerMessages.map((msg, idx) => (
              <p key={idx}>{msg}</p>
            ))}
          </div>
        </div>
      )}

      {/* Form Card: Permintaan bahan */}
      <form onSubmit={handleAjukan}>
        <section className="shadow-card mt-4 rounded-[10px] border border-transparent bg-white p-5">
          <h2 className="text-[15px] font-semibold text-[#172335]">
            Permintaan bahan
          </h2>
          <p className="mt-1 text-xs text-[#526174]">* Wajib diisi.</p>

          <div className="mt-4 grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2">
            {/* Kiri Atas: Perintah produksi (Read-only) */}
            <div>
              <label className="block text-xs font-medium text-[#172335]">
                Perintah produksi
              </label>
              <input
                type="text"
                readOnly
                value={`${targetSpk.nomorSpk} · ${targetSpk.produkNama} · ${targetSpk.jumlahLembar.toLocaleString("id-ID")} lembar`}
                className="mt-1.5 w-full cursor-default rounded-[8px] border border-[#E5E7EB] bg-[#F1F3F6] px-3.5 py-2 text-[13px] text-[#172335] outline-none"
              />
            </div>

            {/* Kanan Atas: Bahan (Read-only) */}
            <div>
              <label className="block text-xs font-medium text-[#172335]">
                Bahan
              </label>
              <input
                type="text"
                readOnly
                value={`${relatedBom.komponenNama} · ${relatedBom.komponenKode}`}
                className="shadow-card mt-1.5 w-full cursor-default rounded-[8px] border border-transparent bg-[#F1F3F6] px-3.5 py-2 text-[13px] text-[#172335] outline-none"
              />
            </div>

            {/* Kiri Bawah: Jumlah diminta * */}
            <div>
              <label className="block text-xs font-medium text-[#172335]">
                Jumlah diminta *
              </label>
              <input
                type="text"
                value={jumlahDiminta}
                disabled={Boolean(existingPrForSpk)}
                onChange={(e) => {
                  setJumlahDiminta(e.target.value);
                  if (fieldErrors.jumlahBanner || fieldErrors.jumlahField) {
                    setFieldErrors((prev) => ({
                      ...prev,
                      jumlahBanner: undefined,
                      jumlahField: undefined,
                    }));
                  }
                }}
                placeholder={`Contoh: ${bahanSummary.kekuranganText}`}
                className={`mt-1.5 w-full rounded-[8px] border px-3.5 py-2 text-[13px] text-[#172335] transition outline-none ${
                  existingPrForSpk
                    ? "cursor-not-allowed border-[#E5E7EB] bg-[#F1F3F6]"
                    : fieldErrors.jumlahField
                      ? "border-[#DC2626] bg-white focus:ring-2 focus:ring-[#DC2626]/15"
                      : "border-[#E5E7EB] bg-white focus:border-[#E88A06] focus:ring-2 focus:ring-[#E88A06]/15"
                }`}
              />
              {fieldErrors.jumlahField ? (
                <p className="mt-1.5 text-[11px] font-medium text-[#DC2626]">
                  {fieldErrors.jumlahField}
                </p>
              ) : (
                <p className="shadow-card mt-1.5 text-[11px] border-transparent leading-relaxed text-[#526174]">
                  Kebutuhan {bahanSummary.kebutuhanText} − tersedia{" "}
                  {bahanSummary.tersediaText}. Hanya kekurangan yang diminta;
                  Purchasing memeriksa, Manajemen menyetujui.
                </p>
              )}
            </div>

            {/* Kanan Bawah: Dibutuhkan paling lambat * */}
            <div>
              <label className="block text-xs font-medium text-[#172335]">
                Dibutuhkan paling lambat *
              </label>
              <input
                type="text"
                value={dibutuhkanPalingLambat}
                disabled={Boolean(existingPrForSpk)}
                onChange={(e) => {
                  setDibutuhkanPalingLambat(e.target.value);
                  if (
                    fieldErrors.deadlineBanner ||
                    fieldErrors.deadlineField
                  ) {
                    setFieldErrors((prev) => ({
                      ...prev,
                      deadlineBanner: undefined,
                      deadlineField: undefined,
                    }));
                  }
                }}
                placeholder="Contoh: 27 November 2026 · 07.00"
                className={`mt-1.5 w-full rounded-[8px] border px-3.5 py-2 text-[13px] text-[#172335] transition outline-none ${
                  existingPrForSpk
                    ? "cursor-not-allowed border-[#E5E7EB] bg-[#F1F3F6]"
                    : fieldErrors.deadlineField
                      ? "border-[#DC2626] bg-white focus:ring-2 focus:ring-[#DC2626]/15"
                      : "border-[#E5E7EB] bg-white focus:border-[#E88A06] focus:ring-2 focus:ring-[#E88A06]/15"
                }`}
              />
              {fieldErrors.deadlineField && (
                <p className="mt-1.5 text-[11px] font-medium text-[#DC2626]">
                  {fieldErrors.deadlineField}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Action Buttons Row */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          {!existingPrForSpk ? (
            <>
              <button
                type="submit"
                className="rounded-[8px] bg-[#E88A06] px-4 py-2 text-[13px] font-semibold text-white shadow-2xs transition-all duration-150 ease-out hover:bg-[#D17B05] active:scale-[0.98]"
              >
                Ajukan
              </button>

              <Link
                href={`/produksi/perintah-produksi/${targetSpk.nomorSpk.toLowerCase()}`}
                className="rounded-[8px] border border-[#E5E7EB] bg-white px-4 py-2 text-[13px] font-semibold text-[#172335] transition-all duration-150 ease-out hover:bg-slate-50 active:scale-[0.98]"
              >
                Batal
              </Link>

              {!hasErrors && (
                <button
                  type="button"
                  onClick={handleContohMelebihiKebutuhan}
                  className="group inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#C96A00] transition-all duration-150 hover:text-[#E88A06] hover:underline"
                >
                  <span>Contoh melebihi kebutuhan</span>
                  <ArrowIcon className="transition-transform duration-150 group-hover:translate-x-0.5" />
                </button>
              )}
            </>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/produksi/pembelian-bahan/daftar"
                className="rounded-[8px] bg-[#E88A06] px-4 py-2 text-[13px] font-semibold text-white shadow-2xs transition-all duration-150 ease-out hover:bg-[#D17B05] active:scale-[0.98]"
              >
                Lihat daftar permintaan ({existingPrForSpk.nomorPr})
              </Link>
              <Link
                href={`/produksi/perintah-produksi/${targetSpk.nomorSpk.toLowerCase()}`}
                className="rounded-[8px] border border-[#E5E7EB] bg-white px-4 py-2 text-[13px] font-semibold text-[#172335] transition-all duration-150 ease-out hover:bg-slate-50 active:scale-[0.98]"
              >
                Kembali ke {targetSpk.nomorSpk}
              </Link>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}

export function PembelianBahanScreen() {
  return (
    <Suspense fallback={<div className="h-40 flex items-center justify-center text-sm text-[#526174]">Memuat formulir...</div>}>
      <AjukanPembelianBahanContent />
    </Suspense>
  );
}
