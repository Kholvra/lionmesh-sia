"use client";

import Link from "next/link";
import { useState } from "react";
import { SidebarProduksi } from "@/components/produksi/sidebar-produksi";
import { CustomSelect } from "@/components/ui/custom-select";
import { INITIAL_PRODUK_DATA, ProdukProduksi } from "@/types/produksi";

const EMPTY_FORM = {
  kode: "",
  satuan: "",
  nama: "",
  diameterKawat: "",
  ukuranLembar: "",
  spesifikasi: "",
};

const CUSTOM_NAMA_OPTION = "Nama produk custom...";
const CUSTOM_DIAMETER_OPTION = "Diameter custom...";
const CUSTOM_UKURAN_OPTION = "Ukuran custom...";

// Kamus spesifikasi bawaan pabrik berdasarkan nama produk standar PT Lionmesh
const PRODUCT_PRESETS: Record<
  string,
  { satuan: string; diameterKawat: string; ukuranLembar: string; spesifikasi: string }
> = {
  "Wiremesh M5": {
    satuan: "Lembar",
    diameterKawat: "Ø 5 mm",
    ukuranLembar: "2,1 m × 5,4 m",
    spesifikasi: "SNI 07-0663-1995 · Spasi 150×150 mm",
  },
  "Wiremesh M6": {
    satuan: "Lembar",
    diameterKawat: "Ø 6 mm",
    ukuranLembar: "2,1 m × 5,4 m",
    spesifikasi: "SNI 07-0663-1995 · Spasi 150×150 mm",
  },
  "Wiremesh M7": {
    satuan: "Lembar",
    diameterKawat: "Ø 7 mm",
    ukuranLembar: "2,1 m × 5,4 m",
    spesifikasi: "SNI 07-0663-1995 · Spasi 150×150 mm",
  },
  "Wiremesh M8": {
    satuan: "Lembar",
    diameterKawat: "Ø 8 mm",
    ukuranLembar: "2,1 m × 5,4 m",
    spesifikasi: "SNI 07-0663-1995 · Spasi 150×150 mm",
  },
  "Wiremesh M10": {
    satuan: "Lembar",
    diameterKawat: "Ø 10 mm",
    ukuranLembar: "2,1 m × 5,4 m",
    spesifikasi: "SNI 07-0663-1995 · Spasi 150×150 mm",
  },
  "Wiremesh M12": {
    satuan: "Lembar",
    diameterKawat: "Ø 12 mm",
    ukuranLembar: "2,1 m × 5,4 m",
    spesifikasi: "SNI 07-0663-1995 · Spasi 150×150 mm",
  },
};

const EXAMPLE_SPECS = {
  nama: "Wiremesh M12",
  ...PRODUCT_PRESETS["Wiremesh M12"],
};

const STANDARD_NAMAS = Object.keys(PRODUCT_PRESETS);
const NAMA_OPTIONS = [...STANDARD_NAMAS, CUSTOM_NAMA_OPTION];

const SATUAN_OPTIONS = ["Lembar", "Roll", "Batang"];

const STANDARD_DIAMETERS = ["Ø 5 mm", "Ø 6 mm", "Ø 7 mm", "Ø 8 mm", "Ø 10 mm", "Ø 12 mm"];
const DIAMETER_OPTIONS = [...STANDARD_DIAMETERS, CUSTOM_DIAMETER_OPTION];

const STANDARD_UKURANS = ["2,1 m × 5,4 m", "2,1 m × 54 m (Roll)", "1,8 m × 5,4 m"];
const UKURAN_OPTIONS = [...STANDARD_UKURANS, CUSTOM_UKURAN_OPTION];

const SPESIFIKASI_OPTIONS = [
  "SNI 07-0663-1995 · Spasi 150×150 mm",
  "SNI 07-0663-1995 · Spasi 100×100 mm",
  "Non-SNI · Spasi 150×150 mm",
];

