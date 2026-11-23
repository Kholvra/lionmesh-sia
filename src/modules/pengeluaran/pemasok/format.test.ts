import assert from "node:assert/strict";
import test from "node:test";

import { formatRupiah } from "./format.ts";

test("rupiah tampil apa adanya untuk angka besar", () => {
  assert.equal(formatRupiah("9007199254740993"), "Rp 9.007.199.254.740.993,00");
});

test("rupiah dengan koma desimal dan nol", () => {
  assert.equal(formatRupiah("0"), "Rp 0,00");
  assert.equal(formatRupiah("1500"), "Rp 1.500,00");
  assert.equal(formatRupiah("0.5"), "Rp 0,50");
});
