import assert from "node:assert/strict";
import test from "node:test";

import { formatDesimal, formatRupiah } from "./number.ts";

test("formatDesimal membuang nol di belakang koma", () => {
  assert.equal(formatDesimal("1.500000", 6), "1,5");
  assert.equal(formatDesimal("12", 2), "12");
  assert.equal(formatDesimal("0.750000", 6), "0,75");
});

test("formatDesimal memakai pemisah ribuan Indonesia", () => {
  assert.equal(formatDesimal("16250.750000", 6), "16.250,75");
});

test("formatRupiah tidak kehilangan presisi pada nilai besar", () => {
  assert.equal(formatRupiah("9007199254740993"), "Rp 9.007.199.254.740.993");
  assert.equal(formatRupiah("0"), "Rp 0");
});
