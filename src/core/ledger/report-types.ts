export type KelompokAkun =
  | "aset"
  | "kewajiban"
  | "ekuitas"
  | "pendapatan"
  | "beban"
  | null;

export interface BarisLaporan {
  barisId: string;
  jurnalId: string;
  tanggal: string;
  dibuatPada: string;
  sumberTipe: string;
  sumberNomor: string;
  sumberPemicu: string;
  akunId: string;
  akunNomor: string;
  akunNama: string;
  akunPeran: string;
  debit: string;
  kredit: string;
}

export interface AkunRingkas {
  id: string;
  nomor: string;
  nama: string;
  peran: string;
}

export interface BarisBukuBesar {
  barisId: string;
  jurnalId: string;
  tanggal: string;
  sumberTipe: string;
  sumberNomor: string;
  sumberPemicu: string;
  debitCents: string;
  kreditCents: string;
  saldoCents: string;
}

export interface LaporanBukuBesar {
  akun: AkunRingkas;
  saldoAwalCents: string;
  baris: BarisBukuBesar[];
  totalDebitCents: string;
  totalKreditCents: string;
  saldoAkhirCents: string;
}

export interface BarisNeracaSaldo {
  akunId: string;
  nomor: string;
  nama: string;
  peran: string;
  debitCents: string;
  kreditCents: string;
}

export interface LaporanNeracaSaldo {
  baris: BarisNeracaSaldo[];
  totalDebitCents: string;
  totalKreditCents: string;
  selisihCents: string;
  seimbang: boolean;
}

export interface BarisLabaRugi {
  akunId: string;
  nomor: string;
  nama: string;
  peran: string;
  nilaiCents: string;
}

export interface LaporanLabaRugi {
  pendapatan: BarisLabaRugi[];
  beban: BarisLabaRugi[];
  totalPendapatanCents: string;
  totalBebanCents: string;
  labaBersihCents: string;
}

export interface BarisNeraca {
  akunId: string;
  nomor: string;
  nama: string;
  peran: string;
  nilaiCents: string;
}

export interface LaporanNeraca {
  aset: BarisNeraca[];
  kewajiban: BarisNeraca[];
  ekuitas: BarisNeraca[];
  belumDiklasifikasi: BarisNeraca[];
  labaTahunBerjalanCents: string;
  totalAsetCents: string;
  totalKewajibanCents: string;
  totalEkuitasCents: string;
  totalPasivaCents: string;
  selisihCents: string;
  seimbang: boolean;
}

export interface BarisDaftarJurnal {
  barisId: string;
  jurnalId: string;
  tanggal: string;
  sumberTipe: string;
  sumberNomor: string;
  sumberPemicu: string;
  akunNomor: string;
  akunNama: string;
  akunPeran: string;
  debitCents: string;
  kreditCents: string;
}

export interface LaporanDaftarJurnal {
  baris: BarisDaftarJurnal[];
  jumlahJurnal: number;
  totalDebitCents: string;
  totalKreditCents: string;
}
