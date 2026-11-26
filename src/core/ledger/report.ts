import { moneyToCents } from "./money.ts";

export type KelompokAkun =
  | "aset"
  | "kewajiban"
  | "ekuitas"
  | "pendapatan"
  | "beban"
  | null;

const PERAN_ASET = [
  "kas_bank",
  "piutang_usaha",
  "persediaan_bahan",
  "barang_dalam_proses",
  "persediaan_barang_jadi",
] as const;

const PERAN_KEWAJIBAN = ["utang_usaha", "gr_ir", "utang_gaji"] as const;
const PERAN_EKUITAS = ["laba_ditahan"] as const;
const PERAN_PENDAPATAN = ["penjualan"] as const;
const PERAN_BEBAN = [
  "hpp",
  "tenaga_kerja_langsung",
  "overhead_pabrik",
  "beban_gaji_admin",
] as const;

/**
 * Reports classify accounts by role, never by account number (D-35 / INV-04).
 * A role outside the approved COA is returned as null so the caller can surface
 * it instead of silently dropping the amount.
 */
export function kelompokAkun(peran: string): KelompokAkun {
  if ((PERAN_ASET as readonly string[]).includes(peran)) return "aset";
  if ((PERAN_KEWAJIBAN as readonly string[]).includes(peran)) return "kewajiban";
  if ((PERAN_EKUITAS as readonly string[]).includes(peran)) return "ekuitas";
  if ((PERAN_PENDAPATAN as readonly string[]).includes(peran)) return "pendapatan";
  if ((PERAN_BEBAN as readonly string[]).includes(peran)) return "beban";
  return null;
}

const PERAN_PERSEDIAAN = [
  "persediaan_bahan",
  "barang_dalam_proses",
  "persediaan_barang_jadi",
] as const;

export function isPeranPersediaan(peran: string): boolean {
  return (PERAN_PERSEDIAAN as readonly string[]).includes(peran);
}

/**
 * Net persediaan journal movement (debit − credit) in cents for one period.
 * Used by the kartu persediaan reconciliation control total (D-57): journals
 * carry no product breakdown, so the ledger side is always aggregate.
 */
export function totalJurnalPersediaanCents(
  baris: readonly BarisLaporan[],
): string {
  let total = BigInt(0);
  for (const item of baris) {
    if (!isPeranPersediaan(item.akunPeran)) continue;
    total += moneyToCents(item.debit) - moneyToCents(item.kredit);
  }
  return total.toString();
}

export interface BarisLaporan {
  barisId: string;
  jurnalId: string;
  tanggal: string;
  dibuatPada: string;
  sumberTipe: string;
  sumberNomor: string;
  sumberPemicu: string;
  akunId: string;
  akunNomor: string;
  akunNama: string;
  akunPeran: string;
  debit: string;
  kredit: string;
}

export interface AkunRingkas {
  id: string;
  nomor: string;
  nama: string;
  peran: string;
}

export interface BarisBukuBesar {
  barisId: string;
  jurnalId: string;
  tanggal: string;
  sumberTipe: string;
  sumberNomor: string;
  sumberPemicu: string;
  debitCents: string;
  kreditCents: string;
  saldoCents: string;
}

export interface LaporanBukuBesar {
  akun: AkunRingkas;
  saldoAwalCents: string;
  baris: BarisBukuBesar[];
  totalDebitCents: string;
  totalKreditCents: string;
  saldoAkhirCents: string;
}

export interface BarisNeracaSaldo {
  akunId: string;
  nomor: string;
  nama: string;
  peran: string;
  debitCents: string;
  kreditCents: string;
}

export interface LaporanNeracaSaldo {
  baris: BarisNeracaSaldo[];
  totalDebitCents: string;
  totalKreditCents: string;
  selisihCents: string;
  seimbang: boolean;
}

export interface BarisLabaRugi {
  akunId: string;
  nomor: string;
  nama: string;
  peran: string;
  nilaiCents: string;
}

