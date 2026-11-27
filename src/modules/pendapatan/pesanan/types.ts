import type { StatusOption } from "@/components/ui/status-badge";
import type { RiwayatStatus } from "@/core/dokumen";

export const STATUS_PESANAN_OPTIONS: readonly StatusOption[] = [
  { value: "DRAFT", label: "Draft", tone: "neutral" },
  { value: "REVISI", label: "Perlu Revisi", tone: "warning" },
  { value: "VERIFIED", label: "Terverifikasi", tone: "info" },
  { value: "MENUNGGU_PERSETUJUAN_KREDIT", label: "Menunggu Kredit", tone: "warning" },
  { value: "MENUNGGU_STOK", label: "Menunggu Stok", tone: "warning" },
  { value: "SIAP_KIRIM", label: "Siap Kirim", tone: "info" },
  { value: "TERKIRIM_SEBAGIAN", label: "Terkirim Sebagian", tone: "info" },
  { value: "TERKIRIM", label: "Terkirim", tone: "success" },
  { value: "DIFAKTURKAN", label: "Difakturkan", tone: "success" },
  { value: "SELESAI", label: "Selesai", tone: "success" },
  { value: "DIBATALKAN", label: "Dibatalkan", tone: "danger" },
];

export interface PelangganRef {
  id: string;
  kodePelanggan: string;
  nama: string;
  terminHari: number;
  batasKredit: string;
  status: string;
}

export interface ProdukRef {
  id: string;
  kode: string;
  nama: string;
  satuanKode: string;
  satuanNama: string;
  hargaJual: number;
}

export interface PesananItemRow {
  id: string;
  pesananId: string;
  produkId: string;
  produkKode: string;
  produkNama: string;
  satuanKode: string;
  urutan: number;
  qty: number;
  hargaSatuan: number;
  diskonPersen: number;
  nilaiKotor: number;
  diskonNilai: number;
  dpp: number;
  ppn: number;
  total: number;
}

export interface PesananRingkas {
  id: string;
  dokumenId: string | null;
  nomor: string;
  tanggal: string;
  pelangganId: string;
  pelangganKode: string;
  pelangganNama: string;
  terminHari: number;
  status: string;
  nilaiKotor: number;
  diskonTotal: number;
  dpp: number;
  ppn: number;
  total: number;
  tarifPpn: number;
  createdBy: string;
  createdAt: string;
}

export interface PesananDetail extends PesananRingkas {
  alasanBatal: string | null;
  alasanRevisi: string | null;
  alasanOverride: string | null;
  verifiedBy: string | null;
  verifiedAt: string | null;
  updatedAt: string;
  batasKreditPelanggan: number;
  exposureSaatIni: number;
  items: PesananItemRow[];
  riwayat: RiwayatStatus[];
  dokumenVersi: number;
}
