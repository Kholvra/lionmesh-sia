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
const SKALA_UANG = 2;

function pangkat(scale: number): bigint {
  return BigInt(10) ** BigInt(scale);
}

function parseDesimal(value: string, skala: number): bigint {
  const cocok = /^(-?)(\d+)(?:\.(\d+))?$/.exec(value.trim());
  if (!cocok) {
    throw new Error(`Nilai desimal tidak valid: ${value}`);
  }

  const negatif = cocok[1] === "-";
  const utuh = BigInt(cocok[2]);
  const pecahan = (cocok[3] ?? "").slice(0, skala).padEnd(skala, "0");
  const nilai = utuh * pangkat(skala) + BigInt(pecahan || "0");
  return negatif ? -nilai : nilai;
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
    const qtyItem = parseDesimal(item.qty, SKALA_QTY);
    const nilaiItem = parseDesimal(item.nilai, SKALA_UANG);
    qty += qtyItem;
    nilai += qtyItem > BigInt(0) ? nilaiItem : -nilaiItem;
  }

  return {
    qty: formatMentah(qty, SKALA_QTY),
    nilai: formatMentah(nilai, SKALA_UANG),
  };
}

export function uangMentahKeCents(value: string): string {
  return parseDesimal(value, SKALA_UANG).toString();
}

function waktu(value: string): number {
  const hasil = Date.parse(value);
  return Number.isNaN(hasil) ? 0 : hasil;
}

export function hitungKartuPersediaan(
  mutasi: readonly MutasiKartu[],
  saldoAwal: SaldoAwalKartu,
): LaporanKartuPersediaan {
  let saldoQty = parseDesimal(saldoAwal.qty, SKALA_QTY);
  let saldoNilai = parseDesimal(saldoAwal.nilai, SKALA_UANG);
  let totalMasuk = BigInt(0);
  let totalKeluar = BigInt(0);

  const terurut = [...mutasi].sort((a, b) => {
    const selisihTanggal = waktu(a.tanggal) - waktu(b.tanggal);
    if (selisihTanggal !== 0) return selisihTanggal;
    return a.id.localeCompare(b.id);
  });

  const baris = terurut.map((item) => {
    const qty = parseDesimal(item.qty, SKALA_QTY);
    const nilai = parseDesimal(item.nilai, SKALA_UANG);
    const masuk = qty > BigInt(0);
    const nilaiBertanda = masuk ? nilai : -nilai;

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
