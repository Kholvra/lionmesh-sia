
"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { CustomSelect } from "@/components/ui/custom-select";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { simpanBomVersi } from "@/modules/produksi/actions";
import { muatBomForm } from "@/modules/produksi/queries";
import type { BomFormData } from "./types";

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

function formatTanggalIndo(isoDate: string): string {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return isoDate;
  return `${d} ${BULAN_ID[m - 1]} ${y}`;
}

function getHariSebelumIndo(isoDate: string): string {
  if (!isoDate) return "";
  const dt = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(dt.getTime())) return "";
  dt.setDate(dt.getDate() - 1);
  return `${dt.getDate()} ${BULAN_ID[dt.getMonth()]}`;
}

function parsePercent(val: string): number {
  const num = parseFloat(val.replace("%", "").replace(",", ".").trim());
  return Number.isFinite(num) ? num : NaN;
}

function parseKg(val: string): number {
  const cleaned = val.replace(/kg/gi, "").replace(",", ".").trim();
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : NaN;
}

interface FieldErrors {
  berlakuMulai?: string;
  toleransiScrap?: string;
  toleransiReject?: string;
  jumlahPerLembar?: string;
  komponen?: string;
}

function VersiBomBaruContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const kodeParam = searchParams.get("kode");
  const isCreateNewBomMode = searchParams.get("mode") === "new" || !kodeParam;
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<BomFormData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [selectedProdukLabel, setSelectedProdukLabel] = useState("");
  const [berlakuMulaiISO, setBerlakuMulaiISO] = useState("");
  const [toleransiScrap, setToleransiScrap] = useState("");
  const [toleransiReject, setToleransiReject] = useState("");
  const [jumlahPerLembar, setJumlahPerLembar] = useState("");
  const [komponenLabel, setKomponenLabel] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    let aktif = true;
    muatBomForm().then((hasil) => {
      if (!aktif) return;
      if (!hasil.ok) {
        setError(hasil.message);
        return;
      }
      setData(hasil.data);
      const yangAda = kodeParam
        ? hasil.data.bomList.find(
            (item) => item.produkKode.toLowerCase() === kodeParam.toLowerCase(),
          ) ?? null
        : null;
      setSelectedProdukLabel(
        yangAda
          ? `${yangAda.produkNama} · ${yangAda.produkKode}`
          : hasil.data.produkOptions[0]
            ? `${hasil.data.produkOptions[0].nama} · ${hasil.data.produkOptions[0].kode}`
            : "",
      );
      setToleransiScrap(yangAda?.toleransiScrap ?? "");
      setToleransiReject(yangAda?.toleransiReject ?? "");
      setJumlahPerLembar(
        yangAda
          ? `${yangAda.jumlahPerLembarKg.toLocaleString("id-ID", { minimumFractionDigits: 1 })} kg`
          : "",
      );
      setKomponenLabel(
        yangAda
          ? `${yangAda.komponenNama} · ${yangAda.komponenKode}`
          : hasil.data.bahanOptions[0]
            ? `${hasil.data.bahanOptions[0].nama} · ${hasil.data.bahanOptions[0].kode}`
            : "",
      );
    });
    return () => {
      aktif = false;
    };
  }, [kodeParam]);

  const bomList = data?.bomList ?? [];
  const existingBom = useMemo(
    () =>
      bomList.find(
        (item) => item.produkKode.toLowerCase() === (kodeParam ?? "").toLowerCase(),
      ) ?? null,
    [bomList, kodeParam],
  );

  const nextVersionNumber = existingBom ? existingBom.versiNumber + 1 : 1;
  const currentProdukName = existingBom?.produkNama ?? selectedProdukLabel.split(" · ")[0] ?? "";
  const currentProdukKode = existingBom?.produkKode ?? selectedProdukLabel.split(" · ")[1] ?? "";

  const statusKeterangan = useMemo(() => {
    if (!berlakuMulaiISO) {
      return "Pilih tanggal berlaku mulai untuk menentukan status versi.";
    }
    const todayISO = new Date().toISOString().slice(0, 10);
    if (existingBom) {
      if (berlakuMulaiISO > todayISO) {
        const batasLama = getHariSebelumIndo(berlakuMulaiISO);
        return `Terjadwal; v${existingBom.versiNumber} tetap dipakai sampai ${batasLama}. Versi yang sudah disimpan tidak bisa diubah.`;
      }
      return `Berlaku langsung; menggantikan v${existingBom.versiNumber}. Versi yang sudah disimpan tidak bisa diubah.`;
    }
    return berlakuMulaiISO > todayISO
      ? `Terjadwal; mulai berlaku pada ${formatTanggalIndo(berlakuMulaiISO)}. Versi yang sudah disimpan tidak bisa diubah.`
      : "Berlaku langsung setelah disimpan. Versi yang sudah disimpan tidak bisa diubah.";
  }, [berlakuMulaiISO, existingBom]);

  const handleOpenDatePicker = () => {
    const input = dateInputRef.current;
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

  const handleSaveVersion = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: FieldErrors = {};

    if (!berlakuMulaiISO) {
      nextErrors.berlakuMulai = "Tanggal berlaku mulai wajib diisi.";
    } else if (existingBom && berlakuMulaiISO <= existingBom.berlakuDariISO) {
      nextErrors.berlakuMulai = `Berlaku mulai harus setelah ${existingBom.berlakuDari} dan tidak boleh sama.`;
    }

    const scrapVal = parsePercent(toleransiScrap);
    if (Number.isNaN(scrapVal) || scrapVal < 0 || scrapVal >= 100) {
      nextErrors.toleransiScrap = "Toleransi scrap harus bernilai 0% sampai < 100%.";
    }

    const rejectVal = parsePercent(toleransiReject);
    if (Number.isNaN(rejectVal) || rejectVal < 0 || rejectVal >= 100) {
      nextErrors.toleransiReject = "Toleransi reject harus bernilai 0% sampai < 100%.";
    }

    const qtyKgVal = parseKg(jumlahPerLembar);
    if (Number.isNaN(qtyKgVal) || qtyKgVal <= 0) {
      nextErrors.jumlahPerLembar = "Jumlah komponen harus lebih dari nol.";
    }

    if (!komponenLabel) {
      nextErrors.komponen = "Komponen bahan baku wajib dipilih.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});
    setServerError(null);

    const produkId =
      existingBom?.produkId ??
      data?.produkOptions.find(
        (item) => `${item.nama} · ${item.kode}` === selectedProdukLabel,
      )?.id;
    const komponen = data?.bahanOptions.find(
      (item) => `${item.nama} · ${item.kode}` === komponenLabel,
    );
    if (!produkId || !komponen) {
      setServerError("Produk atau komponen tidak ditemukan pada data master.");
      return;
    }

    const formData = new FormData();
    formData.set("produk_id", produkId);
    formData.set("berlaku_dari", berlakuMulaiISO);
    formData.set("toleransi_scrap", String(scrapVal));
    formData.set("toleransi_reject", String(rejectVal));
    formData.set("komponen_produk_id", komponen.id);
    formData.set("satuan_id", komponen.satuanId || existingBom?.satuanId || "");
    formData.set("qty_per_unit", String(qtyKgVal));
    formData.set("urutan", "1");

    startTransition(async () => {
      const hasil = await simpanBomVersi(formData);
      if (!hasil.ok) {
        setServerError(hasil.message);
        return;
      }
      router.push("/produksi/bom-produk");
    });
  };

  const activeErrorMessages = [
    ...Object.values(fieldErrors).filter(Boolean),
    ...(serverError ? [serverError] : []),
  ] as string[];
  const hasErrors = activeErrorMessages.length > 0;

  if (error) {
    return (
      <div className="w-full text-[#172335] animate-fade-in">
        <PageHeader title="Versi BOM baru" variant="cycle" />
        <ErrorState judul="Data master tidak dapat dimuat." teks={error} variant="compact" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full text-[#172335] animate-fade-in">
        <PageHeader title="Versi BOM baru" variant="cycle" />
        <LoadingState judul="Memuat..." variant="inline" />
      </div>
    );
  }

  return (
    <div className="w-full text-[#172335] animate-fade-in">
      <PageHeader
        title={
          isCreateNewBomMode
            ? "Buat BOM produk baru"
            : `Versi BOM baru · ${currentProdukName}`
        }
        variant="cycle"
      />

      {hasErrors && (
        <Notice className="mt-3.5" tone="error" title="Versi belum bisa disimpan" variant="card">
          <div className="mt-0.5 space-y-0.5 text-[12px]">
            {activeErrorMessages.map((msg, i) => (
              <p key={i}>{msg}</p>
            ))}
          </div>
        </Notice>
      )}

      {/* Form Card */}
      <form
        onSubmit={handleSaveVersion}
        className="shadow-card mt-3.5 rounded-[10px] border border-transparent bg-white p-5 transition-all duration-150 ease-out hover:shadow-md"
      >
        <h2 className="text-[15px] font-semibold text-[#172335]">
          {existingBom
            ? `Versi v${nextVersionNumber} menggantikan v${existingBom.versiNumber} (berlaku sejak ${existingBom.berlakuDari})`
            : "Versi v1 sebagai resep awal produk"}
        </h2>
        <p className="mt-0.5 text-xs text-[#526174]">* Wajib diisi.</p>

        <div className="mt-3.5 grid grid-cols-1 gap-x-5 gap-y-3 md:grid-cols-2">
          {/* Baris 1 Kiri: Produk */}
          <div>
            <label className="block text-xs font-medium text-[#172335]">Produk</label>
            {existingBom ? (
              <div className="mt-1.5 rounded-[8px] border border-[#E5E7EB] bg-white px-3.5 py-2 text-[13px] font-medium text-[#172335]">
                {existingBom.produkNama} · {existingBom.produkKode}
              </div>
            ) : (
              <CustomSelect
                value={selectedProdukLabel}
                onChange={(val) => setSelectedProdukLabel(val)}
                options={data.produkOptions.map((p) => `${p.nama} · ${p.kode}`)}
                placeholder="Pilih produk..."
              />
            )}
          </div>

          {/* Baris 1 Kanan: Nomor versi */}
          <div>
            <label className="block text-xs font-medium text-[#172335]">Nomor versi</label>
            <div className="mt-1.5 rounded-[8px] border border-[#E5E7EB] bg-[#E5E7EB]/60 px-3.5 py-2 text-[13px] font-medium text-[#526174]">
              v{nextVersionNumber} (otomatis)
            </div>
          </div>

          {/* Baris 2 Kiri: Berlaku mulai * */}
          <div>
            <label className="block text-xs font-medium text-[#172335]">
              Berlaku mulai *
            </label>
            <div className="relative mt-1.5">
              <input
                ref={dateInputRef}
                type="date"
                value={berlakuMulaiISO}
                onClick={handleOpenDatePicker}
                onChange={(e) => {
                  setBerlakuMulaiISO(e.target.value);
                  if (fieldErrors.berlakuMulai) {
                    setFieldErrors((prev) => ({ ...prev, berlakuMulai: undefined }));
                  }
                }}
                className={`w-full cursor-pointer rounded-[8px] border bg-white px-3.5 py-2 text-[13px] text-[#172335] outline-none transition ${
                  fieldErrors.berlakuMulai
                    ? "border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/15"
                    : "border-[#E5E7EB] focus:border-[#E88A06] focus:ring-2 focus:ring-[#E88A06]/15"
                }`}
              />
              {fieldErrors.berlakuMulai ? (
                <p className="mt-1 text-[11px] font-medium text-[#DC2626]">
                  {fieldErrors.berlakuMulai}
                </p>
              ) : (
                berlakuMulaiISO && (
                  <p className="mt-1 text-[11px] text-[#526174]">
                    Ditampilkan sebagai: {formatTanggalIndo(berlakuMulaiISO)}
                  </p>
                )
              )}
            </div>
          </div>

          {/* Baris 2 Kanan: Toleransi scrap * */}
          <div>
            <label className="block text-xs font-medium text-[#172335]">
              Toleransi scrap *
            </label>
            <CustomSelect
              value={toleransiScrap}
              onChange={(val) => {
                setToleransiScrap(val);
                if (fieldErrors.toleransiScrap) {
                  setFieldErrors((prev) => ({ ...prev, toleransiScrap: undefined }));
                }
              }}
              options={["0,5%", "1%", "1,5%", "2%", "2,5%", "3%"]}
              placeholder="Pilih toleransi scrap..."
            />
            {fieldErrors.toleransiScrap && (
              <p className="mt-1 text-[11px] font-medium text-[#DC2626]">
                {fieldErrors.toleransiScrap}
              </p>
            )}
          </div>

          {/* Baris 3 Kiri: Toleransi reject * */}
          <div>
            <label className="block text-xs font-medium text-[#172335]">
              Toleransi reject *
            </label>
            <input
              type="text"
              value={toleransiReject}
              onChange={(e) => {
                setToleransiReject(e.target.value);
                if (fieldErrors.toleransiReject) {
                  setFieldErrors((prev) => ({ ...prev, toleransiReject: undefined }));
                }
              }}
              placeholder="Contoh: 1%"
              className={`mt-1.5 w-full rounded-[8px] border bg-white px-3.5 py-2 text-[13px] text-[#172335] outline-none transition ${
                fieldErrors.toleransiReject
                  ? "border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/15"
                  : "border-[#E5E7EB] focus:border-[#E88A06] focus:ring-2 focus:ring-[#E88A06]/15"
              }`}
            />
            {fieldErrors.toleransiReject && (
              <p className="mt-1 text-[11px] font-medium text-[#DC2626]">
                {fieldErrors.toleransiReject}
              </p>
            )}
          </div>

          {/* Baris 3 Kanan: Jumlah per lembar * */}
          <div>
            <label className="block text-xs font-medium text-[#172335]">
              Jumlah per lembar *
            </label>
            <input
              type="text"
              value={jumlahPerLembar}
              onChange={(e) => {
                setJumlahPerLembar(e.target.value);
                if (fieldErrors.jumlahPerLembar) {
                  setFieldErrors((prev) => ({ ...prev, jumlahPerLembar: undefined }));
                }
              }}
              placeholder="Contoh: 35,3 kg"
              className={`mt-1.5 w-full rounded-[8px] border bg-white px-3.5 py-2 text-[13px] text-[#172335] outline-none transition ${
                fieldErrors.jumlahPerLembar
                  ? "border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/15"
                  : "border-[#E5E7EB] focus:border-[#E88A06] focus:ring-2 focus:ring-[#E88A06]/15"
              }`}
            />
            {fieldErrors.jumlahPerLembar ? (
              <p className="mt-1 text-[11px] font-medium text-[#DC2626]">
                {fieldErrors.jumlahPerLembar}
              </p>
            ) : (
              <p className="mt-1 text-[11px] text-[#526174]">
                Kebutuhan = jumlah per lembar × jumlah SPK × (1 + toleransi scrap).
              </p>
            )}
          </div>

          {/* Baris 4 Kiri: Komponen * */}
          <div>
            <label className="block text-xs font-medium text-[#172335]">Komponen *</label>
            <CustomSelect
              direction="up"
              value={komponenLabel}
              onChange={(val) => {
                setKomponenLabel(val);
                if (fieldErrors.komponen) {
                  setFieldErrors((prev) => ({ ...prev, komponen: undefined }));
                }
              }}
              options={data.bahanOptions.map((b) => `${b.nama} · ${b.kode}`)}
              placeholder="Pilih komponen bahan..."
            />
          </div>

          {/* Baris 4 Kanan: Status setelah disimpan */}
          <div>
            <label className="block text-xs font-medium text-[#172335]">
              Status setelah disimpan
            </label>
            <div className="mt-1.5 rounded-[8px] border border-[#E5E7EB] bg-white px-3.5 py-2 text-[13px] leading-snug text-[#172335]">
              {statusKeterangan}
            </div>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-[8px] bg-[#E88A06] px-4 py-2 text-[13px] font-semibold text-white shadow-2xs transition-all duration-150 ease-out hover:bg-[#D17B05] active:scale-[0.98]"
          >
            Simpan versi
          </button>

          <Link
            href="/produksi/bom-produk"
            className="rounded-[8px] border border-[#E5E7EB] bg-white px-4 py-2 text-[13px] font-semibold text-[#172335] transition-all duration-150 ease-out hover:bg-slate-50 active:scale-[0.98]"
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}

export function VersiBomBaruScreen() {
  return (
    <Suspense fallback={<LoadingState judul="Memuat..." variant="inline" />}>
      <VersiBomBaruContent />
    </Suspense>
  );
}