export interface LaporanLabaRugi {
  pendapatan: BarisLabaRugi[];
  beban: BarisLabaRugi[];
  totalPendapatanCents: string;
  totalBebanCents: string;
  labaBersihCents: string;
}

export interface BarisNeraca {
  akunId: string;
  nomor: string;
  nama: string;
  peran: string;
  nilaiCents: string;
}

export interface LaporanNeraca {
  aset: BarisNeraca[];
  kewajiban: BarisNeraca[];
  ekuitas: BarisNeraca[];
  belumDiklasifikasi: BarisNeraca[];
  labaTahunBerjalanCents: string;
  totalAsetCents: string;
  totalKewajibanCents: string;
  totalEkuitasCents: string;
  totalPasivaCents: string;
  selisihCents: string;
  seimbang: boolean;
}

export interface BarisDaftarJurnal {
  barisId: string;
  jurnalId: string;
  tanggal: string;
  sumberTipe: string;
  sumberNomor: string;
  sumberPemicu: string;
  akunNomor: string;
  akunNama: string;
  akunPeran: string;
  debitCents: string;
  kreditCents: string;
}

export interface LaporanDaftarJurnal {
  baris: BarisDaftarJurnal[];
  jumlahJurnal: number;
  totalDebitCents: string;
  totalKreditCents: string;
}

interface AkunTerkumpul {
  akunId: string;
  nomor: string;
  nama: string;
  peran: string;
  debit: bigint;
  kredit: bigint;
}

function waktu(value: string): number {
  const hasil = Date.parse(value);
  return Number.isNaN(hasil) ? 0 : hasil;
}

function urutkanBaris(rows: readonly BarisLaporan[]): BarisLaporan[] {
  return [...rows].sort((a, b) => {
    const selisihTanggal = waktu(a.tanggal) - waktu(b.tanggal);
    if (selisihTanggal !== 0) return selisihTanggal;
    const selisihDibuat = waktu(a.dibuatPada) - waktu(b.dibuatPada);
    if (selisihDibuat !== 0) return selisihDibuat;
    return a.barisId.localeCompare(b.barisId);
  });
}

function bandingkanNomor(a: string, b: string): number {
  return a.localeCompare(b, "id", { numeric: true });
}

function kumpulkan(rows: readonly BarisLaporan[]): Map<string, AkunTerkumpul> {
  const hasil = new Map<string, AkunTerkumpul>();

  for (const row of rows) {
    const debit = moneyToCents(row.debit);
    const kredit = moneyToCents(row.kredit);
    const ada = hasil.get(row.akunId);

    if (ada) {
      ada.debit += debit;
      ada.kredit += kredit;
      continue;
    }

    hasil.set(row.akunId, {
      akunId: row.akunId,
      nomor: row.akunNomor,
      nama: row.akunNama,
      peran: row.akunPeran,
      debit,
      kredit,
    });
  }

  return hasil;
}

function keBarisNeraca(akun: AkunTerkumpul, nilai: bigint): BarisNeraca {
  return {
    akunId: akun.akunId,
    nomor: akun.nomor,
    nama: akun.nama,
    peran: akun.peran,
    nilaiCents: nilai.toString(),
  };
}

export function hitungBukuBesar(
  rows: readonly BarisLaporan[],
  akun: AkunRingkas,
  saldoAwalCents: string,
): LaporanBukuBesar {
  const terpilih = urutkanBaris(rows.filter((row) => row.akunId === akun.id));
  let saldo = BigInt(saldoAwalCents);
  let totalDebit = BigInt(0);
  let totalKredit = BigInt(0);

  const baris = terpilih.map((row) => {
    const debit = moneyToCents(row.debit);
    const kredit = moneyToCents(row.kredit);
    saldo += debit - kredit;
    totalDebit += debit;
    totalKredit += kredit;

    return {
      barisId: row.barisId,
      jurnalId: row.jurnalId,
      tanggal: row.tanggal,
      sumberTipe: row.sumberTipe,
      sumberNomor: row.sumberNomor,
      sumberPemicu: row.sumberPemicu,
      debitCents: debit.toString(),
      kreditCents: kredit.toString(),
      saldoCents: saldo.toString(),
    };
  });

  return {
    akun,
    saldoAwalCents: saldoAwalCents,
    baris,
    totalDebitCents: totalDebit.toString(),
    totalKreditCents: totalKredit.toString(),
    saldoAkhirCents: saldo.toString(),
  };
}

