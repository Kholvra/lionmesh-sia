export interface KartuJamKerjaItem {
  id: string;
  nomorSpk: string;
  namaKaryawan: string;
  nik: string;
  tanggal: string;
  tanggalISO: string;
  jamReguler: number;
  jamLembur: number;
  totalJam: number;
  tarifPerJam: number;
  totalTkl: number;
  kegiatan: string;
  status: "TERCATAT" | "DIBEBANKAN";
}

export interface KomponenBiayaDetail {
  komponen: string;
  nilaiRp: number;
  dokumenSumber: string;
  keterangan: string;
}

export interface HppSpkSummary {
  nomorSpk: string;
  produkNama: string;
  produkKode: string;
  jumlahLulus: number;
  targetLembar: number;
  jadwalText: string;
  statusWo: "DIRENCANAKAN" | "DIPROSES" | "HASIL_DICATAT" | "SELESAI";
  // Komponen HPP rumus mengikat:
  biayaBahanRp: number;
  biayaTklRp: number;
  biayaOverheadRp: number;
  biayaReworkRp: number;
  rejectAbnormalRp: number;
  totalHppRp: number;
  hppPerUnitRp: number;
  // Detail dokumen sumber
  sumberBahanDoc: string;
  sumberTklDoc: string;
  sumberOverheadDoc: string;
  tarifOverheadPerDlh: number;
  totalDlh: number;
  statusPostingHpp: "BELUM_POSTING" | "DIBEBANKAN_SEMENTARA" | "FINAL_DIPOSTING";
  tanggalPosting?: string;
}

export const INITIAL_KARTU_JAM_KERJA: KartuJamKerjaItem[] = [
  {
    id: "kjk-01",
    nomorSpk: "SPK-2611-013",
    namaKaryawan: "Budi Santoso",
    nik: "K-042",
    tanggal: "27 Nov 2026",
    tanggalISO: "2026-11-27",
    jamReguler: 7,
    jamLembur: 2,
    totalJam: 9,
    tarifPerJam: 35000,
    totalTkl: 315000,
    kegiatan: "Operator Mesin Las 1 · Pengelasan Wiremesh M6",
    status: "TERCATAT",
  },
  {
    id: "kjk-02",
    nomorSpk: "SPK-2611-013",
    namaKaryawan: "Agus Prasetyo",
    nik: "K-048",
    tanggal: "27 Nov 2026",
    tanggalISO: "2026-11-27",
    jamReguler: 7,
    jamLembur: 1,
    totalJam: 8,
    tarifPerJam: 35000,
    totalTkl: 280000,
    kegiatan: "Helper Mesin Las 1 · Pemotongan Wire Rod",
    status: "TERCATAT",
  },
  {
    id: "kjk-03",
    nomorSpk: "SPK-2611-013",
    namaKaryawan: "Rudi Hermawan",
    nik: "K-051",
    tanggal: "28 Nov 2026",
    tanggalISO: "2026-11-28",
    jamReguler: 5,
    jamLembur: 0,
    totalJam: 5,
    tarifPerJam: 35000,
    totalTkl: 175000,
    kegiatan: "Operator Mesin Las 1 · Finishing lembar",
    status: "TERCATAT",
  },
  {
    id: "kjk-04",
    nomorSpk: "SPK-2611-012",
    namaKaryawan: "Joko Widodo",
    nik: "K-039",
    tanggal: "20 Nov 2026",
    tanggalISO: "2026-11-20",
    jamReguler: 7,
    jamLembur: 3,
    totalJam: 10,
    tarifPerJam: 38000,
    totalTkl: 380000,
    kegiatan: "Operator Mesin Las 2 · Wiremesh M8",
    status: "DIBEBANKAN",
  },
  {
    id: "kjk-05",
    nomorSpk: "SPK-2611-011",
    namaKaryawan: "Hendro Susilo",
    nik: "K-033",
    tanggal: "18 Nov 2026",
    tanggalISO: "2026-11-18",
    jamReguler: 7,
    jamLembur: 2,
    totalJam: 9,
    tarifPerJam: 35000,
    totalTkl: 315000,
    kegiatan: "Operator Mesin Las 1 · Wiremesh M6",
    status: "DIBEBANKAN",
  },
];

export const INITIAL_HPP_LIST: HppSpkSummary[] = [
  {
    nomorSpk: "SPK-2611-013",
    produkNama: "Wiremesh M6",
    produkKode: "WM-M6",
    targetLembar: 120,
    jumlahLulus: 118,
    jadwalText: "27–28 Nov",
    statusWo: "HASIL_DICATAT",
    biayaBahanRp: 52750000, // 4,22 ton x Rp 12.500/kg
    biayaTklRp: 770000, // Dari 3 kartu jam kerja (22 jam x Rp 35.000)
    biayaOverheadRp: 990000, // 22 DLH x Rp 45.000/DLH
    biayaReworkRp: 185000, // Rework 2 lembar oleh QC
    rejectAbnormalRp: 0,
    totalHppRp: 54695000,
    hppPerUnitRp: 463517, // totalHpp / 118 lulus
    sumberBahanDoc: "MB-2611-042 (4,22 t)",
    sumberTklDoc: "KJK-SPK-013 (22 jam)",
    sumberOverheadDoc: "Tarif Nov 2026 (Rp 45.000/DLH)",
    tarifOverheadPerDlh: 45000,
    totalDlh: 22,
    statusPostingHpp: "DIBEBANKAN_SEMENTARA",
  },
  {
    nomorSpk: "SPK-2611-012",
    produkNama: "Wiremesh M8",
    produkKode: "WM-M8",
    targetLembar: 400,
    jumlahLulus: 395,
    jadwalText: "20–21 Nov",
    statusWo: "SELESAI",
    biayaBahanRp: 318000000,
    biayaTklRp: 3800000,
    biayaOverheadRp: 4500000,
    biayaReworkRp: 0,
    rejectAbnormalRp: 0,
    totalHppRp: 326300000,
    hppPerUnitRp: 826076,
    sumberBahanDoc: "MB-2611-038 (25,44 t)",
    sumberTklDoc: "KJK-SPK-012 (100 jam)",
    sumberOverheadDoc: "Tarif Nov 2026 (Rp 45.000/DLH)",
    tarifOverheadPerDlh: 45000,
    totalDlh: 100,
    statusPostingHpp: "FINAL_DIPOSTING",
    tanggalPosting: "22 Nov 2026 · 14.15",
  },
  {
    nomorSpk: "SPK-2611-011",
    produkNama: "Wiremesh M6",
    produkKode: "WM-M6",
    targetLembar: 250,
    jumlahLulus: 250,
    jadwalText: "18–19 Nov",
    statusWo: "SELESAI",
    biayaBahanRp: 110250000,
    biayaTklRp: 1890000,
    biayaOverheadRp: 2430000,
    biayaReworkRp: 0,
    rejectAbnormalRp: 0,
    totalHppRp: 114570000,
    hppPerUnitRp: 458280,
    sumberBahanDoc: "MB-2611-035 (8,82 t)",
    sumberTklDoc: "KJK-SPK-011 (54 jam)",
    sumberOverheadDoc: "Tarif Nov 2026 (Rp 45.000/DLH)",
    tarifOverheadPerDlh: 45000,
    totalDlh: 54,
    statusPostingHpp: "FINAL_DIPOSTING",
    tanggalPosting: "20 Nov 2026 · 11.00",
  },
];
