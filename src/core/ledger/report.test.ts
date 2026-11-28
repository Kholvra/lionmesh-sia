import assert from "node:assert/strict";
import test from "node:test";
import { isoWaktuJakarta } from "../../lib/format/date.ts";

import {
  hitungBukuBesar,
  hitungLabaRugi,
  hitungNeraca,
  hitungNeracaSaldo,
  isPeranPersediaan,
  saldoNetoCents,
  susunDaftarJurnal,
  totalJurnalPersediaanCents,
  type BarisLaporan,
} from "./report.ts";
import { isMoney, moneyToCents, roundToWholeRupiah } from "./money.ts";

type AkunKunci =
  | "kas"
  | "piutang"
  | "persediaan_bahan"
  | "utang"
  | "laba_ditahan"
  | "penjualan"
  | "hpp"
  | "tkl"
  | "overhead"
  | "gaji_admin"
  | "ppn";

const AKUN: Record<AkunKunci, { id: string; nomor: string; nama: string; peran: string }> = {
  kas: { id: "akun-kas", nomor: "102", nama: "Bank", peran: "kas_bank" },
  piutang: { id: "akun-piutang", nomor: "110", nama: "Piutang usaha", peran: "piutang_usaha" },
  persediaan_bahan: {
    id: "akun-persediaan",
    nomor: "120",
    nama: "Persediaan bahan baku",
    peran: "persediaan_bahan",
  },
  utang: { id: "akun-utang", nomor: "201", nama: "Utang usaha", peran: "utang_usaha" },
  laba_ditahan: {
    id: "akun-laba-ditahan",
    nomor: "302",
    nama: "Laba ditahan",
    peran: "laba_ditahan",
  },
  penjualan: { id: "akun-penjualan", nomor: "401", nama: "Penjualan", peran: "penjualan" },
  hpp: { id: "akun-hpp", nomor: "501", nama: "Harga pokok penjualan", peran: "hpp" },
  tkl: {
    id: "akun-tkl",
    nomor: "601",
    nama: "Tenaga kerja langsung",
    peran: "tenaga_kerja_langsung",
  },
  overhead: {
    id: "akun-overhead",
    nomor: "602",
    nama: "Overhead pabrik",
    peran: "overhead_pabrik",
  },
  gaji_admin: {
    id: "akun-gaji-admin",
    nomor: "701",
    nama: "Beban gaji administrasi",
    peran: "beban_gaji_admin",
  },
  ppn: { id: "akun-ppn", nomor: "211", nama: "PPN keluaran", peran: "ppn_keluaran" },
};

let urutan = 0;

function baris(
  akun: AkunKunci,
  debit: string,
  kredit: string,
  overrides: Partial<BarisLaporan> = {},
): BarisLaporan {
  urutan += 1;
  const data = AKUN[akun];
  return {
    barisId: `baris-${urutan}`,
    jurnalId: overrides.jurnalId ?? `jurnal-${urutan}`,
    tanggal: overrides.tanggal ?? isoWaktuJakarta("2026-11-05T10:00:00"),
    dibuatPada: overrides.dibuatPada ?? isoWaktuJakarta("2026-11-05T10:00:00"),
    sumberTipe: overrides.sumberTipe ?? "UJI",
    sumberNomor: overrides.sumberNomor ?? `UJI-${urutan}`,
    sumberPemicu: overrides.sumberPemicu ?? "UJI",
    akunId: data.id,
    akunNomor: data.nomor,
    akunNama: data.nama,
    akunPeran: data.peran,
    debit,
    kredit,
  };
}

test("buku besar: saldo akhir = saldo awal + debit - kredit", () => {
  const rows = [
    baris("kas", "50", "0", { tanggal: isoWaktuJakarta("2026-11-02T09:00:00") }),
    baris("kas", "0", "30", { tanggal: isoWaktuJakarta("2026-11-03T09:00:00") }),
  ];

  const laporan = hitungBukuBesar(rows, AKUN.kas, "10000");

  assert.equal(laporan.saldoAwalCents, "10000");
  assert.equal(laporan.totalDebitCents, "5000");
  assert.equal(laporan.totalKreditCents, "3000");
  assert.equal(laporan.saldoAkhirCents, "12000");
  assert.deepEqual(
    laporan.baris.map((item) => item.saldoCents),
    ["15000", "12000"],
  );
});

test("buku besar mengurutkan baris menurut tanggal lalu waktu dibuat", () => {
  const rows = [
    baris("kas", "0", "10", {
      tanggal: isoWaktuJakarta("2026-11-03T09:00:00"),
      dibuatPada: isoWaktuJakarta("2026-11-03T09:00:01"),
    }),
    baris("kas", "25", "0", {
      tanggal: isoWaktuJakarta("2026-11-02T09:00:00"),
      dibuatPada: isoWaktuJakarta("2026-11-02T09:00:00"),
    }),
  ];

  const laporan = hitungBukuBesar(rows, AKUN.kas, "0");

  assert.deepEqual(
    laporan.baris.map((item) => item.tanggal),
    [isoWaktuJakarta("2026-11-02T09:00:00"), isoWaktuJakarta("2026-11-03T09:00:00")],
  );
  assert.deepEqual(
    laporan.baris.map((item) => item.saldoCents),
    ["2500", "1500"],
  );
});

