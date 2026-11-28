import { moneyToCents, parseDecimal, sumSigned, type DecimalOptions } from "../ledger/money.ts";

export interface MutasiKartu {
  id: string;
  tanggal: string;
  tipe: string;
  qty: string;
  nilai: string;
  hargaSatuan: string;
  sumberTipe: string;
  sumberId: string;
  alasan?: string | null;
}

export interface SaldoAwalKartu {
  qty: string;
  nilai: string;
}

export interface BarisKartuPersediaan {
  id: string;
  tanggal: string;
  tipe: string;
  sumberTipe: string;
  sumberId: string;
  alasan: string | null;
  qtyMasuk: string;
  qtyKeluar: string;
  nilaiMasukCents: string;
  nilaiKeluarCents: string;
  saldoQty: string;
  saldoNilaiCents: string;
}

export interface LaporanKartuPersediaan {
  baris: BarisKartuPersediaan[];
  totalMasukQty: string;
  totalKeluarQty: string;
  saldoAkhirQty: string;
  saldoAkhirNilaiCents: string;
}

const SKALA_QTY = 4;
// Money stays in cents internally; input is validated as whole rupiah by moneyToCents.
const SKALA_UANG = 2;

const PILIHAN_QTY: DecimalOptions = {
  scale: SKALA_QTY,
  allowNegative: true,
  rejectExcessPrecision: true,
  allowLeadingZeros: true,
  trim: true,
};

function pangkat(scale: number): bigint {
  return BigInt(10) ** BigInt(scale);
}

function parseQty(value: string): bigint {
  const hasil = parseDecimal(value, PILIHAN_QTY);
  if (hasil === null) throw new Error(`Nilai desimal tidak valid: ${value}`);
  return hasil;
}

function formatDesimal(units: bigint, skala: number): string {
  const negatif = units < BigInt(0);
  const absolut = negatif ? -units : units;
  const faktor = pangkat(skala);
  const utuh = (absolut / faktor).toString();
  const pecahan = (absolut % faktor)
    .toString()
    .padStart(skala, "0")
    .replace(/0+$/, "");
  return `${negatif ? "-" : ""}${utuh}${pecahan ? `,${pecahan}` : ""}`;
}

function formatMentah(units: bigint, skala: number): string {
  const negatif = units < BigInt(0);
  const absolut = negatif ? -units : units;
  const faktor = pangkat(skala);
  const utuh = (absolut / faktor).toString();
  const pecahan = (absolut % faktor)
    .toString()
    .padStart(skala, "0")
    .replace(/0+$/, "");
  return `${negatif ? "-" : ""}${utuh}${pecahan ? `.${pecahan}` : ""}`;
}

export function hitungSaldoKartu(
  mutasi: readonly MutasiKartu[],
): SaldoAwalKartu {
  let qty = BigInt(0);
  let nilai = BigInt(0);

  for (const item of mutasi) {
    const qtyItem = parseQty(item.qty);
    const nilaiItem = moneyToCents(item.nilai, true);
    qty += qtyItem;
    nilai = sumSigned([[qtyItem, nilaiItem]], "quantity-sign", nilai);
  }

  return {
    qty: formatMentah(qty, SKALA_QTY),
    nilai: formatMentah(nilai, SKALA_UANG),
  };
}

export function uangMentahKeCents(value: string): string {
  return moneyToCents(value).toString();
}

function waktu(value: string): number {
  const hasil = Date.parse(value);
  return Number.isNaN(hasil) ? 0 : hasil;
}

export function hitungKartuPersediaan(
  mutasi: readonly MutasiKartu[],
  saldoAwal: SaldoAwalKartu,
): LaporanKartuPersediaan {
  let saldoQty = parseQty(saldoAwal.qty);
  let saldoNilai = moneyToCents(saldoAwal.nilai, true);
  let totalMasuk = BigInt(0);
  let totalKeluar = BigInt(0);

  const terurut = [...mutasi].sort((a, b) => {
    const selisihTanggal = waktu(a.tanggal) - waktu(b.tanggal);
    if (selisihTanggal !== 0) return selisihTanggal;
    return a.id.localeCompare(b.id);
  });

  const baris = terurut.map((item) => {
    const qty = parseQty(item.qty);
    const nilai = moneyToCents(item.nilai, true);
    const masuk = qty > BigInt(0);
    const nilaiBertanda = sumSigned([[qty, nilai]], "quantity-sign");

    saldoQty += qty;
    saldoNilai += nilaiBertanda;

    if (masuk) totalMasuk += qty;
    else totalKeluar += -qty;

    return {
      id: item.id,
      tanggal: item.tanggal,
      tipe: item.tipe,
      sumberTipe: item.sumberTipe,
      sumberId: item.sumberId,
      alasan: item.alasan ?? null,
      qtyMasuk: masuk ? formatDesimal(qty, SKALA_QTY) : "0",
      qtyKeluar: masuk ? "0" : formatDesimal(-qty, SKALA_QTY),
      nilaiMasukCents: masuk ? nilai.toString() : "0",
      nilaiKeluarCents: masuk ? "0" : nilai.toString(),
      saldoQty: formatDesimal(saldoQty, SKALA_QTY),
      saldoNilaiCents: saldoNilai.toString(),
    };
  });

  return {
    baris,
    totalMasukQty: formatDesimal(totalMasuk, SKALA_QTY),
    totalKeluarQty: formatDesimal(totalKeluar, SKALA_QTY),
    saldoAkhirQty: formatDesimal(saldoQty, SKALA_QTY),
    saldoAkhirNilaiCents: saldoNilai.toString(),
  };
}

export interface RekonsiliasiPersediaan {
  nilaiMutasiCents: string;
  nilaiJurnalCents: string;
  selisihCents: string;
  cocok: boolean;
}

/**
 * Net signed mutasi value (masuk − keluar) in cents for one set of movements.
 * Sign follows qty so callers never reinterpret `tipe` labels.
 */
export function hitungTotalNilaiMutasiCents(
  mutasi: readonly MutasiKartu[],
): string {
  const pasangan: [bigint, bigint][] = [];
  for (const item of mutasi) {
    pasangan.push([
      parseQty(item.qty),
      moneyToCents(item.nilai, true),
    ]);
  }
  return sumSigned(pasangan, "quantity-sign").toString();
}

/**
 * Aggregate control total comparing stock movements against persediaan
 * journals (D-57 "dicocokkan"). A non-zero selisih is surfaced, never hidden;
 * per-product linkage waits for the product → account mapping (PR-006/INT-003).
 */
export function rekonsiliasiPersediaan(
  nilaiMutasiCents: string | bigint,
  nilaiJurnalCents: string | bigint,
): RekonsiliasiPersediaan {
  const mutasi = BigInt(nilaiMutasiCents);
  const jurnal = BigInt(nilaiJurnalCents);
  const selisih = sumSigned([[mutasi, jurnal]], "first-minus-second");
  return {
    nilaiMutasiCents: mutasi.toString(),
    nilaiJurnalCents: jurnal.toString(),
    selisihCents: selisih.toString(),
    cocok: selisih === BigInt(0),
  };
}
