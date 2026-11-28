export type FormatTanggal = "YYYY-MM-DD" | "DD/MM/YYYY";

/** Column mapping profile (D-52): the machine brand never shapes the parser, only this profile. */
export type ProfilPemetaan = {
  pemisah: "," | ";" | "\t";
  formatTanggal: FormatTanggal;
  kolomIdMesin: string;
  kolomTanggal: string;
  kolomJamMasuk: string;
  kolomJamPulang: string;
  diubahOleh: string;
  diubahPada: string;
};

export type PemetaanId = { idMesin: string; karyawanId: string; nama: string; nik: string; oleh: string; pada: string };

export type JenisLewat = "TIDAK_TERPETAKAN" | "BENTROK" | "DI_LUAR_PERIODE" | "NONAKTIF";

export type BarisDilewati = { baris: number; idMesin: string; tanggal: string; jenis: JenisLewat; alasan: string };

export type HasilImpor = {
  id: string;
  periodeId: string;
  namaBerkas: string;
  hash: string;
  oleh: string;
  pada: string;
  tersimpan: number;
  dilewati: BarisDilewati[];
};
