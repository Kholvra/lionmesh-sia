import assert from "node:assert/strict";
import test from "node:test";
import { isoWaktuJakarta } from "../../lib/format/date.ts";

import {
  hitungKartuPersediaan,
  hitungSaldoKartu,
  hitungTotalNilaiMutasiCents,
  rekonsiliasiPersediaan,
  uangMentahKeCents,
  type MutasiKartu,
} from "./report.ts";
import { isDecimal } from "./decimal.ts";
import { defaultValuationStrategy } from "./valuation.ts";

let urutan = 0;

function mutasi(
  tipe: MutasiKartu["tipe"],
  qty: string,
  nilai: string,
  overrides: Partial<MutasiKartu> = {},
): MutasiKartu {
  urutan += 1;
  return {
    id: overrides.id ?? `mutasi-${urutan}`,
    tanggal: overrides.tanggal ?? isoWaktuJakarta("2026-11-02T09:00:00"),
    tipe,
    qty,
    nilai,
    hargaSatuan: overrides.hargaSatuan ?? "10",
    sumberTipe: overrides.sumberTipe ?? "UJI",
    sumberId: overrides.sumberId ?? `sumber-${urutan}`,
    alasan: overrides.alasan ?? null,
  };
}

test("kartu persediaan: saldo berjalan qty dan nilai mengikuti mutasi", () => {
  const rows = [
    mutasi("MASUK", "5", "60", { tanggal: isoWaktuJakarta("2026-11-02T09:00:00") }),
    mutasi("KELUAR", "-3", "30", { tanggal: isoWaktuJakarta("2026-11-03T09:00:00") }),
  ];

  const laporan = hitungKartuPersediaan(rows, { qty: "10", nilai: "100" });

  assert.equal(laporan.baris[0].saldoQty, "15");
  assert.equal(laporan.baris[0].saldoNilaiCents, "16000");
  assert.equal(laporan.baris[1].saldoQty, "12");
  assert.equal(laporan.baris[1].saldoNilaiCents, "13000");
  assert.equal(laporan.totalMasukQty, "5");
  assert.equal(laporan.totalKeluarQty, "3");
  assert.equal(laporan.saldoAkhirQty, "12");
  assert.equal(laporan.saldoAkhirNilaiCents, "13000");
});

test("penyesuaian negatif mengurangi qty dan nilai", () => {
  const rows = [mutasi("PENYESUAIAN", "-2", "20", { alasan: "Opname" })];

  const laporan = hitungKartuPersediaan(rows, { qty: "12", nilai: "130" });

  assert.equal(laporan.saldoAkhirQty, "10");
  assert.equal(laporan.saldoAkhirNilaiCents, "11000");
  assert.equal(laporan.baris[0].qtyKeluar, "2");
});

test("kartu persediaan mengurutkan mutasi menurut tanggal", () => {
  const rows = [
    mutasi("KELUAR", "-1", "5", { tanggal: isoWaktuJakarta("2026-11-05T09:00:00") }),
    mutasi("MASUK", "2", "10", { tanggal: isoWaktuJakarta("2026-11-01T09:00:00") }),
  ];

  const laporan = hitungKartuPersediaan(rows, { qty: "0", nilai: "0" });

  assert.deepEqual(
    laporan.baris.map((item) => item.tanggal),
    [isoWaktuJakarta("2026-11-01T09:00:00"), isoWaktuJakarta("2026-11-05T09:00:00")],
  );
  assert.deepEqual(
    laporan.baris.map((item) => item.saldoQty),
    ["2", "1"],
  );
});

test("saldo kartu menjumlahkan mutasi menjadi nilai mentah", () => {
  const rows = [
    mutasi("MASUK", "5", "60"),
    mutasi("KELUAR", "-3", "30"),
  ];

  assert.deepEqual(hitungSaldoKartu(rows), { qty: "2", nilai: "30" });
});

