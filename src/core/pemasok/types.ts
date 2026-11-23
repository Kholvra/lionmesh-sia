export interface Pemasok {
  id: string;
  nama: string;
  alamat: string | null;
  npwp: string | null;
  kontak_perusahaan: string | null;
  kontak_pic_nama: string | null;
  kontak_pic_telepon: string | null;
  termin_hari: number;
  toleransi_persen: string;
  toleransi_nominal: string;
  aktif: boolean;
  created_at: string;
  updated_at: string;
}

export interface RiwayatStatusPemasok {
  id: string;
  aksi: string;
  status_lama: string | null;
  status_baru: string | null;
  actor_id: string | null;
  actor_nama: string;
  created_at: string;
}

export interface PemasokInput {
  nama: string;
  alamat: string | null;
  npwp: string | null;
  kontakPerusahaan: string | null;
  kontakPicNama: string | null;
  kontakPicTelepon: string | null;
  terminHari: number;
  toleransiPersen: number;
  /** Decimal string: numeric(18,2) must not pass through a JS number. */
  toleransiNominal: string;
}

export interface PemasokListOptions {
  aktif?: boolean;
}