test("neraca saldo: saldo debit dan kredit per akun seimbang", () => {
  const rows = [
    baris("kas", "100", "0"),
    baris("piutang", "50", "0"),
    baris("utang", "0", "150"),
  ];

  const laporan = hitungNeracaSaldo(rows);

  assert.equal(laporan.totalDebitCents, "15000");
  assert.equal(laporan.totalKreditCents, "15000");
  assert.equal(laporan.selisihCents, "0");
  assert.equal(laporan.seimbang, true);
  assert.deepEqual(
    laporan.baris.map((item) => [item.nomor, item.debitCents, item.kreditCents]),
    [
      ["102", "10000", "0"],
      ["110", "5000", "0"],
      ["201", "0", "15000"],
    ],
  );
});

test("neraca saldo menampilkan selisih, bukan menyembunyikannya", () => {
  const laporan = hitungNeracaSaldo([baris("kas", "100", "0"), baris("utang", "0", "90")]);

  assert.equal(laporan.totalDebitCents, "10000");
  assert.equal(laporan.totalKreditCents, "9000");
  assert.equal(laporan.selisihCents, "1000");
  assert.equal(laporan.seimbang, false);
});

test("laba rugi hanya memuat peran pendapatan dan beban yang bersaldo", () => {
  const rows = [
    baris("penjualan", "100", "1000"),
    baris("hpp", "400", "0"),
    baris("gaji_admin", "200", "0"),
    baris("tkl", "50", "0"),
    baris("tkl", "100", "0"),
    baris("tkl", "0", "100"),
    baris("kas", "500", "0"),
    baris("laba_ditahan", "0", "500"),
    baris("ppn", "0", "25"),
  ];

  const laporan = hitungLabaRugi(rows);

  assert.deepEqual(
    laporan.pendapatan.map((item) => [item.peran, item.nilaiCents]),
    [["penjualan", "90000"]],
  );
  assert.deepEqual(
    laporan.beban.map((item) => [item.peran, item.nilaiCents]),
    [
      ["hpp", "40000"],
      ["tenaga_kerja_langsung", "5000"],
      ["beban_gaji_admin", "20000"],
    ],
  );
  assert.equal(laporan.totalPendapatanCents, "90000");
  assert.equal(laporan.totalBebanCents, "65000");
  assert.equal(laporan.labaBersihCents, "25000");
});

test("neraca: aktiva = kewajiban + ekuitas, laba tahun berjalan jadi baris ekuitas", () => {
  const kumulatif = [
    baris("kas", "500", "0"),
    baris("piutang", "300", "0"),
    baris("utang", "0", "200"),
    baris("laba_ditahan", "0", "100"),
    baris("penjualan", "0", "600"),
    baris("hpp", "100", "0"),
  ];
  const tahunBerjalan = [kumulatif[4], kumulatif[5]];

  const laporan = hitungNeraca(kumulatif, tahunBerjalan);

  assert.equal(laporan.totalAsetCents, "80000");
  assert.equal(laporan.totalKewajibanCents, "20000");
  assert.equal(laporan.labaTahunBerjalanCents, "50000");
  assert.equal(laporan.totalEkuitasCents, "60000");
  assert.equal(laporan.totalPasivaCents, "80000");
  assert.equal(laporan.selisihCents, "0");
  assert.equal(laporan.seimbang, true);
  assert.deepEqual(laporan.belumDiklasifikasi, []);
});

test("neraca menampilkan akun yang belum diklasifikasi agar selisih tidak tersembunyi", () => {
  const kumulatif = [
    baris("kas", "500", "0"),
    baris("piutang", "300", "0"),
    baris("utang", "0", "200"),
    baris("laba_ditahan", "0", "100"),
    baris("penjualan", "0", "600"),
    baris("hpp", "100", "0"),
    baris("kas", "50", "0"),
    baris("ppn", "0", "50"),
  ];
  const tahunBerjalan = [kumulatif[4], kumulatif[5]];

  const laporan = hitungNeraca(kumulatif, tahunBerjalan);

  assert.equal(laporan.totalAsetCents, "85000");
  assert.equal(laporan.selisihCents, "5000");
  assert.equal(laporan.seimbang, false);
  assert.deepEqual(
    laporan.belumDiklasifikasi.map((item) => [item.peran, item.nilaiCents]),
    [["ppn_keluaran", "-5000"]],
  );
});

test("jurnal pembalik menihilkan laba tahun berjalan", () => {
  const tahunBerjalan = [
    baris("penjualan", "0", "1000"),
    baris("penjualan", "1000", "0"),
  ];

  const laporan = hitungNeraca([], tahunBerjalan);

  assert.equal(laporan.labaTahunBerjalanCents, "0");
});

