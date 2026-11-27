import type { StatusOption } from "@/components/ui/status-badge";
import type { RiwayatStatus } from "@/core/dokumen";
import type { AgingBucketDef } from "./constants";

export const STATUS_FAKTUR_OPTIONS: readonly StatusOption[] = [
  { value: "DRAFT", label: "Draft", tone: "neutral" },
  { value: "DITERBITKAN", label: "Diterbitkan", tone: "info" },
  { value: "SEBAGIAN_LUNAS", label: "Sebagian Lunas", tone: "warning" },
  { value: "LUNAS", label: "Lunas", tone: "success" },
  { value: "DIBATALKAN", label: "Dibatalkan", tone: "danger" },
];

export interface FakturItemRow {
  id: string;
  fakturId: string;
  pengirimanItemId: string;
  pesananItemId: string;
  produkId: string;
  produkKode: string;
  produkNama: string;
  satuanKode: string;
  qty: number;
  hargaSatuan: number;
  diskonPersen: number;
  nilaiKotor: number;
  nilaiDiskon: number;
  dpp: number;
  ppn: number;
  total: number;
}

export interface FakturRingkas {
  id: string;
  dokumenId: string | null;
  nomor: string;
  pengirimanId: string;
  pengirimanNomor: string;
  pesananId: string;
  pesananNomor: string;
  pelangganId: string;
  pelangganKode: string;
  pelangganNama: string;
  tanggalFaktur: string;
  terminHari: number;
  jatuhTempo: string;
  nomorFakturPajak: string | null;
  dpp: number;
  tarifPpn: number;
  ppn: number;
  total: number;
  sisaPiutang: number;
  status: string;
  createdAt: string;
}

export interface FakturDetail extends FakturRingkas {
  jurnalId: string | null;
  jurnalPembalikId: string | null;
  alasanBatal: string | null;
  items: FakturItemRow[];
  riwayat: RiwayatStatus[];
}

export interface PengirimanSiapFakturItemRef {
  pengirimanItemId: string;
  pesananItemId: string;
  produkId: string;
  produkKode: string;
  produkNama: string;
  satuanKode: string;
  qty: number;
  hargaSatuan: number;
  diskonPersen: number;
}

export interface PengirimanSiapFakturRef {
  id: string;
  nomor: string;
  pesananId: string;
  pesananNomor: string;
  pelangganId: string;
  pelangganKode: string;
  pelangganNama: string;
  terminHari: number;
  tanggalPengiriman: string;
  items: PengirimanSiapFakturItemRef[];
}

export interface PiutangAgingRow {
  id: string;
  nomor: string;
  pelangganId: string;
  pelangganKode: string;
  pelangganNama: string;
  tanggalFaktur: string;
  jatuhTempo: string;
  total: number;
  sisaPiutang: number;
  status: string;
  umurHari: number;
  bucketKey: AgingBucketDef["key"];
  bucketLabel: string;
}

export interface PiutangSummaryData {
  tanggalLaporan: string;
  totalPiutang: number;
  totalsByBucket: Record<AgingBucketDef["key"], number>;
  rows: PiutangAgingRow[];
}
