import type { StatusOption } from "@/components/ui/status-badge";
import type { RiwayatStatus } from "@/core/dokumen";

export const STATUS_PEMBAYARAN_OPTIONS: readonly StatusOption[] = [
  { value: "DICATAT", label: "Dicatat (Menunggu Verifikasi)", tone: "warning" },
  { value: "TERVERIFIKASI", label: "Terverifikasi", tone: "success" },
  { value: "DIBATALKAN", label: "Dibatalkan", tone: "danger" },
];

export interface PembayaranAlokasiRow {
  id: string;
  fakturId: string;
  fakturNomor: string;
  tanggalFaktur: string;
  nominal: number;
  sisaFakturSaatIni: number;
  statusFaktur: string;
}

export interface PembayaranRingkas {
  id: string;
  dokumenId: string | null;
  nomor: string;
  pelangganId: string;
  pelangganKode: string;
  pelangganNama: string;
  tanggal: string;
  nominal: number;
  metode: string;
  nomorReferensi: string | null;
  status: string;
  createdBy: string | null;
  createdAt: string;
}

export interface PembayaranDetail extends PembayaranRingkas {
  jurnalId: string | null;
  jurnalPembalikId: string | null;
  alasanBatal: string | null;
  alokasi: PembayaranAlokasiRow[];
  riwayat: RiwayatStatus[];
}

export interface FakturTerbukaRef {
  id: string;
  nomor: string;
  tanggalFaktur: string;
  jatuhTempo: string;
  total: number;
  sisaPiutang: number;
}

export interface PelangganTagihanRef {
  id: string;
  kodePelanggan: string;
  nama: string;
  totalTagihanTerbuka: number;
  fakturTerbuka: FakturTerbukaRef[];
}
