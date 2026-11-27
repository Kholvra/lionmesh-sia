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