export function saldoNetoCents(rows: readonly BarisLaporan[]): string {
  const neto = rows.reduce(
    (jumlah, row) =>
      jumlah + moneyToCents(row.debit) - moneyToCents(row.kredit),
    BigInt(0),
  );
  return neto.toString();
}

export function hitungNeracaSaldo(
  rows: readonly BarisLaporan[],
): LaporanNeracaSaldo {
  const terkumpul = [...kumpulkan(rows).values()]
    .map((akun) => {
      const neto = akun.debit - akun.kredit;
      return {
        akunId: akun.akunId,
        nomor: akun.nomor,
        nama: akun.nama,
        peran: akun.peran,
        debitCents: neto > BigInt(0) ? neto.toString() : "0",
        kreditCents: neto < BigInt(0) ? (-neto).toString() : "0",
        neto,
      };
    })
    .filter((akun) => akun.neto !== BigInt(0))
    .sort((a, b) => bandingkanNomor(a.nomor, b.nomor));

  const totalDebit = terkumpul.reduce(
    (jumlah, akun) => jumlah + BigInt(akun.debitCents),
    BigInt(0),
  );
  const totalKredit = terkumpul.reduce(
    (jumlah, akun) => jumlah + BigInt(akun.kreditCents),
    BigInt(0),
  );
  const selisih = totalDebit - totalKredit;

  return {
    baris: terkumpul.map((akun) => ({
      akunId: akun.akunId,
      nomor: akun.nomor,
      nama: akun.nama,
      peran: akun.peran,
      debitCents: akun.debitCents,
      kreditCents: akun.kreditCents,
    })),
    totalDebitCents: totalDebit.toString(),
    totalKreditCents: totalKredit.toString(),
    selisihCents: selisih.toString(),
    seimbang: selisih === BigInt(0),
  };
}

export function hitungLabaRugi(
  rows: readonly BarisLaporan[],
): LaporanLabaRugi {
  const pendapatan: BarisLabaRugi[] = [];
  const beban: BarisLabaRugi[] = [];

  for (const akun of kumpulkan(rows).values()) {
    const kelompok = kelompokAkun(akun.peran);
    if (kelompok !== "pendapatan" && kelompok !== "beban") continue;

    const neto = akun.debit - akun.kredit;
    const nilai = kelompok === "pendapatan" ? -neto : neto;
    if (nilai === BigInt(0)) continue;

    const baris: BarisLabaRugi = {
      akunId: akun.akunId,
      nomor: akun.nomor,
      nama: akun.nama,
      peran: akun.peran,
      nilaiCents: nilai.toString(),
    };

    if (kelompok === "pendapatan") pendapatan.push(baris);
    else beban.push(baris);
  }

  pendapatan.sort((a, b) => bandingkanNomor(a.nomor, b.nomor));
  beban.sort((a, b) => bandingkanNomor(a.nomor, b.nomor));

  const totalPendapatan = pendapatan.reduce(
    (jumlah, akun) => jumlah + BigInt(akun.nilaiCents),
    BigInt(0),
  );
  const totalBeban = beban.reduce(
    (jumlah, akun) => jumlah + BigInt(akun.nilaiCents),
    BigInt(0),
  );

  return {
    pendapatan,
    beban,
    totalPendapatanCents: totalPendapatan.toString(),
    totalBebanCents: totalBeban.toString(),
    labaBersihCents: (totalPendapatan - totalBeban).toString(),
  };
}

