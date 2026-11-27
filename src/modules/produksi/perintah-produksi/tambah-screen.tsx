"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { CustomSelect } from "@/components/ui/custom-select";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { BomItem, INITIAL_BOM_LIST } from "../bom-produk/types";
import { ProduksiSubnav } from "../components/produksi-subnav";
import {
  INITIAL_SPK_LIST,
  MESIN_OPTIONS,
  SpkItem,
  STOK_BAHAN_TERSEDIA_TON,
} from "./types";

const BOM_STORAGE_KEY = "lionmesh_bom_list_v1";
const SPK_STORAGE_KEY = "lionmesh_spk_list_v1";

const BULAN_ID = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agt",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

function parseLembar(val: string): number {
  const cleaned = val.replace(/lembar/gi, "").replace(/\./g, "").replace(",", ".").trim();
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? Math.floor(num) : NaN;
}

function parsePercent(val: string): number {
  const num = parseFloat(val.replace("%", "").replace(",", ".").trim());
  return Number.isFinite(num) ? num : 0;
}

function formatJadwalRange(mulaiISO: string, selesaiISO: string): string {
  if (!mulaiISO || !selesaiISO) return "-";
  const [, m1, d1] = mulaiISO.split("-").map(Number);
  const [, m2, d2] = selesaiISO.split("-").map(Number);
  if (!m1 || !d1 || !m2 || !d2) return `${mulaiISO} – ${selesaiISO}`;
  if (m1 === m2) {
    return `${d1}–${d2} ${BULAN_ID[m1 - 1]}`;
  }
  return `${d1} ${BULAN_ID[m1 - 1]}–${d2} ${BULAN_ID[m2 - 1]}`;
}

interface FormErrors {
  produk?: string;
  jumlah?: string;
  versiBom?: string;
  mesin?: string;
  mulai?: string;
  selesai?: string;
}

