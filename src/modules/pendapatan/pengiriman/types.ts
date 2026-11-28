import type { StatusOption } from "@/components/ui/status-badge";
import type { RiwayatStatus } from "@/core/dokumen";

export const STATUS_PENGIRIMAN_OPTIONS: readonly StatusOption[] = [
  { value: "DRAFT", label: "Draft", tone: "neutral" },
  { value: "DIKIRIM", label: "Dikirim (SJ Terbit)", tone: "info" },
  { value: "DITERIMA", label: "Diterima", tone: "success" },
  { value: "DIBATALKAN", label: "Dibatalkan", tone: "danger" },
];

export interface PengirimanItemRow {
  id: string;
  pengirimanId: string;
  pesananItemId: string;
  produkId: string;
  produkKode: string;
  produkNama: string;
  satuanKode: string;
  gudangId: string;
  gudangKode: string;
  gudangNama: string;
  qty: number;
}

export interface PengirimanRingkas {
  id: string;
  dokumenId: string | null;
  nomor: string;
  pesananId: string;
  pesananNomor: string;
  pelangganKode: string;
  pelangganNama: string;
  tanggalPengiriman: string;
  status: string;
  keterangan: string | null;
  tanggalTerima: string | null;
  namaPenerima: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface PengirimanDetail extends PengirimanRingkas {
  alasanBatal: string | null;
  pesananStatus: string;
  pesananCreatedBy: string;
  items: PengirimanItemRow[];
  riwayat: RiwayatStatus[];
}

export interface PesananSiapKirimItemRef {
  pesananItemId: string;
  produkId: string;
  produkKode: string;
  produkNama: string;
  satuanKode: string;
  gudangId: string;
  gudangKode: string;
  gudangNama: string;
  qtyPesanan: number;
  qtyTerkirimSebelumnya: number;
  qtyAlokasiAktif: number;
}

export interface PesananSiapKirimRef {
  id: string;
  nomor: string;
  tanggal: string;
  status: string;
  pelangganNama: string;
  pelangganKode: string;
  items: PesananSiapKirimItemRef[];
}
