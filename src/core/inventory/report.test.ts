import assert from "node:assert/strict";
import test from "node:test";

import {
  hitungKartuPersediaan,
  hitungSaldoKartu,
  uangMentahKeCents,
  type MutasiKartu,
} from "./report.ts";

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
    tanggal: overrides.tanggal ?? "2026-11-02T09:00:00+07:00",
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
    mutasi("MASUK", "5", "60", { tanggal: "2026-11-02T09:00:00+07:00" }),
    mutasi("KELUAR", "-3", "30", { tanggal: "2026-11-03T09:00:00+07:00" }),
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
    mutasi("KELUAR", "-1", "5", { tanggal: "2026-11-05T09:00:00+07:00" }),
    mutasi("MASUK", "2", "10", { tanggal: "2026-11-01T09:00:00+07:00" }),
  ];

  const laporan = hitungKartuPersediaan(rows, { qty: "0", nilai: "0" });

  assert.deepEqual(
    laporan.baris.map((item) => item.tanggal),
    ["2026-11-01T09:00:00+07:00", "2026-11-05T09:00:00+07:00"],
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
  assert.equal(uangMentahKeCents("1083333.33"), "108333333");
});

test("kartu persediaan tanpa mutasi menampilkan saldo awal", () => {
  const laporan = hitungKartuPersediaan([], { qty: "7.5", nilai: "90" });

  assert.equal(laporan.baris.length, 0);
  assert.equal(laporan.saldoAkhirQty, "7,5");
  assert.equal(laporan.saldoAkhirNilaiCents, "9000");
});
