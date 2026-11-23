import assert from "node:assert/strict";
import test from "node:test";

import { formatRupiah } from "./money.ts";

test("rupiah dari sen memakai pemisah ribuan Indonesia", () => {
  assert.equal(formatRupiah("0"), "Rp 0,00");
  assert.equal(formatRupiah("150000"), "Rp 1.500,00");
  assert.equal(formatRupiah(BigInt("1234567890")), "Rp 12.345.678,90");
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
