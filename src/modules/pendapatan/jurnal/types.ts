export const SUMBER_JURNAL_PENDAPATAN = [
  "PENGIRIMAN",
  "FAKTUR",
  "PENERIMAAN",
  "RETUR",
  "PEMBALIKAN",
] as const;

export interface JurnalRingkas {
  id: string;
  tanggal: string;
  sumberTipe: string;
  sumberId: string;
  sumberNomor: string;
  sumberPemicu: string;
  totalDebit: number;
  totalKredit: number;
  jurnalAsalId: string | null;
  createdAt: string;
}

export interface JurnalBarisRow {
  id: string;
  akunNomor: string;
  akunNama: string;
  akunPeran: string;
  debit: number;
  kredit: number;
}

export interface JurnalDetail extends JurnalRingkas {
  baris: JurnalBarisRow[];
}
