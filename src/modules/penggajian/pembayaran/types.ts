export type StatusTransfer = "DIBAYAR" | "GAGAL_TRANSFER";

/** One proof file per batch (T-04); only its metadata is kept until storage exists. */
export type BuktiTransfer = { nama: string; ukuran: number; tipe: string };

export type Percobaan = {
  batchId: string;
  status: StatusTransfer;
  referensi: string;
  alasan?: string;
  oleh: string;
  pada: string;
};

export type TransferKaryawan = {
  karyawanId: string;
  nominal: number;
  status: StatusTransfer;
  percobaan: Percobaan[];
};

export type Batch = {
  id: string;
  bukti: BuktiTransfer;
  oleh: string;
  pada: string;
  jumlahKaryawan: number;
  /** Percobaan ulang carries a reason (D-49); the first batch does not need one. */
  ulang: boolean;
};

export type PembayaranPeriode = {
  periodeId: string;
  batch: Batch[];
  transfer: TransferKaryawan[];
  catatanDana: { oleh: string; pada: string; catatan: string }[];
};
