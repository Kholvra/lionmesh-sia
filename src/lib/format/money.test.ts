import assert from "node:assert/strict";
import test from "node:test";

import { formatRupiah } from "./money.ts";

test("rupiah dari sen memakai pemisah ribuan Indonesia", () => {
  assert.equal(formatRupiah("0"), "Rp 0,00");
  assert.equal(formatRupiah("150000"), "Rp 1.500,00");
  assert.equal(formatRupiah(BigInt("1234567800")), "Rp 12.345.678,00");
});

test("rupiah negatif menaruh tanda sebelum mata uang", () => {
  assert.equal(formatRupiah("-2500"), "-Rp 25,00");
});

test("rupiah besar tidak kehilangan presisi", () => {
  assert.equal(
    formatRupiah("900719925474099300"),
    "Rp 9.007.199.254.740.993,00",
  );
});

test("rupiah menolak sen pecahan dan nilai kosong", () => {
  for (const nilai of ["1500.5", "1500.567", "", "150050"]) {
    assert.throws(() => formatRupiah(nilai));
  }
});

test("tampilan rupiah selalu memakai ,00", () => {
  assert.equal(formatRupiah("15000000"), "Rp 150.000,00");
  assert.equal(formatRupiah("-15000000"), "-Rp 150.000,00");
  assert.throws(() => formatRupiah("150050"), /bulat/i);
  assert.throws(() => formatRupiah("-150050"), /bulat/i);
});
