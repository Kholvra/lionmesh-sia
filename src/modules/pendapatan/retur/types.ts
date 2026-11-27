import type { StatusOption } from "@/components/ui/status-badge";
import type { RiwayatStatus } from "@/core/dokumen";

export const STATUS_RETUR_OPTIONS: readonly StatusOption[] = [
  { value: "DIAJUKAN", label: "Diajukan", tone: "info" },
  { value: "DISETUJUI", label: "Disetujui Accounting", tone: "warning" },
  { value: "SELESAI", label: "Selesai (QC Lulus)", tone: "success" },
  { value: "DITOLAK", label: "Ditolak", tone: "danger" },
  { value: "DIBATALKAN", label: "Dibatalkan", tone: "neutral" },
];

export interface ReturItemRow {
  id: string;
  fakturItemId: string;
  produkId: string;
  produkKode: string;
  produkNama: string;
  satuanKode: string;
  gudangId: string;
  gudangNama: string;
  qtyRetur: number;
  qtyLulus: number;
  hargaSatuan: number;
  diskonPersen: number;
  dpp: number;
  ppn: number;
  total: number;
  nilaiMasukStok: number;
}

export interface ReturRingkas {
  id: string;
  dokumenId: string | null;
  nomor: string;
  fakturId: string;
  fakturNomor: string;
  pelangganId: string;
  pelangganKode: string;
  pelangganNama: string;
  tanggal: string;
  alasan: string;
  status: string;
  totalKreditMemo: number;
  createdBy: string | null;
  createdAt: string;
}

export interface ReturDetail extends ReturRingkas {
  tarifPpnFaktur: number;
  sisaPiutangFaktur: number;
  alasanTolak: string | null;
  qcCatatan: string | null;
  totalDpp: number;
  totalPpn: number;
  jurnalKreditMemoId: string | null;
  jurnalHppId: string | null;
  items: ReturItemRow[];
  riwayat: RiwayatStatus[];
}

export interface FakturItemReturRef {
  id: string;
  produkId: string;
  produkKode: string;
  produkNama: string;
  satuanKode: string;
  gudangId: string;
  gudangNama: string;
  qtyDikirim: number;
  qtySudahRetur: number;
  sisaBolehRetur: number;
  hargaSatuan: number;
  diskonPersen: number;
}

export interface FakturReturRef {
  id: string;
  nomor: string;
  pelangganId: string;
  pelangganKode: string;
  pelangganNama: string;
  tanggalFaktur: string;
  tarifPpn: number;
  sisaPiutang: number;
  status: string;
  items: FakturItemReturRef[];
}
