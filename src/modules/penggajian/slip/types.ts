export type Cetakan = { oleh: string; pada: string; ulang: boolean };

/** A printed slip never changes; a correction is a new replacement slip with a reason (T-08). */
export type Slip = {
  id: string;
  periodeId: string;
  karyawanId: string;
  jenis: "ASLI" | "PENGGANTI";
  alasan?: string;
  menggantikanId?: string;
  dibuatOleh: string;
  dibuatPada: string;
  cetakan: Cetakan[];
};
