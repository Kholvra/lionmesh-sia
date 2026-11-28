"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useMemo, useState, useTransition } from "react";
import { CustomSelect } from "@/components/ui/custom-select";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { SpkStepper } from "@/components/ui/spk-stepper";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { catatHasil, catatQc, konfirmasiPemakaianBahan, terimaBarangJadiDariQc } from "@/modules/produksi/actions";
import { muatHasilDetail } from "@/modules/produksi/queries";
import type { HasilDetailData } from "./types";
import { useProduksiActor } from "@/modules/produksi/context/actor-context";

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
  const { can } = useProduksiActor();
  const peranBisaQc = can("inspect_qc");
  const peranBisaTerima = can("receive_finish_goods");
  const [data, setData] = useState<HasilDetailData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!initialNomorSpk) return;
    let aktif = true;
    muatHasilDetail(initialNomorSpk).then((hasil) => {
      if (!aktif) return;
      if (!hasil.ok) setError(hasil.message);
      else setData(hasil.data);
    });
    return () => {
      aktif = false;
    };
  }, [initialNomorSpk]);

  const currentSpk = data?.spk ?? null;
  const belumDikonfirmasi = (data?.pengeluaran ?? []).filter((item) => !item.sudahDikonfirmasi);
  const [selectedIssueId, setSelectedIssueId] = useState("");
  const pengeluaranTerpilih =
    belumDikonfirmasi.find((item) => item.id === selectedIssueId) ?? belumDikonfirmasi[0] ?? null;
  const targetLembar = currentSpk?.targetLembar ?? 0;
  const dikeluarkanTon = pengeluaranTerpilih ? Number(pengeluaranTerpilih.qtyKeluar) : 0;
  const hasilTerakhir = data?.hasil[data.hasil.length - 1] ?? null;
  const [jumlahJadiInput, setJumlahJadiInput] = useState("");
  const [selesaiPadaInput, setSelesaiPadaInput] = useState("");
  const [terpakaiInput, setTerpakaiInput] = useState("");
  const [scrapInput, setScrapInput] = useState("");
  const [kendala, setKendala] = useState("");
  const [keteranganKendala, setKeteranganKendala] = useState("");
  const [jadwalUlang, setJadwalUlang] = useState("");
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [qtyLulusInput, setQtyLulusInput] = useState("");
  const [qtyReworkInput, setQtyReworkInput] = useState("0");
  const [qtyRejectInput, setQtyRejectInput] = useState("0");
  const [qcCatatan, setQcCatatan] = useState("");
  const [qtyTerimaInput, setQtyTerimaInput] = useState("");

  const bisaCatat =
    currentSpk?.statusInti === "BERJALAN" || currentSpk?.statusInti === "REWORK";
  const tampilQc =
    currentSpk?.statusInti === "HASIL_DICATAT" && peranBisaQc && hasilTerakhir && !hasilTerakhir.qc;
  const tampilTerima =
    currentSpk?.statusInti === "QC_PASSED" && peranBisaTerima && hasilTerakhir?.kunciQc;

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
    if (!Number.isFinite(terpakai) || !Number.isFinite(scrap)) return "—";
    const sisa = Number((dikeluarkanTon - (terpakai + scrap)).toFixed(2));
    if (sisa <= 0) return "0 ton";
    return formatTonId(sisa);
  }, [terpakaiInput, scrapInput, dikeluarkanTon]);

  const scrapInfoText = useMemo(() => {
    const scrap = parseTonValue(scrapInput);
    return Number.isFinite(scrap) && scrap > 0
      ? "Potongan ujung dan cacat las. Scrap dicatat untuk perhitungan biaya."
      : "Potongan ujung dan cacat las. Belum ada scrap yang dicatat.";
  }, [scrapInput]);

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
        <LoadingState judul="Memuat formulir..." variant="inline" />
      </div>
    );
  }

  if (!currentSpk || (bisaCatat && pengeluaranTerpilih === null)) {
    return (
      <div className="w-full text-[#172335] animate-fade-in">
        <EmptyState
          judul="SPK yang sedang diproses atau bahan yang dikeluarkan tidak ditemukan."
          variant="inline"
        />
      </div>
    );
  }


  const handleSimpan = (e: React.FormEvent) => {
    e.preventDefault();
    if (serverError) setServerError(null);

    const qty = parseLembarInput(jumlahJadiInput);
    if (Number.isNaN(qty) || qty <= 0 || qty > targetLembar) {
      setErrorBanner(`Jumlah jadi harus antara 1 sampai ${targetLembar} lembar.`);
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
        "Pemakaian bahan aktual (terpakai pada produk dan scrap) wajib diisi dengan angka yang valid.",
      );
      return;
    }

    if (terpakai + scrap > dikeluarkanTon + 0.001) {
      setErrorBanner(
        `Total pemakaian (${formatTonId(terpakai + scrap)}) tidak boleh melebihi bahan yang dikeluarkan Gudang (${formatTonId(dikeluarkanTon)}).`,
      );
      return;
    }

    if (qty < targetLembar && (
      !kendala.trim() || !keteranganKendala.trim() || !jadwalUlang.trim()
    )) {
      setErrorBanner(
        "Karena hasil kurang dari target, kendala, keterangan kendala, dan jadwal ulang sisa lembar wajib diisi.",
      );
      return;
    }

    setErrorBanner(null);
    const waktu = selesaiPadaInput.trim() || new Date().toISOString();
    const keterangan = [
      kendala.trim(),
      keteranganKendala.trim(),
      jadwalUlang.trim(),
    ].filter(Boolean).join(" · ");
    const sisa = Number((dikeluarkanTon - (terpakai + scrap)).toFixed(4));
    const pengeluaran = pengeluaranTerpilih;
    if (!pengeluaran) {
      setErrorBanner("Pilih pengeluaran bahan yang belum dikonfirmasi.");
      return;
    }
    const bahanForm = new FormData();
    bahanForm.set("wo_id", currentSpk.woId);
    bahanForm.set("pengeluaran_id", pengeluaran.id);
    bahanForm.set("qty_terpakai", String(terpakai));
    bahanForm.set("qty_sisa", String(Math.max(0, sisa)));
    bahanForm.set("qty_scrap", String(scrap));
    bahanForm.set("tanggal", waktu);
    bahanForm.set("keterangan", keterangan);

    const hasilForm = new FormData();
    hasilForm.set("wo_id", currentSpk.woId);
    hasilForm.set("percobaan", String(data.hasil.length + 1));
    hasilForm.set("qty_diproses", String(qty));
    hasilForm.set("tanggal", waktu);
    hasilForm.set("keterangan", keterangan);

    startTransition(async () => {
      const pemakaian = await konfirmasiPemakaianBahan(bahanForm);
      if (!pemakaian.ok) {
        setServerError(pemakaian.message);
        return;
      }
      const hasilDicatat = await catatHasil(hasilForm);
      if (!hasilDicatat.ok) {
        setServerError(hasilDicatat.message);
        return;
      }
      router.push(
        `/produksi/hasil-produksi/${currentSpk.nomorSpk.toLowerCase()}/riwayat`,
      );
    });
  };

  const muatUlang = async () => {
    if (!initialNomorSpk) return;
    const hasil = await muatHasilDetail(initialNomorSpk);
    if (hasil.ok) setData(hasil.data);
  };

  const handleQc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasilTerakhir || !currentSpk) return;
    const lulus = Number(qtyLulusInput);
    const rework = Number(qtyReworkInput);
    const reject = Number(qtyRejectInput);
    const keputusan = rework > 0 ? "REWORK" : lulus > 0 ? "QC_PASSED" : "REJECTED";
    const formData = new FormData();
    formData.set("wo_id", currentSpk.woId);
    formData.set("hasil_produksi_id", hasilTerakhir.id);
    formData.set("qty_lulus", String(lulus));
    formData.set("qty_rework", String(rework));
    formData.set("qty_reject", String(reject));
    formData.set("keputusan", keputusan);
    formData.set("catatan", qcCatatan);
    startTransition(async () => {
      const hasil = await catatQc(formData);
      if (!hasil.ok) {
        setServerError(hasil.message);
        return;
      }
      setServerError(null);
      await muatUlang();
    });
  };

  const handleTerima = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSpk || !hasilTerakhir?.kunciQc) return;
    const formData = new FormData();
    formData.set("wo_id", currentSpk.woId);
    formData.set("gudang_id", currentSpk.gudangId);
    formData.set("qty", qtyTerimaInput || hasilTerakhir.qc?.qtyLulus || "");
    formData.set("tanggal", new Date().toISOString());
    formData.set("kunci_qc", hasilTerakhir.kunciQc);
    startTransition(async () => {
      const hasil = await terimaBarangJadiDariQc(formData);
      if (!hasil.ok) {
        setServerError(hasil.message);
        return;
      }
      setServerError(null);
      await muatUlang();
    });
  };

  return (
    <div className="w-full text-[#172335] animate-fade-in">
      <PageHeader
        title={`Catat hasil ${currentSpk.nomorSpk}`}
        variant="cycle"
      />

      {(errorBanner || serverError) && (
        <Notice
          title="Hasil produksi belum bisa disimpan"
          tone="error"
          variant="card"
        >
          <p className="mt-0.5 text-[12px]">{errorBanner ?? serverError}</p>
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

      {bisaCatat && (
      <form onSubmit={handleSimpan}>
        <section className="shadow-card mt-4 rounded-[10px] border border-transparent bg-white p-5">
          <h2 className="text-[15px] leading-none font-semibold text-[#172335]">Pengeluaran bahan belum dikonfirmasi</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead><tr className="bg-[#F3F4F6] text-[12px] font-semibold text-[#526174]"><th className="px-[12px] py-2">Pengeluaran</th><th className="px-[12px] py-2">Qty keluar</th></tr></thead>
              <tbody className="divide-y divide-[#E5E7EB]/80">
                {belumDikonfirmasi.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70">
                    <td className="px-[12px] py-2.5 text-[13px]">
                      <label className="flex items-center gap-2">
                        <input type="radio" name="pengeluaran" checked={pengeluaranTerpilih?.id === item.id} onChange={() => setSelectedIssueId(item.id)} />
                        {item.id}
                      </label>
                    </td>
                    <td className="px-[12px] py-2.5 text-[13px] tabular-nums">{formatTonId(Number(item.qtyKeluar))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
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
            disabled={pending}
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
      )}
      {tampilQc && hasilTerakhir && (
        <form onSubmit={handleQc} className="shadow-card mt-4 rounded-[10px] border border-transparent bg-white p-5">
          <h2 className="text-[15px] font-semibold text-[#172335]">Keputusan QC</h2>
          <p className="mt-1 text-xs text-[#526174]">Jumlah diproses: {formatTonId(Number(hasilTerakhir.qtyDiproses))}.</p>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            <label className="text-xs font-medium">Lulus<input className="mt-1 w-full rounded-[8px] border border-[#E5E7EB] px-3 py-1.5 text-[13px]" value={qtyLulusInput} onChange={(e) => setQtyLulusInput(e.target.value)} /></label>
            <label className="text-xs font-medium">Rework<input className="mt-1 w-full rounded-[8px] border border-[#E5E7EB] px-3 py-1.5 text-[13px]" value={qtyReworkInput} onChange={(e) => setQtyReworkInput(e.target.value)} /></label>
            <label className="text-xs font-medium">Reject<input className="mt-1 w-full rounded-[8px] border border-[#E5E7EB] px-3 py-1.5 text-[13px]" value={qtyRejectInput} onChange={(e) => setQtyRejectInput(e.target.value)} /></label>
          </div>
          <label className="mt-3 block text-xs font-medium">Catatan<input className="mt-1 w-full rounded-[8px] border border-[#E5E7EB] px-3 py-1.5 text-[13px]" value={qcCatatan} onChange={(e) => setQcCatatan(e.target.value)} /></label>
          <button type="submit" disabled={pending} className="mt-4 rounded-[8px] bg-[#E88A06] px-4 py-2 text-[13px] font-semibold text-white">Simpan keputusan QC</button>
        </form>
      )}
      {tampilTerima && (
        <form onSubmit={handleTerima} className="shadow-card mt-4 rounded-[10px] border border-transparent bg-white p-5">
          <h2 className="text-[15px] font-semibold text-[#172335]">Terima barang jadi</h2>
          <p className="mt-1 text-xs text-[#526174]">Kunci QC: {hasilTerakhir?.kunciQc}</p>
          <label className="mt-3 block text-xs font-medium">Jumlah diterima<input className="mt-1 w-full rounded-[8px] border border-[#E5E7EB] px-3 py-1.5 text-[13px]" value={qtyTerimaInput} onChange={(e) => setQtyTerimaInput(e.target.value)} placeholder={hasilTerakhir?.qc?.qtyLulus ?? ""} /></label>
          <button type="submit" disabled={pending} className="mt-4 rounded-[8px] bg-[#E88A06] px-4 py-2 text-[13px] font-semibold text-white">Terima barang jadi</button>
        </form>
      )}
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
