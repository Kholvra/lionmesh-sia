import assert from "node:assert/strict";
import test from "node:test";

import { rupiahKeCents } from "./format.ts";

test("nominal desimal dikonversi ke sen tanpa kehilangan digit", () => {
  assert.equal(rupiahKeCents("9007199254740993"), BigInt("900719925474099300"));
  assert.equal(rupiahKeCents("0"), BigInt(0));
  assert.equal(rupiahKeCents("1500"), BigInt(150000));
  assert.equal(rupiahKeCents("1500.5"), BigInt(150050));
  assert.equal(rupiahKeCents("0.5"), BigInt(50));
});

test("nominal dengan presisi lebih dari dua desimal ditolak", () => {
  assert.throws(() => rupiahKeCents("1500.567"));
  assert.throws(() => rupiahKeCents(""));
});
