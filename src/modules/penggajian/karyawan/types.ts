export type TipeKaryawan = "PRODUKSI" | "NON_PRODUKSI";

export type StatusKaryawan = "AKTIF" | "NONAKTIF";

/** Derived from dates, never stored (D-47). */
export type KeadaanGajiPokok = "dijadwalkan" | "berlaku" | "digantikan";

export type Rekening = {
  namaBank: string;
  nomor: string;
  namaPemilik: string;
};

export type JejakAudit = {
  oleh: string;
  pada: string;
};

export type GajiPokok = JejakAudit & {
  id: string;
  nominal: number;
  tanggalBerlaku: string;
};

export type RiwayatPerubahan = JejakAudit & {
  id: string;
  keterangan: string;
};

export type Karyawan = {
  id: string;
  nik: string;
  nama: string;
  jabatanId: string;
  departemenId: string;
  tipe: TipeKaryawan;
  ptkpKode: string;
  rekening: Rekening;
  tanggalMasuk: string;
  tanggalKeluar: string | null;
  status: StatusKaryawan;
  gajiPokok: GajiPokok[];
  riwayat: RiwayatPerubahan[];
};

export type PilihanMaster = {
  id: string;
  nama: string;
};

export type KategoriPtkp = {
  kode: string;
  keterangan: string;
};

export type DataKaryawanInput = {
  nama: string;
  jabatanId: string;
  departemenId: string;
  tipe: string;
  ptkpKode: string;
  rekening: Rekening;
  tanggalMasuk: string;
};

export type KaryawanBaruInput = DataKaryawanInput & {
  nik: string;
  gajiPokok: string;
  tanggalBerlaku: string;
};

export type GajiPokokInput = {
  nominal: string;
  tanggalBerlaku: string;
};

export type DaftarAktif = {
  jabatan: readonly PilihanMaster[];
  departemen: readonly PilihanMaster[];
  ptkp: readonly KategoriPtkp[];
};
