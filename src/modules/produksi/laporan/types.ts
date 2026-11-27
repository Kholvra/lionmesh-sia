export interface LaporanProduksiRow {
  nomorSpk: string;
  produkNama: string;
  produkKode: string;
  tanggalSelesai: string;
  jumlahDiproses: number;
  lulusQc: number;
  rework: number;
  reject: number;
  kerugianProduksiRp: number;
  yieldPersen: number; // lolos / diproses
  efisiensiBahanPersen: number; // standar / aktual
}

export interface LaporanWipRow {
  nomorSpk: string;
  produkNama: string;
  tanggalMulai: string;
  statusWo: string;
  targetLembar: number;
  selesaiLembar: number;
  biayaBahanWipRp: number;
  biayaTklWipRp: number;
  biayaOverheadWipRp: number;
  totalSaldoWipRp: number;
}

export interface RekapPersediaanRow {
  kategori: "Bahan Baku" | "Barang Dalam Proses (WIP)" | "Barang Jadi";
  kodeBarang: string;
  namaBarang: string;
  satuan: string;
  kuantitas: number;
  hargaRataRp: number;
  totalNilaiRp: number;
  gudang: string;
}

export const INITIAL_LAPORAN_PRODUKSI: LaporanProduksiRow[] = [
  {
    nomorSpk: "SPK-2611-013",
    produkNama: "Wiremesh M6",
    produkKode: "WM-M6",
    tanggalSelesai: "28 Nov 2026",
    jumlahDiproses: 120,
    lulusQc: 118,
    rework: 2,
    reject: 0,
    kerugianProduksiRp: 0,
    yieldPersen: 98.3,
    efisiensiBahanPersen: 98.8,
  },
  {
    nomorSpk: "SPK-2611-012",
    produkNama: "Wiremesh M8",
    produkKode: "WM-M8",
    tanggalSelesai: "21 Nov 2026",
    jumlahDiproses: 400,
    lulusQc: 395,
    rework: 3,
    reject: 2,
    kerugianProduksiRp: 0, // Dalam batas toleransi reject 1%
    yieldPersen: 98.8,
    efisiensiBahanPersen: 99.2,
  },
  {
    nomorSpk: "SPK-2611-011",
    produkNama: "Wiremesh M6",
    produkKode: "WM-M6",
    tanggalSelesai: "19 Nov 2026",
    jumlahDiproses: 250,
    lulusQc: 250,
    rework: 0,
    reject: 0,
    kerugianProduksiRp: 0,
    yieldPersen: 100.0,
    efisiensiBahanPersen: 99.5,
  },
];

export const INITIAL_LAPORAN_WIP: LaporanWipRow[] = [
  {
    nomorSpk: "SPK-2611-013",
    produkNama: "Wiremesh M6",
    tanggalMulai: "27 Nov 2026",
    statusWo: "DIPROSES (WIP)",
    targetLembar: 120,
    selesaiLembar: 118,
    biayaBahanWipRp: 52750000,
    biayaTklWipRp: 770000,
    biayaOverheadWipRp: 990000,
    totalSaldoWipRp: 54510000,
  },
];

export const INITIAL_REKAP_PERSEDIAAN: RekapPersediaanRow[] = [
  {
    kategori: "Bahan Baku",
    kodeBarang: "BB-WR06",
    namaBarang: "Wire rod 6 mm",
    satuan: "ton",
    kuantitas: 3.2,
    hargaRataRp: 12500000,
    totalNilaiRp: 40000000,
    gudang: "Gudang Bahan Baku",
  },
  {
    kategori: "Bahan Baku",
    kodeBarang: "BB-WR08",
    namaBarang: "Wire rod 8 mm",
    satuan: "ton",
    kuantitas: 5.8,
    hargaRataRp: 12500000,
    totalNilaiRp: 72500000,
    gudang: "Gudang Bahan Baku",
  },
  {
    kategori: "Barang Dalam Proses (WIP)",
    kodeBarang: "WIP-SPK-013",
    namaBarang: "WIP Wiremesh M6 (SPK-2611-013)",
    satuan: "batch",
    kuantitas: 1,
    hargaRataRp: 54510000,
    totalNilaiRp: 54510000,
    gudang: "Lantai Produksi Mesin Las 1",
  },
  {
    kategori: "Barang Jadi",
    kodeBarang: "WM-M6-2154",
    namaBarang: "Wiremesh M6 (2,1m × 5,4m)",
    satuan: "lembar",
    kuantitas: 250,
    hargaRataRp: 458280,
    totalNilaiRp: 114570000,
    gudang: "Gudang Barang Jadi",
  },
  {
    kategori: "Barang Jadi",
    kodeBarang: "WM-M8-2154",
    namaBarang: "Wiremesh M8 (2,1m × 5,4m)",
    satuan: "lembar",
    kuantitas: 395,
    hargaRataRp: 826076,
    totalNilaiRp: 326300000,
    gudang: "Gudang Barang Jadi",
  },
];
