"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { CustomSelect } from "@/components/ui/custom-select";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { SpkStepper } from "@/components/ui/spk-stepper";
import { EmptyState, LoadingState } from "@/components/ui/states";
import {
  bacaKoleksi,
  simpanHasilTercatat,
  simpanKoleksi,
} from "@/modules/produksi/store";
import type { SpkItem } from "../perintah-produksi/types";
import type { HasilProduksiSpkItem } from "./types";

const KENDALA_OPTIONS = [
  "Mesin berhenti",
  "Kapasitas tidak tersedia",
  "Bahan kurang",
  "Lainnya",
];


function parseLembarInput(val: string): number {
  const cleaned = val
    .replace(/lembar/gi, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .trim();
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? Math.floor(num) : NaN;
}

function parseTonValue(val: string): number {
  const cleaned = val.replace(/ton/gi, "").replace(",", ".").trim();
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : NaN;
}

function formatTonId(num: number): string {
  if (Math.abs(num) < 0.0001) return "0 ton";
  return `${num.toLocaleString("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ton`;
}

function CatatHasilSpkContent({ initialNomorSpk }: { initialNomorSpk?: string }) {
  const router = useRouter();
  const params = useParams<{ nomorSpk: string }>();

  const slug = (initialNomorSpk ?? params?.nomorSpk ?? "spk-2611-013").toLowerCase();

  const [hasilList] = useState<HasilProduksiSpkItem[]>(() =>
    bacaKoleksi("hasilProduksi"),
  );
  const [spkList] = useState<SpkItem[]>(() => bacaKoleksi("spk"));

  const currentSpk = useMemo<HasilProduksiSpkItem | null>(
    () =>
      hasilList.find((item) => item.nomorSpk.toLowerCase() === slug) ?? null,
    [hasilList, slug],
  );

  const targetLembar = currentSpk?.targetLembar ?? 0;
  const dikeluarkanTon = (() => {
    const bagian = currentSpk?.bahanDiterimaText.split("·")[0] ?? "";
    const nilai = parseTonValue(bagian);
    return Number.isFinite(nilai) ? nilai : 0;
  })();

  // Form states
  const [jumlahJadiInput, setJumlahJadiInput] = useState<string>(
    `${targetLembar} lembar`
  );
  const [selesaiPadaInput, setSelesaiPadaInput] = useState<string>(
    "28 November 2026 · 15.30"
  );
  const [terpakaiInput, setTerpakaiInput] = useState<string>("4,22 ton");
  const [scrapInput, setScrapInput] = useState<string>("0,08 ton");

  // Kendala & Jadwal Ulang states
  const [kendala, setKendala] = useState<string>("Mesin berhenti");
  const [keteranganKendala, setKeteranganKendala] = useState<string>(
    "Elektroda mesin las 1 diganti, berhenti 3 jam."
  );
  const [jadwalUlang, setJadwalUlang] = useState<string>(
    "29 November 2026 · Mesin las 2"
  );

  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const parsedJumlahJadi = parseLembarInput(jumlahJadiInput);
  const validJumlahJadi =
    Number.isFinite(parsedJumlahJadi) && parsedJumlahJadi >= 0
      ? Math.min(parsedJumlahJadi, targetLembar)
      : targetLembar;

  const barangDalamProses = Math.max(0, targetLembar - validJumlahJadi);
  const isKurangDariTarget =
    Number.isFinite(parsedJumlahJadi) &&
    parsedJumlahJadi >= 0 &&
    parsedJumlahJadi < targetLembar;

  const sisaDikembalikanText = useMemo(() => {
    const terpakai = parseTonValue(terpakaiInput);
    const scrap = parseTonValue(scrapInput);
    if (!Number.isFinite(terpakai) || !Number.isFinite(scrap)) return "0 ton";
    const sisa = Number((dikeluarkanTon - (terpakai + scrap)).toFixed(2));
    if (sisa <= 0) return "0 ton";
    return formatTonId(sisa);
  }, [terpakaiInput, scrapInput, dikeluarkanTon]);

  const scrapInfoText = useMemo(() => {
    const terpakai = parseTonValue(terpakaiInput);
    const scrap = parseTonValue(scrapInput);
    const totalDipakai =
      (Number.isFinite(terpakai) ? terpakai : 0) +
      (Number.isFinite(scrap) ? scrap : 0);
    const isOverTolerance =
      Number.isFinite(scrap) && totalDipakai > 0 && scrap / totalDipakai > 0.025;

    return isOverTolerance
      ? "Potongan ujung dan cacat las. Scrap di atas toleransi — perlu investigasi."
      : "Potongan ujung dan cacat las. Scrap masih dalam toleransi.";
  }, [terpakaiInput, scrapInput]);

  if (!currentSpk) {
    return (
      <div className="w-full text-[#172335] animate-fade-in">
        <EmptyState
          judul="SPK yang sedang diproses tidak ditemukan."
          variant="inline"
        />
      </div>
    );
  }


  const handleSimpan = (e: React.FormEvent) => {
    e.preventDefault();

    const qty = parseLembarInput(jumlahJadiInput);
    if (Number.isNaN(qty) || qty <= 0 || qty > targetLembar) {
      setErrorBanner(
        `Jumlah jadi harus antara 1 sampai ${targetLembar} lembar.`
      );
      return;
    }

    const terpakai = parseTonValue(terpakaiInput);
    const scrap = parseTonValue(scrapInput);
    if (
      Number.isNaN(terpakai) ||
      terpakai <= 0 ||
      Number.isNaN(scrap) ||
      scrap < 0
    ) {
      setErrorBanner(
        "Pemakaian bahan aktual (terpakai pada produk dan scrap) wajib diisi dengan angka yang valid."
      );
      return;
    }

    if (terpakai + scrap > dikeluarkanTon + 0.001) {
      setErrorBanner(
        `Total pemakaian (${formatTonId(terpakai + scrap)}) tidak boleh melebihi bahan yang dikeluarkan Gudang (${formatTonId(dikeluarkanTon)}).`
      );
      return;
    }

    if (qty < targetLembar) {
      if (!kendala.trim() || !keteranganKendala.trim() || !jadwalUlang.trim()) {
        setErrorBanner(
          "Karena hasil kurang dari target, kendala, keterangan kendala, dan jadwal ulang sisa lembar wajib diisi."
        );
        return;
      }
    }

    setErrorBanner(null);

    const updatedSpkList = spkList.map((item) =>
      item.nomorSpk.toLowerCase() === currentSpk.nomorSpk.toLowerCase()
        ? {
            ...item,
            status: "MENUNGGU_QC" as const,
            filterCategory: "hasil_dicatat" as const,
          }
        : item
    );

    const recordedPayload = {
      nomorSpk: currentSpk.nomorSpk,
      produkNama: currentSpk.produkNama,
      jumlahJadi: qty,
      scrapText: formatTonId(scrap),
      selesaiPada: selesaiPadaInput.trim() || "28 Nov 15.30",
    };

    simpanKoleksi("spk", updatedSpkList);
    simpanHasilTercatat(recordedPayload);

    router.push(
      `/produksi/hasil-produksi/${currentSpk.nomorSpk.toLowerCase()}/riwayat`
    );
  };

  return (
    <div className="w-full text-[#172335] animate-fade-in">
      <PageHeader
        title={`Catat hasil ${currentSpk.nomorSpk}`}
        variant="cycle"
      />

      {errorBanner && (
        <Notice
          title="Hasil produksi belum bisa disimpan"
          tone="error"
          variant="card"
        >
          <p className="mt-0.5 text-[12px]">{errorBanner}</p>
        </Notice>
      )}

      {isKurangDariTarget ? (
        <Notice
          title={`Hasil ${validJumlahJadi} dari ${targetLembar} lembar`}
          tone="warning"
          variant="card"
        >
          <p className="mt-0.5 text-[12px] text-[#B45309]">
            Catat kendalanya. {validJumlahJadi} lembar dikirim ke QC;{" "}
            {barangDalamProses} lembar sisanya dijadwalkan ulang.
          </p>
        </Notice>
      ) : (
        <SpkStepper activeStep={3} />
      )}

      <form onSubmit={handleSimpan}>
        {/* Card 1: Hasil */}
        <section className="shadow-card mt-4 rounded-[10px] border border-transparent bg-white p-5">
          <h2 className="text-[15px] font-semibold text-[#172335]">
            Hasil
          </h2>
          <p className="mt-1 text-xs text-[#526174]">* Wajib diisi.</p>

          <div className="mt-4 grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-[#172335]">
                Jumlah jadi *
              </label>
              <input
                type="text"
                value={jumlahJadiInput}
                onChange={(e) => {
                  setJumlahJadiInput(e.target.value);
                  if (errorBanner) setErrorBanner(null);
                }}
                placeholder={`Contoh: ${targetLembar} lembar`}
                className="mt-1.5 w-full rounded-[8px] border border-[#E5E7EB] bg-white px-3.5 py-2 text-[13px] text-[#172335] transition outline-none focus:border-[#E88A06] focus:ring-2 focus:ring-[#E88A06]/15"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#172335]">
                Barang dalam proses
              </label>
              <input
                type="text"
                readOnly
                value={`${barangDalamProses} lembar`}
                className="mt-1.5 w-full cursor-default rounded-[8px] border border-[#E5E7EB] bg-[#F1F3F6] px-3.5 py-2 text-[13px] text-[#172335] outline-none"
              />
              <p className="mt-1.5 text-[11px] text-[#526174]">
                Lembar yang belum selesai dilas.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#172335]">
                Selesai pada
              </label>
              <input
                type="text"
                value={selesaiPadaInput}
                onChange={(e) => setSelesaiPadaInput(e.target.value)}
                className="mt-1.5 w-full rounded-[8px] border border-[#E5E7EB] bg-white px-3.5 py-2 text-[13px] text-[#172335] transition outline-none focus:border-[#E88A06] focus:ring-2 focus:ring-[#E88A06]/15"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#172335]">
                Operator
              </label>
              <input
                type="text"
                readOnly
                value="—"
                className="mt-1.5 w-full cursor-default rounded-[8px] border border-[#E5E7EB] bg-[#F1F3F6] px-3.5 py-2 text-[13px] text-[#172335] outline-none"
              />
            </div>
          </div>
        </section>

        {/* Card 2: Pemakaian bahan aktual */}
        <section className="shadow-card mt-4 rounded-[10px] border border-transparent bg-white p-5">
          <h2 className="text-[15px] font-semibold text-[#172335]">
            Pemakaian bahan aktual
          </h2>

          <div className="mt-4 grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-[#172335]">
                Dikeluarkan Gudang
              </label>
              <input
                type="text"
                readOnly
                value={formatTonId(dikeluarkanTon)}
                className="mt-1.5 w-full cursor-default rounded-[8px] border border-[#E5E7EB] bg-[#F1F3F6] px-3.5 py-2 text-[13px] text-[#172335] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#172335]">
                Terpakai pada produk *
              </label>
              <input
                type="text"
                value={terpakaiInput}
                onChange={(e) => {
                  setTerpakaiInput(e.target.value);
                  if (errorBanner) setErrorBanner(null);
                }}
                className="mt-1.5 w-full rounded-[8px] border border-[#E5E7EB] bg-white px-3.5 py-2 text-[13px] text-[#172335] transition outline-none focus:border-[#E88A06] focus:ring-2 focus:ring-[#E88A06]/15"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#172335]">
                Scrap *
              </label>
              <input
                type="text"
                value={scrapInput}
                onChange={(e) => {
                  setScrapInput(e.target.value);
                  if (errorBanner) setErrorBanner(null);
                }}
                className="mt-1.5 w-full rounded-[8px] border border-[#E5E7EB] bg-white px-3.5 py-2 text-[13px] text-[#172335] transition outline-none focus:border-[#E88A06] focus:ring-2 focus:ring-[#E88A06]/15"
              />
              <p className="mt-1.5 text-[11px] leading-relaxed text-[#526174]">
                {scrapInfoText}
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#172335]">
                Sisa dikembalikan ke Gudang
              </label>
              <input
                type="text"
                readOnly
                value={sisaDikembalikanText}
                className="mt-1.5 w-full cursor-default rounded-[8px] border border-[#E5E7EB] bg-[#F1F3F6] px-3.5 py-2 text-[13px] text-[#172335] outline-none"
              />
            </div>
          </div>
        </section>

        {/* Card 3: Kendala dan jadwal ulang */}
        {isKurangDariTarget && (
          <section className="shadow-card mt-4 rounded-[10px] border border-transparent bg-white p-5">
            <h2 className="text-[15px] font-semibold text-[#172335]">
              Kendala dan jadwal ulang
            </h2>

            <div className="mt-4 grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-[#172335]">
                  Kendala *
                </label>
                <CustomSelect
                  value={kendala}
                  onChange={(val) => setKendala(val)}
                  options={KENDALA_OPTIONS}
                  placeholder="Pilih kendala..."
                />
                <p className="mt-1.5 text-[11px] text-[#526174]">
                  Pilihan: mesin berhenti, kapasitas tidak tersedia, bahan
                  kurang, lainnya.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#172335]">
                  Keterangan *
                </label>
                <input
                  type="text"
                  value={keteranganKendala}
                  onChange={(e) => setKeteranganKendala(e.target.value)}
                  placeholder="Jelaskan kendala produksi..."
                  className="mt-1.5 w-full rounded-[8px] border border-[#E5E7EB] bg-white px-3.5 py-2 text-[13px] text-[#172335] transition outline-none focus:border-[#E88A06] focus:ring-2 focus:ring-[#E88A06]/15"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-[#172335]">
                  Jadwal ulang {barangDalamProses} lembar *
                </label>
                <input
                  type="text"
                  value={jadwalUlang}
                  onChange={(e) => setJadwalUlang(e.target.value)}
                  placeholder="Contoh: 29 November 2026 · Mesin las 2"
                  className="mt-1.5 w-full rounded-[8px] border border-[#E5E7EB] bg-white px-3.5 py-2 text-[13px] text-[#172335] transition outline-none focus:border-[#E88A06] focus:ring-2 focus:ring-[#E88A06]/15"
                />
              </div>
            </div>
          </section>
        )}

        {/* Action Buttons Row */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="rounded-[8px] bg-[#E88A06] px-4 py-2 text-[13px] font-semibold text-white shadow-2xs transition-all duration-150 ease-out hover:bg-[#D17B05] active:scale-[0.98]"
          >
            {isKurangDariTarget
              ? `Simpan, kirim ${validJumlahJadi} lembar ke QC`
              : "Simpan, kirim ke QC"}
          </button>

          <Link
            href="/produksi/hasil-produksi"
            className="rounded-[8px] border border-[#E5E7EB] bg-white px-4 py-2 text-[13px] font-semibold text-[#172335] transition-all duration-150 ease-out hover:bg-slate-50 active:scale-[0.98]"
          >
            Batal
          </Link>


        </div>
      </form>
    </div>
  );
}

export function CatatHasilSpkScreen({ nomorSpk }: { nomorSpk?: string }) {
  return (
    <Suspense fallback={<LoadingState judul="Memuat formulir..." variant="inline" />}>
      <CatatHasilSpkContent initialNomorSpk={nomorSpk} />
    </Suspense>
  );
}