export function TambahPerintahProduksiScreen() {
  const router = useRouter();
  const mulaiRef = useRef<HTMLInputElement>(null);
  const selesaiRef = useRef<HTMLInputElement>(null);

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

  // Hanya produk yang memiliki versi BOM berlaku
  const produkOptions = useMemo(
    () => bomList.map((b) => `${b.produkNama} · ${b.produkKode}`),
    [bomList]
  );

  // Default awal sesuai desain Figma PRD-02b (Wiremesh M6 · WM-M6, 120 lembar)
  const [selectedProdukLabel, setSelectedProdukLabel] = useState<string>(
    "Wiremesh M6 · WM-M6"
  );
  const [jumlahInput, setJumlahInput] = useState<string>("120 lembar");
  const [selectedMesin, setSelectedMesin] = useState<string>("Mesin las 1");
  const [mulaiISO, setMulaiISO] = useState<string>("2026-11-27");
  const [selesaiISO, setSelesaiISO] = useState<string>("2026-11-28");
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});

  const activeBom = useMemo(() => {
    const kode = selectedProdukLabel.split(" · ")[1] || "WM-M6";
    return (
      bomList.find((b) => b.produkKode === kode) ??
      bomList[0] ??
      INITIAL_BOM_LIST[0]
    );
  }, [bomList, selectedProdukLabel]);

  const versiBomLabel = useMemo(() => {
    if (!activeBom) return "Tidak ada versi BOM berlaku";
    return `v${activeBom.versiNumber} · berlaku sejak ${activeBom.berlakuDari}`;
  }, [activeBom]);

  const [customVersiBom, setCustomVersiBom] = useState<string | null>(null);
  const selectedVersiBom = customVersiBom ?? versiBomLabel;

  // Perhitungan kebutuhan bahan otomatis
  const kebutuhanKalkulasi = useMemo(() => {
    const qty = parseLembar(jumlahInput);
    const validQty = Number.isFinite(qty) && qty > 0 ? qty : 0;
    const perLembarKg = activeBom?.jumlahPerLembarKg ?? 35.3;
    const scrapPct = parsePercent(activeBom?.toleransiScrap ?? "1,5%");

    const totalKg = validQty * perLembarKg * (1 + scrapPct / 100);
    const totalTon = totalKg / 1000;
    const stokTersediaTon =
      STOK_BAHAN_TERSEDIA_TON[activeBom?.komponenKode ?? "BB-WR06"] ?? 3.2;

    return {
      perLembarText: `${perLembarKg.toLocaleString("id-ID", {
        minimumFractionDigits: 1,
      })} kg + scrap ${activeBom?.toleransiScrap ?? "1,5%"}`,
      totalTonText: `${totalTon.toLocaleString("id-ID", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })} ton`,
      tersediaTonText: `${stokTersediaTon.toLocaleString("id-ID", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })} ton`,
      isKurang: totalTon > stokTersediaTon,
    };
  }, [jumlahInput, activeBom]);

  const openPickerSafe = (input: HTMLInputElement | null) => {
    if (!input) return;
    try {
      if (typeof input.showPicker === "function") {
        input.showPicker();
      } else {
        input.focus();
      }
    } catch {
      input.focus();
    }
  };

  const handleSimpan = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: FormErrors = {};

    if (!activeBom) {
      nextErrors.produk = "Produk harus memiliki versi BOM yang berlaku.";
    }

    const qty = parseLembar(jumlahInput);
    if (Number.isNaN(qty) || qty <= 0) {
      nextErrors.jumlah = "Jumlah produksi harus lebih dari 0 lembar.";
    }

    if (!selectedVersiBom) {
      nextErrors.versiBom = "Versi BOM wajib dipilih.";
    }

    if (!selectedMesin) {
      nextErrors.mesin = "Mesin produksi wajib dipilih.";
    }

    if (!mulaiISO) {
      nextErrors.mulai = "Tanggal mulai wajib diisi.";
    }

    if (!selesaiISO) {
      nextErrors.selesai = "Tanggal selesai wajib diisi.";
    } else if (mulaiISO && selesaiISO < mulaiISO) {
      nextErrors.selesai = "Tanggal selesai tidak boleh sebelum tanggal mulai SPK.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});

    const nextSeq = 13 + Math.max(0, spkList.length - INITIAL_SPK_LIST.length);
    const nomorSpkBaru = `SPK-2611-${String(nextSeq).padStart(3, "0")}`;

    const newSpk: SpkItem = {
      id: nomorSpkBaru.toLowerCase(),
      nomorSpk: nomorSpkBaru,
      sumberInfo: "dari SO-2611-015",
      produkNama: activeBom.produkNama,
      produkKode: activeBom.produkKode,
      versiBom: `v${activeBom.versiNumber}`,
      mesin: selectedMesin,
      jumlahLembar: qty,
      jadwalText: formatJadwalRange(mulaiISO, selesaiISO),
      tanggalMulaiISO: mulaiISO,
      tanggalSelesaiISO: selesaiISO,
      status: "DIRENCANAKAN",
      filterCategory: "direncanakan",
    };

    const updatedSpkList = [newSpk, ...spkList];
    try {
      sessionStorage.setItem(SPK_STORAGE_KEY, JSON.stringify(updatedSpkList));
    } catch {
      // Abaikan
    }

    router.push(`/produksi/perintah-produksi/${nomorSpkBaru.toLowerCase()}?saved=1`);
  };

  const errorMessages = Object.values(fieldErrors).filter(Boolean) as string[];
  const hasErrors = errorMessages.length > 0;

  return (
    <div className="w-full text-[#172335] animate-fade-in">
      <ProduksiSubnav />

      <PageHeader
        back={{ href: "/produksi/perintah-produksi", label: "Perintah produksi" }}
        breadcrumb={[
          { href: "/produksi", label: "Siklus Produksi" },
          "PR-002 Membuat perintah produksi",
        ]}
        title="Tambah perintah produksi"
        variant="cycle"
      />

      {hasErrors && (
        <Notice className="mt-2.5" tone="error" variant="card">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-[12px]">
            <p className="font-semibold">
              Perintah produksi belum bisa disimpan:
            </p>
            <p>{errorMessages.join(" • ")}</p>
          </div>
        </Notice>
      )}

      <form onSubmit={handleSimpan}>
        {/* Card 1: Data perintah produksi */}
        <section className="shadow-card mt-3 rounded-[10px] border border-transparent bg-white px-5 py-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[15px] font-semibold text-[#172335]">
              Data perintah produksi
            </h2>
            <span className="text-[11px] text-[#526174]">* Wajib diisi.</span>
          </div>

          <div className="mt-2.5 grid grid-cols-1 gap-x-5 gap-y-2.5 md:grid-cols-2">
            {/* Baris 1 Kiri: Produk * */}
            <div>
              <label className="block text-xs font-medium text-[#172335]">
                Produk *
              </label>
              <CustomSelect
                value={selectedProdukLabel}
                onChange={(val) => {
                  setSelectedProdukLabel(val);
                  if (fieldErrors.produk) {
                    setFieldErrors((prev) => ({ ...prev, produk: undefined }));
                  }
                }}
                options={produkOptions}
                placeholder="Pilih produk..."
              />
            </div>

            {/* Baris 1 Kanan: Jumlah * */}
            <div>
              <label className="block text-xs font-medium text-[#172335]">
                Jumlah *
              </label>
              <input
                type="text"
                value={jumlahInput}
                onChange={(e) => {
                  setJumlahInput(e.target.value);
                  if (fieldErrors.jumlah) {
                    setFieldErrors((prev) => ({ ...prev, jumlah: undefined }));
                  }
                }}
                placeholder="Contoh: 120 lembar"
                className={`mt-1.5 w-full rounded-[8px] border bg-white px-3.5 py-1.5 text-[13px] text-[#172335] outline-none transition ${
                  fieldErrors.jumlah
                    ? "border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/15"
                    : "border-[#E5E7EB] focus:border-[#E88A06] focus:ring-2 focus:ring-[#E88A06]/15"
                }`}
              />
              {fieldErrors.jumlah && (
                <p className="mt-0.5 text-[11px] font-medium text-[#DC2626]">
                  {fieldErrors.jumlah}
                </p>
              )}
            </div>

            {/* Baris 2 Kiri: Versi BOM * */}
            <div>
              <label className="block text-xs font-medium text-[#172335]">
                Versi BOM *
              </label>
              <CustomSelect
                value={selectedVersiBom}
                onChange={(val) => setCustomVersiBom(val)}
                options={[versiBomLabel]}
                placeholder="Pilih versi BOM..."
              />
            </div>

            {/* Baris 2 Kanan: Mesin * */}
            <div>
              <label className="block text-xs font-medium text-[#172335]">
                Mesin *
              </label>
              <CustomSelect
                value={selectedMesin}
                onChange={(val) => {
                  setSelectedMesin(val);
                  if (fieldErrors.mesin) {
                    setFieldErrors((prev) => ({ ...prev, mesin: undefined }));
                  }
                }}
                options={MESIN_OPTIONS}
                placeholder="Pilih mesin..."
              />
            </div>

            {/* Baris 3 Kiri: Mulai * */}
            <div>
              <label className="block text-xs font-medium text-[#172335]">
                Mulai *
              </label>
              <input
                ref={mulaiRef}
                type="date"
                value={mulaiISO}
                onClick={() => openPickerSafe(mulaiRef.current)}
                onChange={(e) => {
                  setMulaiISO(e.target.value);
                  if (fieldErrors.mulai) {
                    setFieldErrors((prev) => ({ ...prev, mulai: undefined }));
                  }
                }}
                className={`mt-1.5 w-full cursor-pointer rounded-[8px] border bg-white px-3.5 py-1.5 text-[13px] text-[#172335] outline-none transition ${
                  fieldErrors.mulai
                    ? "border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/15"
                    : "border-[#E5E7EB] focus:border-[#E88A06] focus:ring-2 focus:ring-[#E88A06]/15"
                }`}
              />
              {fieldErrors.mulai && (
                <p className="mt-0.5 text-[11px] font-medium text-[#DC2626]">
                  {fieldErrors.mulai}
                </p>
              )}
            </div>

            {/* Baris 3 Kanan: Selesai * */}
            <div>
              <label className="block text-xs font-medium text-[#172335]">
                Selesai *
              </label>
              <input
                ref={selesaiRef}
                type="date"
                value={selesaiISO}
                onClick={() => openPickerSafe(selesaiRef.current)}
                onChange={(e) => {
                  setSelesaiISO(e.target.value);
                  if (fieldErrors.selesai) {
                    setFieldErrors((prev) => ({ ...prev, selesai: undefined }));
                  }
                }}
                className={`mt-1.5 w-full cursor-pointer rounded-[8px] border bg-white px-3.5 py-1.5 text-[13px] text-[#172335] outline-none transition ${
                  fieldErrors.selesai
                    ? "border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/15"
                    : "border-[#E5E7EB] focus:border-[#E88A06] focus:ring-2 focus:ring-[#E88A06]/15"
                }`}
              />
              {fieldErrors.selesai && (
                <p className="mt-0.5 text-[11px] font-medium text-[#DC2626]">
                  {fieldErrors.selesai}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Card 2: Kebutuhan bahan (otomatis) */}
        <section className="shadow-card mt-3 flex flex-col gap-[10px] rounded-[10px] border border-transparent bg-white px-5 py-3.5">
          <h2 className="text-[15px] leading-none font-semibold text-[#172335]">
            Kebutuhan bahan (otomatis)
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-[#F3F4F6] text-[12px] font-semibold text-[#526174]">
                  <th className="rounded-l-[6px] px-[12px] py-2">Bahan</th>
                  <th className="px-[12px] py-2">Per lembar</th>
                  <th className="px-[12px] py-2">Total</th>
                  <th className="rounded-r-[6px] px-[12px] py-2">Tersedia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]/80">
                <tr>
                  <td className="px-[12px] py-2.5 text-[13px] text-[#172335]">
                    {activeBom.komponenNama} · {activeBom.komponenKode}
                  </td>
                  <td className="px-[12px] py-2.5 text-[13px] text-[#172335] tabular-nums">
                    {kebutuhanKalkulasi.perLembarText}
                  </td>
                  <td className="px-[12px] py-2.5 text-[13px] font-medium text-[#172335] tabular-nums">
                    {kebutuhanKalkulasi.totalTonText}
                  </td>
                  <td className="px-[12px] py-2.5 text-[13px] text-[#172335] tabular-nums">
                    {kebutuhanKalkulasi.tersediaTonText}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Action Buttons Row */}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="rounded-[8px] bg-[#E88A06] px-4 py-2 text-[13px] font-semibold text-white shadow-2xs transition-all duration-150 ease-out hover:bg-[#D17B05] active:scale-[0.98]"
          >
            Simpan
          </button>

          <Link
            href="/produksi/perintah-produksi"
            className="rounded-[8px] border border-[#E5E7EB] bg-white px-4 py-2 text-[13px] font-semibold text-[#172335] transition-all duration-150 ease-out hover:bg-slate-50 active:scale-[0.98]"
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}
