"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState, LoadingState } from "@/components/ui/states";
import { hitungKebutuhanBahan } from "@/modules/produksi/kebutuhan-bahan";
import { bacaKoleksi, simpanKoleksi } from "@/modules/produksi/store";
import type { BomItem } from "../bom-produk/types";
import type { SpkItem } from "../perintah-produksi/types";
import type { PurchaseRequestItem } from "./types";

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
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return `${isoDate} · 07.00`;
  return `${d} ${BULAN_LENGKAP_ID[m - 1]} ${y} · 07.00`;
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

  const [spkList] = useState<SpkItem[]>(() => bacaKoleksi("spk"));
  const [bomList] = useState<BomItem[]>(() => bacaKoleksi("bom"));
  const [prList] = useState<PurchaseRequestItem[]>(() => bacaKoleksi("pr"));

  const targetSpk = useMemo<SpkItem | null>(
    () => spkList.find((s) => s.nomorSpk.toLowerCase() === spkQuery) ?? null,
    [spkList, spkQuery],
  );

  const relatedBom = useMemo<BomItem | null>(
    () => bomList.find((b) => b.produkKode === targetSpk?.produkKode) ?? null,
    [bomList, targetSpk?.produkKode],
  );

  const bahanSummary = useMemo(
    () =>
      targetSpk && relatedBom
        ? hitungKebutuhanBahan(targetSpk.jumlahLembar, relatedBom)
        : null,
    [targetSpk, relatedBom],
  );

  const [customJumlahDiminta, setCustomJumlahDiminta] = useState<string | null>(null);
  const jumlahDiminta = customJumlahDiminta ?? bahanSummary?.kekuranganText ?? "";
  const setJumlahDiminta = (val: string) => setCustomJumlahDiminta(val);

  const [customDeadline, setCustomDeadline] = useState<string | null>(null);
  const dibutuhkanPalingLambat =
    customDeadline ?? formatTanggalDeadline(targetSpk?.tanggalMulaiISO ?? "");
  const setDibutuhkanPalingLambat = (val: string) => setCustomDeadline(val);

  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});

  const existingPrForSpk = useMemo(
    () =>
      prList.find(
        (pr) => pr.nomorSpk.toLowerCase() === targetSpk?.nomorSpk.toLowerCase(),
      ) ?? null,
    [prList, targetSpk?.nomorSpk],
  );

  const formatTonDisplay = (val: number) =>
    `${val.toLocaleString("id-ID", {
      minimumFractionDigits: Number.isInteger(val) ? 0 : 1,
      maximumFractionDigits: 1,
    })} ton`;
  if (!targetSpk || !relatedBom || !bahanSummary) {
    return (
      <div className="w-full text-[#172335] animate-fade-in">
        <EmptyState
          judul="Perintah produksi atau versi BOM terkait tidak ditemukan."
          variant="inline"
        />
      </div>
    );
  }

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

    simpanKoleksi("pr", updatedPrList);
    simpanKoleksi("spk", updatedSpkList);

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
      <PageHeader
        title="Ajukan pembelian bahan"
        variant="cycle"
      />

      {hasErrors && (
        <Notice
          title="Permintaan belum bisa diajukan"
          tone="error"
          variant="card"
        >
          <div className="mt-0.5 space-y-0.5 text-[12px]">
            {bannerMessages.map((msg, idx) => (
              <p key={idx}>{msg}</p>
            ))}
          </div>
        </Notice>
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
                  {bahanSummary.tersediaTonText}. Hanya kekurangan yang diminta;
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
    <Suspense fallback={<LoadingState judul="Memuat formulir..." variant="inline" />}>
      <AjukanPembelianBahanContent />
    </Suspense>
  );
}