// Generate kode produk otomatis berdasarkan spesifikasi + pastikan selalu unik
function generateKodeProduk(
  data: { nama: string; diameterKawat: string; ukuranLembar: string },
  existingList: ProdukProduksi[],
  ignoreId?: string | null
): string {
  if (!data.diameterKawat && !data.ukuranLembar && !data.nama) return "";

  const diameterNum = data.diameterKawat.replace(/\D/g, ""); // "Ø 12 mm" -> "12"
  const ukuranDigits = data.ukuranLembar.replace(/\D/g, ""); // "2,1 m × 5,4 m" -> "2154"

  const prefix = "WM";
  const series = diameterNum ? `M${diameterNum}` : "MX";
  const sizeCode = ukuranDigits ? ukuranDigits.slice(0, 4) : "0000";
  const baseCode = `${prefix}-${series}-${sizeCode}`;

  const isTaken = (code: string) =>
    existingList.some(
      (item) => item.kode.toLowerCase() === code.toLowerCase() && item.id !== ignoreId
    );

  if (!isTaken(baseCode)) return baseCode;

  let counter = 2;
  while (isTaken(`${baseCode}-${String(counter).padStart(2, "0")}`)) {
    counter++;
  }
  return `${baseCode}-${String(counter).padStart(2, "0")}`;
}

