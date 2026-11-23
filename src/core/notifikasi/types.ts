export const STATUS_PENGIRIMAN_EMAIL = ["menunggu", "terkirim", "gagal"] as const;

export type StatusPengirimanEmail = (typeof STATUS_PENGIRIMAN_EMAIL)[number];

export interface PengirimanEmail {
  id: string;
  notifikasi_id: string;
  alamat: string;
  status: StatusPengirimanEmail;
  percobaan: number;
  alasan: string | null;
  jadwal_berikutnya: string | null;
  terkirim_at: string | null;
  created_at: string;
}

export interface Notifikasi {
  id: string;
  penerima_id: string;
  jenis: string;
  judul: string;
  nomor_dokumen: string | null;
  tautan: string | null;
  kanal_email: boolean;
  dibaca_at: string | null;
  created_at: string;
  pengiriman_email: PengirimanEmail | null;
}