test("daftar jurnal menghitung jurnal unik dan total baris", () => {
  const rows = [
    baris("kas", "100", "0", {
      jurnalId: "jurnal-a",
      sumberNomor: "A-001",
      sumberTipe: "UJI",
    }),
    baris("penjualan", "0", "100", { jurnalId: "jurnal-a", sumberNomor: "A-001" }),
    baris("kas", "0", "40", {
      jurnalId: "jurnal-b",
      sumberNomor: "B-001",
      sumberTipe: "UJI",
    }),
    baris("piutang", "40", "0", { jurnalId: "jurnal-b", sumberNomor: "B-001" }),
  ];

  const laporan = susunDaftarJurnal(rows);

  assert.equal(laporan.jumlahJurnal, 2);
  assert.equal(laporan.baris.length, 4);
  assert.equal(laporan.totalDebitCents, "14000");
  assert.equal(laporan.totalKreditCents, "14000");
});

test("saldo neto menjumlahkan debit dikurangi kredit", () => {
  const rows = [baris("kas", "100", "0"), baris("kas", "0", "30")];

  assert.equal(saldoNetoCents(rows), "7000");
  assert.equal(saldoNetoCents([]), "0");
});

test("angka laporan identik untuk data yang sama", () => {
  const rows = [
    baris("penjualan", "0", "125"),
    baris("hpp", "25", "0"),
  ];

  assert.deepEqual(hitungLabaRugi(rows), hitungLabaRugi(rows));
  assert.deepEqual(hitungNeracaSaldo(rows), hitungNeracaSaldo(rows));
  assert.deepEqual(hitungBukuBesar(rows, AKUN.kas, "0"), hitungBukuBesar(rows, AKUN.kas, "0"));
});

test("total jurnal persediaan hanya menjumlah akun peran persediaan", () => {
  const rows = [
    baris("persediaan_bahan", "1500000.00", "0.00"),
    baris("kas", "2000000.00", "0.00"),
    baris("persediaan_bahan", "0.00", "3000000.00"),
  ];

  assert.equal(totalJurnalPersediaanCents(rows), "-150000000");
});

test("total jurnal persediaan nol saat tidak ada baris persediaan", () => {
  assert.equal(
    totalJurnalPersediaanCents([baris("kas", "10.00", "0.00")]),
    "0",
  );
  assert.equal(totalJurnalPersediaanCents([]), "0");
});

test("isPeranPersediaan mengenali tiga peran akun persediaan", () => {
  assert.equal(isPeranPersediaan("persediaan_bahan"), true);
  assert.equal(isPeranPersediaan("barang_dalam_proses"), true);
  assert.equal(isPeranPersediaan("persediaan_barang_jadi"), true);
  assert.equal(isPeranPersediaan("kas_bank"), false);
  assert.equal(isPeranPersediaan("hpp"), false);
});

test("uang menolak pecahan sen, kosong, negatif, dan presisi lebih", () => {
  assert.equal(isMoney(""), false);
  assert.equal(isMoney("0"), true);
  assert.equal(isMoney("0.00"), true);
  assert.equal(isMoney("1"), true);
  assert.equal(isMoney("1.00"), true);
  assert.equal(isMoney("0.50"), false);
  assert.equal(isMoney("0.01"), false);
  assert.equal(isMoney("-0.01"), false);
  assert.equal(isMoney("1.001"), false);
  assert.equal(moneyToCents("0"), BigInt(0));
  assert.equal(moneyToCents("1"), BigInt(100));
  assert.equal(moneyToCents("1.00"), BigInt(100));
  assert.throws(() => moneyToCents(""), /uang/i);
  assert.throws(() => moneyToCents("-0.01"), /uang/i);
  assert.throws(() => moneyToCents("0.50"), /bulat/i);
  assert.throws(() => moneyToCents("0.01"), /bulat/i);
  assert.throws(() => moneyToCents("1.001"), /uang/i);
});

test("pembulatan setengah rupiah ke atas di batas penyimpanan", () => {
  assert.equal(roundToWholeRupiah(BigInt(49)), BigInt(0));
  assert.equal(roundToWholeRupiah(BigInt(50)), BigInt(100));
  assert.equal(roundToWholeRupiah(BigInt(149)), BigInt(100));
  assert.equal(roundToWholeRupiah(BigInt(150)), BigInt(200));
  assert.equal(roundToWholeRupiah(BigInt(-50)), BigInt(-100));
});

test("saldo neto memakai konvensi debit dikurangi kredit", () => {
  assert.equal(saldoNetoCents([baris("kas", "1", "0")]), "100");
  assert.equal(saldoNetoCents([baris("kas", "0", "1")]), "-100");
  assert.throws(() => saldoNetoCents([baris("kas", "0.01", "0")]), /bulat/i);
});