export default function DataProduksiPage() {
  const [produkList, setProdukList] = useState<ProdukProduksi[]>(INITIAL_PRODUK_DATA);
  const [selectedProdukId, setSelectedProdukId] = useState<string>("prod-2"); // Default Wiremesh M8
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  // State Modal "Isi data produksi"
  const [isFillModalOpen, setIsFillModalOpen] = useState(false);
  const [modalForm, setModalForm] = useState(EMPTY_FORM);
  const [isCustomNama, setIsCustomNama] = useState(false);
  const [isCustomDiameter, setIsCustomDiameter] = useState(false);
  const [isCustomUkuran, setIsCustomUkuran] = useState(false);

  // State Modal "Lengkapi formulir"
  const [isIncompleteModalOpen, setIsIncompleteModalOpen] = useState(false);
  const [incompleteMessage, setIncompleteMessage] = useState(
    "Masih ada kolom wajib yang kosong. Klik tombol Isi formulir untuk melengkapi spesifikasi, lalu coba simpan kembali."
  );

  // State Modal Konfirmasi Hapus
  const [deleteTarget, setDeleteTarget] = useState<ProdukProduksi | null>(null);

  const selectedProduk =
    produkList.find((item) => item.id === selectedProdukId) ?? produkList[0] ?? null;

  // Penanda apakah modal sedang dalam mode produk standar (spesifikasi read-only)
  const isStandardPresetSelected = Boolean(
    !isCustomNama && modalForm.nama && PRODUCT_PRESETS[modalForm.nama]
  );

  // Buka modal "Isi data produksi" untuk tambah/lanjut isi draf
  const handleOpenFillModal = () => {
    const customNamaFlag = Boolean(form.nama && !STANDARD_NAMAS.includes(form.nama));
    setModalForm(form);
    setIsCustomNama(customNamaFlag);
    setIsCustomDiameter(
      Boolean(form.diameterKawat && !STANDARD_DIAMETERS.includes(form.diameterKawat))
    );
    setIsCustomUkuran(
      Boolean(form.ukuranLembar && !STANDARD_UKURANS.includes(form.ukuranLembar))
    );
    setIsFillModalOpen(true);
  };

  // Terapkan isian dari modal ke kartu draf kiri & cetak pratinjau kode otomatis
  const handleApplyModalForm = () => {
    const trimmedModalForm = {
      ...modalForm,
      nama: modalForm.nama.trim(),
      diameterKawat: modalForm.diameterKawat.trim(),
      ukuranLembar: modalForm.ukuranLembar.trim(),
    };

    const autoGeneratedKode = editingId
      ? trimmedModalForm.kode
      : generateKodeProduk(trimmedModalForm, produkList, editingId);

    setForm({
      ...trimmedModalForm,
      kode: autoGeneratedKode,
    });
    setIsFillModalOpen(false);
  };

  // Buka modal dengan data produk yang ingin diubah ketika klik "Ubah" di tabel
  const handleSelectEdit = (item: ProdukProduksi) => {
    const itemData = {
      kode: item.kode,
      satuan: item.satuan,
      nama: item.nama,
      diameterKawat: item.diameterKawat,
      ukuranLembar: item.ukuranLembar,
      spesifikasi: item.spesifikasi,
    };
    const customNamaFlag = !STANDARD_NAMAS.includes(item.nama);

    setEditingId(item.id);
    setSelectedProdukId(item.id);
    setForm(itemData);
    setModalForm(itemData);
    setIsCustomNama(customNamaFlag);
    setIsCustomDiameter(!STANDARD_DIAMETERS.includes(item.diameterKawat));
    setIsCustomUkuran(!STANDARD_UKURANS.includes(item.ukuranLembar));
    setIsFillModalOpen(true);
  };

  // Isi contoh langsung ke kartu draf kiri beserta kode otomatisnya
  const handleFillExample = () => {
    setEditingId(null);
    const autoKode = generateKodeProduk(EXAMPLE_SPECS, produkList, null);
    setForm({
      kode: autoKode,
      ...EXAMPLE_SPECS,
    });
  };

  // Kosongkan draf utama dan keluar dari mode edit
  const handleResetForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setIsCustomNama(false);
    setIsCustomDiameter(false);
    setIsCustomUkuran(false);
  };

  // Simpan draf ke tabel "Daftar data produksi" di sebelah kanan
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !form.satuan ||
      !form.nama.trim() ||
      !form.diameterKawat.trim() ||
      !form.ukuranLembar.trim() ||
      !form.spesifikasi
    ) {
      setIncompleteMessage(
        "Masih ada kolom wajib yang kosong. Klik tombol Isi formulir untuk melengkapi spesifikasi produk, lalu coba simpan kembali."
      );
      setIsIncompleteModalOpen(true);
      return;
    }

    const finalKode = form.kode || generateKodeProduk(form, produkList, editingId);

    // Estimasi kebutuhan standar otomatis berdasarkan diameter kawat
    const diameterNumber = parseInt(form.diameterKawat.replace(/\D/g, ""), 10) || 8;
    const estimasiKawat = Math.round(diameterNumber * diameterNumber * 94);
    const estimasiPendukung = Math.max(10, Math.round(diameterNumber * 2.5));

    if (editingId) {
      setProdukList((prev) =>
        prev.map((item) =>
          item.id === editingId
            ? {
                ...item,
                ...form,
                kode: finalKode,
                kebutuhanStandar: {
                  kawatBajaLabel: `Kawat baja ${form.diameterKawat}`,
                  kawatBajaKg: estimasiKawat,
                  bahanPendukungKg: estimasiPendukung,
                },
              }
            : item
        )
      );
      setSelectedProdukId(editingId);
    } else {
      const newId = `prod-${Date.now()}`;
      const newProduk: ProdukProduksi = {
        id: newId,
        ...form,
        kode: finalKode,
        kebutuhanStandar: {
          kawatBajaLabel: `Kawat baja ${form.diameterKawat}`,
          kawatBajaKg: estimasiKawat,
          bahanPendukungKg: estimasiPendukung,
        },
      };
      setProdukList((prev) => [...prev, newProduk]);
      setSelectedProdukId(newId);
    }

    setEditingId(null);
    setForm(EMPTY_FORM);
    setIsCustomNama(false);
    setIsCustomDiameter(false);
    setIsCustomUkuran(false);
  };

  // Konfirmasi hapus produk
  const confirmDelete = () => {
    if (!deleteTarget) return;
    const remaining = produkList.filter((item) => item.id !== deleteTarget.id);
    setProdukList(remaining);

    if (editingId === deleteTarget.id) {
      setEditingId(null);
      setForm(EMPTY_FORM);
    }
    if (selectedProdukId === deleteTarget.id) {
      setSelectedProdukId(remaining[0]?.id ?? "");
    }
    setDeleteTarget(null);
  };

  return (
    <div className="flex min-h-screen bg-[#F8F9FB] text-slate-900">
      <SidebarProduksi />

      <div className="flex flex-1 flex-col justify-between">
        {/* Main Content Area */}
        <main className="mx-auto w-full max-w-6xl px-8 py-7">
          {/* Top Breadcrumb & Role Badge */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <nav className="text-xs font-medium text-slate-500">
                <span>Siklus Produksi</span>
                <span className="mx-1.5">/</span>
                <span className="text-slate-700">Data Produksi</span>
              </nav>
              <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-slate-900">
                Data produksi
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Kelola produk, spesifikasi, dan kebutuhan bahan baku.
              </p>
            </div>

            <div className="min-w-[180px] rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-2xs">
              Produksi
            </div>
          </div>

          {/* 2-Column Split Grid */}
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Kolom Kiri: Draf Data Produk (Read-only Preview) */}
            <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs lg:col-span-5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  {editingId ? "Ubah data produk" : "Tambah data produk"}
                </h2>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                  Draf
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Gunakan tombol <span className="font-semibold text-slate-700">Isi formulir</span>{" "}
                untuk mengisi atau mengubah spesifikasi.
              </p>

              <form onSubmit={handleSave} className="mt-5 space-y-4">
                {/* Baris 1: Kode Produk (Otomatis) & Satuan */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-medium text-slate-700">
                        Kode produk
                      </label>
                     {/*  <span className="text-[10px] font-semibold text-[#D97F00]">Otomatis</span>*/}
                    </div>
                    <div
                      className={`mt-1.5 rounded-lg border px-3 py-2 text-sm ${
                        form.kode
                          ? "border-amber-200 bg-amber-50/60 font-semibold text-slate-900"
                          : "border-slate-200 bg-slate-50/80 text-slate-400"
                      }`}
                    >
                      {form.kode || "Otomatis"}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700">
                      Satuan *
                    </label>
                    <div
                      className={`mt-1.5 rounded-lg border px-3 py-2 text-sm ${
                        form.satuan
                          ? "border-slate-300 bg-white font-medium text-slate-800"
                          : "border-slate-200 bg-slate-50/80 text-slate-400"
                      }`}
                    >
                      {form.satuan || "Belum diisi"}
                    </div>
                  </div>
                </div>

                {/* Baris 2: Nama Produk */}
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Nama produk *
                  </label>
                  <div
                    className={`mt-1.5 rounded-lg border px-3 py-2 text-sm ${
                      form.nama
                        ? "border-slate-300 bg-white font-medium text-slate-800"
                        : "border-slate-200 bg-slate-50/80 text-slate-400"
                    }`}
                  >
                    {form.nama || "Belum diisi"}
                  </div>
                </div>

                {/* Baris 3: Diameter Kawat & Ukuran Lembar */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-medium text-slate-700">
                      Diameter kawat *
                    </label>
                    <div
                      className={`mt-1.5 rounded-lg border px-3 py-2 text-sm ${
                        form.diameterKawat
                          ? "border-slate-300 bg-white font-medium text-slate-800"
                          : "border-slate-200 bg-slate-50/80 text-slate-400"
                      }`}
                    >
                      {form.diameterKawat || "Belum diisi"}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700">
                      Ukuran lembar *
                    </label>
                    <div
                      className={`mt-1.5 rounded-lg border px-3 py-2 text-sm ${
                        form.ukuranLembar
                          ? "border-slate-300 bg-white font-medium text-slate-800"
                          : "border-slate-200 bg-slate-50/80 text-slate-400"
                      }`}
                    >
                      {form.ukuranLembar || "Belum diisi"}
                    </div>
                  </div>
                </div>

                {/* Baris 4: Spesifikasi */}
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Spesifikasi *
                  </label>
                  <div
                    className={`mt-1.5 rounded-lg border px-3 py-2 text-sm ${
                      form.spesifikasi
                        ? "border-slate-300 bg-white font-medium text-slate-800"
                        : "border-slate-200 bg-slate-50/80 text-slate-400"
                    }`}
                  >
                    {form.spesifikasi || "Belum diisi"}
                  </div>
                </div>

                <p className="text-xs text-slate-500">
                  * Wajib diisi. Kode produk dicetak otomatis saat disimpan.
                </p>

                {/* Tombol Aksi Form */}
                <div className="flex items-center justify-end gap-2.5 pt-4">
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-[#ED8B00] px-5 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-[#D97F00]"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            </section>

            {/* Kolom Kanan: Tabel Daftar & Kebutuhan Standar */}
            <div className="flex flex-col gap-6 lg:col-span-7">
              {/* Kartu Kanan Atas: Daftar Data Produksi */}
              <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Daftar data produksi</h2>
                    <p className="mt-1 text-xs text-slate-500">
                      {produkList.length} produk · Spesifikasi siap digunakan
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenFillModal}
                    className="rounded-lg bg-[#ED8B00] px-4 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-[#D97F00]"
                  >
                    Isi formulir
                  </button>
                </div>

                {/* Tabel */}
                <div className="mt-5 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="rounded-lg bg-slate-100/80 text-xs font-semibold text-slate-600">
                        <th className="rounded-l-lg px-4 py-2.5">Kode</th>
                        <th className="px-4 py-2.5">Nama produk</th>
                        <th className="px-4 py-2.5">Satuan</th>
                        <th className="rounded-r-lg px-4 py-2.5">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {produkList.map((item) => {
                        const isSelected = selectedProduk?.id === item.id;
                        return (
                          <tr
                            key={item.id}
                            onClick={() => setSelectedProdukId(item.id)}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? "bg-amber-50/50" : "hover:bg-slate-50"
                            }`}
                          >
                            <td className="px-4 py-3.5 font-semibold text-slate-900">
                              {item.kode}
                            </td>
                            <td className="px-4 py-3.5 text-slate-700">{item.nama}</td>
                            <td className="px-4 py-3.5 text-slate-600">{item.satuan}</td>
                            <td
                              className="px-4 py-3.5 text-xs font-medium"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => handleSelectEdit(item)}
                                className="text-[#D97F00] hover:underline"
                              >
                                Ubah
                              </button>
                              <span className="mx-1.5 text-slate-300">·</span>
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(item)}
                                className="text-[#D97F00] hover:underline"
                              >
                                Hapus
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {produkList.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-xs text-slate-400">
                            Belum ada data produk. Klik “Isi formulir” untuk menambahkan.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <p className="mt-4 text-xs text-slate-500">
                  {produkList.length > 0
                    ? `Menampilkan 1–${produkList.length} dari ${produkList.length} produk`
                    : "Menampilkan 0 produk"}
                </p>
              </section>

              {/* Kartu Kanan Bawah: Kebutuhan Standar */}
              <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs">
                <h2 className="text-lg font-bold text-slate-900">
                  Kebutuhan standar {selectedProduk ? `· ${selectedProduk.nama}` : ""}
                </h2>
                <p className="mt-1 text-xs text-slate-500">Per 100 lembar produk</p>

                {selectedProduk ? (
                  <div className="mt-5 space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-700">
                        {selectedProduk.kebutuhanStandar.kawatBajaLabel}
                      </span>
                      <span className="font-bold text-slate-900">
                        {selectedProduk.kebutuhanStandar.kawatBajaKg.toLocaleString("id-ID")} kg
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-700">Bahan pendukung</span>
                      <span className="font-bold text-slate-900">
                        {selectedProduk.kebutuhanStandar.bahanPendukungKg.toLocaleString("id-ID")} kg
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 text-xs text-slate-400">
                    Pilih salah satu produk di tabel untuk melihat kebutuhan bahan baku.
                  </p>
                )}

                <p className="mt-5 text-xs text-slate-500">
                  Hapus produk memerlukan konfirmasi terlebih dahulu.
                </p>
              </section>
            </div>
          </div>
        </main>

        {/* Bottom Action Bar */}
        <footer className="border-t border-slate-200/80 bg-[#F8F9FB] px-8 py-4">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                href="/siklus-produksi"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <span>←</span>
                <span>Hub produksi</span>
              </Link>

              <button
                type="button"
                onClick={handleFillExample}
                className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Isi contoh
              </button>

              <button
                type="button"
                onClick={handleResetForm}
                className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Kosongkan
              </button>
            </div>

            <span className="text-xs text-slate-500">
              Klik “Isi formulir” untuk mengisi data
            </span>

            <Link
              href="/siklus-produksi/perintah-produksi"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              <span>Perintah produksi</span>
              <span>→</span>
            </Link>
          </div>
        </footer>
      </div>

      {/* Modal 1: Isi data produksi */}
      {isFillModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[1px]">
          <div className="w-full max-w-xl rounded-2xl bg-white p-7 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900">
              {editingId ? "Ubah data produksi" : "Isi data produksi"}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Pilih produk standar untuk spesifikasi otomatis, atau pilih{" "}
              <span className="font-semibold text-slate-700">Nama produk custom...</span> untuk mengisi manual.
            </p>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Kode Produk: Tercetak Otomatis */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-slate-700">Kode produk</label>
                  <span className="text-[10px] font-semibold text-[#D97F00]">Otomatis</span>
                </div>
                <div className="mt-1.5 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-400">
                  {editingId && modalForm.kode ? modalForm.kode : "Tercetak otomatis"}
                </div>
              </div>

              {/* Satuan */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-slate-700">Satuan *</label>
                  {isStandardPresetSelected && (
                    <span className="text-[10px] font-medium text-slate-400">Standar PT</span>
                  )}
                </div>
                {isStandardPresetSelected ? (
                  <div className="mt-1.5 rounded-lg border border-slate-200 bg-slate-50/90 px-3 py-2 text-sm font-medium text-slate-600">
                    {modalForm.satuan}
                  </div>
                ) : (
                  <CustomSelect
                    value={modalForm.satuan}
                    onChange={(val) => setModalForm({ ...modalForm, satuan: val })}
                    options={SATUAN_OPTIONS}
                    placeholder="Pilih..."
                  />
                )}
              </div>

              {/* Nama produk (Penentu Mode Standar vs Custom) */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700">Nama produk *</label>
                <CustomSelect
                  value={isCustomNama ? CUSTOM_NAMA_OPTION : modalForm.nama}
                  onChange={(val) => {
                    if (val === CUSTOM_NAMA_OPTION) {
                      setIsCustomNama(true);
                      setIsCustomDiameter(false);
                      setIsCustomUkuran(false);
                      setModalForm({
                        ...modalForm,
                        nama: "",
                        satuan: "",
                        diameterKawat: "",
                        ukuranLembar: "",
                        spesifikasi: "",
                      });
                    } else {
                      setIsCustomNama(false);
                      setIsCustomDiameter(false);
                      setIsCustomUkuran(false);
                      const preset = PRODUCT_PRESETS[val];
                      setModalForm({
                        ...modalForm,
                        nama: val,
                        ...(preset ?? {}),
                      });
                    }
                  }}
                  options={NAMA_OPTIONS}
                  placeholder="Pilih..."
                />
                {isCustomNama && (
                  <input
                    type="text"
                    placeholder="Contoh: Wiremesh M9 Custom"
                    value={modalForm.nama}
                    onChange={(e) => setModalForm({ ...modalForm, nama: e.target.value })}
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#ED8B00] focus:ring-2 focus:ring-[#ED8B00]/20"
                  />
                )}
              </div>

              {/* Diameter kawat */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-slate-700">
                    Diameter kawat *
                  </label>
                  {isStandardPresetSelected && (
                    <span className="text-[10px] font-medium text-slate-400">Standar PT</span>
                  )}
                </div>
                {isStandardPresetSelected ? (
                  <div className="mt-1.5 rounded-lg border border-slate-200 bg-slate-50/90 px-3 py-2 text-sm font-medium text-slate-600">
                    {modalForm.diameterKawat}
                  </div>
                ) : (
                  <>
                    <CustomSelect
                      value={isCustomDiameter ? CUSTOM_DIAMETER_OPTION : modalForm.diameterKawat}
                      onChange={(val) => {
                        if (val === CUSTOM_DIAMETER_OPTION) {
                          setIsCustomDiameter(true);
                          setModalForm({ ...modalForm, diameterKawat: "" });
                        } else {
                          setIsCustomDiameter(false);
                          setModalForm({ ...modalForm, diameterKawat: val });
                        }
                      }}
                      options={DIAMETER_OPTIONS}
                      placeholder="Pilih..."
                    />
                    {isCustomDiameter && (
                      <input
                        type="text"
                        placeholder="Contoh: Ø 9 mm"
                        value={modalForm.diameterKawat}
                        onChange={(e) =>
                          setModalForm({ ...modalForm, diameterKawat: e.target.value })
                        }
                        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#ED8B00] focus:ring-2 focus:ring-[#ED8B00]/20"
                      />
                    )}
                  </>
                )}
              </div>

              {/* Ukuran lembar */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-slate-700">
                    Ukuran lembar *
                  </label>
                  {isStandardPresetSelected && (
                    <span className="text-[10px] font-medium text-slate-400">Standar PT</span>
                  )}
                </div>
                {isStandardPresetSelected ? (
                  <div className="mt-1.5 rounded-lg border border-slate-200 bg-slate-50/90 px-3 py-2 text-sm font-medium text-slate-600">
                    {modalForm.ukuranLembar}
                  </div>
                ) : (
                  <>
                    <CustomSelect
                      value={isCustomUkuran ? CUSTOM_UKURAN_OPTION : modalForm.ukuranLembar}
                      onChange={(val) => {
                        if (val === CUSTOM_UKURAN_OPTION) {
                          setIsCustomUkuran(true);
                          setModalForm({ ...modalForm, ukuranLembar: "" });
                        } else {
                          setIsCustomUkuran(false);
                          setModalForm({ ...modalForm, ukuranLembar: val });
                        }
                      }}
                      options={UKURAN_OPTIONS}
                      placeholder="Pilih..."
                    />
                    {isCustomUkuran && (
                      <input
                        type="text"
                        placeholder="Contoh: 2,4 m × 6,0 m"
                        value={modalForm.ukuranLembar}
                        onChange={(e) =>
                          setModalForm({ ...modalForm, ukuranLembar: e.target.value })
                        }
                        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#ED8B00] focus:ring-2 focus:ring-[#ED8B00]/20"
                      />
                    )}
                  </>
                )}
              </div>

              {/* Spesifikasi */}
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-slate-700">Spesifikasi *</label>
                  {isStandardPresetSelected && (
                    <span className="text-[10px] font-medium text-slate-400">Standar PT</span>
                  )}
                </div>
                {isStandardPresetSelected ? (
                  <div className="mt-1.5 rounded-lg border border-slate-200 bg-slate-50/90 px-3 py-2 text-sm font-medium text-slate-600">
                    {modalForm.spesifikasi}
                  </div>
                ) : (
                  <CustomSelect
                    value={modalForm.spesifikasi}
                    onChange={(val) => setModalForm({ ...modalForm, spesifikasi: val })}
                    options={SPESIFIKASI_OPTIONS}
                    placeholder="Pilih..."
                  />
                )}
              </div>
            </div>

            <p className="mt-5 text-xs text-slate-500">
              {isStandardPresetSelected
                ? "Spesifikasi otomatis mengikuti standar PT Lionmesh. Klik Terapkan isian untuk melanjutkan."
                : "Lengkapi kolom custom di atas, lalu klik Terapkan isian. Kode produk akan tercetak otomatis."}
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomNama(false);
                    setIsCustomDiameter(false);
                    setIsCustomUkuran(false);
                    setModalForm({
                      kode: editingId ? modalForm.kode : "",
                      ...EXAMPLE_SPECS,
                    });
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Isi semua contoh
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomNama(false);
                    setIsCustomDiameter(false);
                    setIsCustomUkuran(false);
                    setModalForm({
                      ...EMPTY_FORM,
                      kode: editingId ? modalForm.kode : "",
                    });
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Kosongkan
                </button>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsFillModalOpen(false)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={handleApplyModalForm}
                  className="rounded-lg bg-[#ED8B00] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#D97F00]"
                >
                  Terapkan isian
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Lengkapi formulir */}
      {isIncompleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[1px]">
          <div className="w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Lengkapi formulir</h3>
            <p className="mt-2.5 text-xs leading-relaxed text-slate-600">
              {incompleteMessage}
            </p>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsIncompleteModalOpen(false);
                  handleOpenFillModal();
                }}
                className="rounded-lg bg-[#ED8B00] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#D97F00]"
              >
                Kembali mengisi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Konfirmasi Hapus Produk */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[1px]">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">Hapus data produk?</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Produk <span className="font-semibold text-slate-900">{deleteTarget.nama}</span> (
              {deleteTarget.kode}) akan dihapus dari daftar data produksi.
            </p>
            <div className="mt-5 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
              >
                Ya, hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}