test("nilai rupiah mentah dikonversi ke sen untuk tampilan", () => {
  assert.equal(uangMentahKeCents("1000000"), "100000000");
  assert.equal(uangMentahKeCents("1083333.00"), "108333300");
  assert.throws(() => uangMentahKeCents("1083333.33"), /bulat/i);
});

test("kartu persediaan tanpa mutasi menampilkan saldo awal", () => {
  const laporan = hitungKartuPersediaan([], { qty: "7.5", nilai: "90" });

  assert.equal(laporan.baris.length, 0);
  assert.equal(laporan.saldoAkhirQty, "7,5");
  assert.equal(laporan.saldoAkhirNilaiCents, "9000");
});

test("total nilai mutasi memakai tanda qty, bukan label tipe", () => {
  const rows = [
    mutasi("MASUK", "50.0000", "600000"),
    mutasi("KELUAR", "-30.0000", "300000"),
  ];

  assert.equal(hitungTotalNilaiMutasiCents(rows), "30000000");
  assert.equal(hitungTotalNilaiMutasiCents([]), "0");
});

test("rekonsiliasi cocok saat selisih nol dan menandai selisih", () => {
  const cocok = rekonsiliasiPersediaan("8333333", "8333333");

  assert.equal(cocok.cocok, true);
  assert.equal(cocok.selisihCents, "0");

  const selisih = rekonsiliasiPersediaan("8333333", "-150000000");

  assert.equal(selisih.cocok, false);
  assert.equal(selisih.nilaiMutasiCents, "8333333");
  assert.equal(selisih.nilaiJurnalCents, "-150000000");
  assert.equal(selisih.selisihCents, "158333333");
});

test("desimal inventory menolak kosong, negatif saat dilarang, dan presisi lebih", () => {
  assert.equal(isDecimal("", true), false);
  assert.equal(isDecimal("0", false), false);
  assert.equal(isDecimal("-0.01", true), true);
  assert.equal(isDecimal("-0.01", true, false), false);
  assert.equal(isDecimal("1.00001", true), false);
  assert.equal(isDecimal("0.0000", true), true);
});

test("uang mentah menolak pecahan sen, kosong, dan presisi lebih", () => {
  assert.equal(uangMentahKeCents("0"), "0");
  assert.throws(() => uangMentahKeCents(""), /uang/i);
  assert.throws(() => uangMentahKeCents("0.50"), /bulat/i);
  assert.throws(() => uangMentahKeCents("1.001"), /uang/i);
});

test("qty nol tetap memakai tanda nilai negatif", () => {
  const baris = mutasi("PENYESUAIAN", "0", "5");
  const laporan = hitungKartuPersediaan([baris], { qty: "2", nilai: "200" });

  assert.equal(laporan.baris[0].qtyMasuk, "0");
  assert.equal(laporan.baris[0].qtyKeluar, "0");
  assert.equal(laporan.baris[0].nilaiKeluarCents, "500");
  assert.equal(laporan.saldoAkhirNilaiCents, "19500");
  assert.equal(hitungTotalNilaiMutasiCents([baris]), "-500");
});

test("valuasi membulatkan nilai ke rupiah penuh, bukan ke sen", () => {
  const masuk = defaultValuationStrategy.calculateIncoming(
    "0", "0", "0", "0.0001", "5000",
  );

  assert.equal(masuk.nilaiMasuk, "1.00");
  assert.equal(masuk.nilaiBaru, "1.00");
  assert.equal(masuk.hargaRataBaru, "10000.0000");

  const keluar = defaultValuationStrategy.calculateOutgoing(
    "1", "5000", "5000", "0.0001",
  );

  assert.equal(keluar.nilaiKeluar, "1.00");
  assert.equal(keluar.nilaiBaru, "4999.00");
  assert.equal(keluar.hargaRataBaru, "5000.0000");

  assert.throws(
    () => defaultValuationStrategy.calculateIncoming("0", "0", "0", "0.00001", "1"),
    /desimal/i,
  );
  assert.throws(
    () => defaultValuationStrategy.calculateIncoming("0", "0.50", "0", "1", "10"),
    /bulat/i,
  );
});
