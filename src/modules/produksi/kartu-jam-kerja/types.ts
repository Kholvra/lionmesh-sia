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