export function hitungNeraca(
  rowsKumulatif: readonly BarisLaporan[],
  rowsTahunBerjalan: readonly BarisLaporan[],
): LaporanNeraca {
  const aset: BarisNeraca[] = [];
  const kewajiban: BarisNeraca[] = [];
  const ekuitas: BarisNeraca[] = [];
  const belumDiklasifikasi: BarisNeraca[] = [];

  for (const akun of kumpulkan(rowsKumulatif).values()) {
    const neto = akun.debit - akun.kredit;
    const kelompok = kelompokAkun(akun.peran);

    if (kelompok === "aset") {
      if (neto !== BigInt(0)) aset.push(keBarisNeraca(akun, neto));
      continue;
    }
    if (kelompok === "kewajiban") {
      if (neto !== BigInt(0)) kewajiban.push(keBarisNeraca(akun, -neto));
      continue;
    }
    if (kelompok === "ekuitas") {
      if (neto !== BigInt(0)) ekuitas.push(keBarisNeraca(akun, -neto));
      continue;
    }
    if (kelompok === "pendapatan" || kelompok === "beban") continue;

    if (neto !== BigInt(0)) belumDiklasifikasi.push(keBarisNeraca(akun, neto));
  }

  aset.sort((a, b) => bandingkanNomor(a.nomor, b.nomor));
  kewajiban.sort((a, b) => bandingkanNomor(a.nomor, b.nomor));
  ekuitas.sort((a, b) => bandingkanNomor(a.nomor, b.nomor));
  belumDiklasifikasi.sort((a, b) => bandingkanNomor(a.nomor, b.nomor));

  let labaTahunBerjalan = BigInt(0);
  for (const akun of kumpulkan(rowsTahunBerjalan).values()) {
    const kelompok = kelompokAkun(akun.peran);
    if (kelompok !== "pendapatan" && kelompok !== "beban") continue;
    // Both revenue and expense accounts contribute -net to profit:
    // revenue is credit-normal (negative net), expense is debit-normal.
    labaTahunBerjalan += -(akun.debit - akun.kredit);
  }

  const totalAset = aset.reduce(
    (jumlah, akun) => jumlah + BigInt(akun.nilaiCents),
    BigInt(0),
  );
  const totalKewajiban = kewajiban.reduce(
    (jumlah, akun) => jumlah + BigInt(akun.nilaiCents),
    BigInt(0),
  );
  const totalEkuitasAkun = ekuitas.reduce(
    (jumlah, akun) => jumlah + BigInt(akun.nilaiCents),
    BigInt(0),
  );
  const totalEkuitas = totalEkuitasAkun + labaTahunBerjalan;
  const totalPasiva = totalKewajiban + totalEkuitas;
  const selisih = totalAset - totalPasiva;

  return {
    aset,
    kewajiban,
    ekuitas,
    belumDiklasifikasi,
    labaTahunBerjalanCents: labaTahunBerjalan.toString(),
    totalAsetCents: totalAset.toString(),
    totalKewajibanCents: totalKewajiban.toString(),
    totalEkuitasCents: totalEkuitas.toString(),
    totalPasivaCents: totalPasiva.toString(),
    selisihCents: selisih.toString(),
    seimbang: selisih === BigInt(0),
  };
}

export function susunDaftarJurnal(
  rows: readonly BarisLaporan[],
): LaporanDaftarJurnal {
  const terurut = urutkanBaris(rows);
  const jurnal = new Set<string>();
  let totalDebit = BigInt(0);
  let totalKredit = BigInt(0);

  const baris = terurut.map((row) => {
    const debit = moneyToCents(row.debit);
    const kredit = moneyToCents(row.kredit);
    jurnal.add(row.jurnalId);
    totalDebit += debit;
    totalKredit += kredit;

    return {
      barisId: row.barisId,
      jurnalId: row.jurnalId,
      tanggal: row.tanggal,
      sumberTipe: row.sumberTipe,
      sumberNomor: row.sumberNomor,
      sumberPemicu: row.sumberPemicu,
      akunNomor: row.akunNomor,
      akunNama: row.akunNama,
      akunPeran: row.akunPeran,
      debitCents: debit.toString(),
      kreditCents: kredit.toString(),
    };
  });

  return {
    baris,
    jumlahJurnal: jurnal.size,
    totalDebitCents: totalDebit.toString(),
    totalKreditCents: totalKredit.toString(),
  };
}
