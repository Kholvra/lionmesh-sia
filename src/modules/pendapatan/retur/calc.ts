export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export interface KreditMemoBarisInput {
  qtyLulus: number;
  hargaSatuan: number;
  diskonPersen: number;
  tarifPpn: number;
}

export interface KreditMemoBarisResult {
  dpp: number;
  ppn: number;
  total: number;
}

/**
 * PD-007 (AC-05): DPP retur = qty lulus * harga baris faktur asal - diskon baris;
 * PPN retur = DPP retur * tarif faktur asal; total = DPP + PPN.
 */
export function hitungKreditMemoBaris(
  input: KreditMemoBarisInput,
): KreditMemoBarisResult {
  const kotor = input.qtyLulus * input.hargaSatuan;
  const faktorDiskon = 1 - Math.max(0, Math.min(100, input.diskonPersen)) / 100;
  const dpp = round2(kotor * faktorDiskon);
  const ppn = round2(dpp * Math.max(0, input.tarifPpn));
  const total = round2(dpp + ppn);
  return { dpp, ppn, total };
}

/**
 * PD-007 (AC-10, D-10): Nilai stok masuk = qty lulus * harga rata saat retur.
 */
export function hitungNilaiMasukStok(
  qtyLulus: number,
  hargaRata: number,
): number {
  return round2(Math.max(0, qtyLulus) * Math.max(0, hargaRata));
}

export function hitungSisaBolehRetur(
  qtyDikirim: number,
  qtySudahRetur: number,
): number {
  return Math.max(0, round2(qtyDikirim - qtySudahRetur));
}
