import assert from "node:assert/strict";
import test from "node:test";

import { rupiahKeCents } from "./format.ts";

test("nominal bulat dikonversi ke sen tanpa kehilangan digit", () => {
  assert.equal(rupiahKeCents("9007199254740993"), BigInt("900719925474099300"));
  assert.equal(rupiahKeCents("0"), BigInt(0));
  assert.equal(rupiahKeCents("1500"), BigInt(150000));
  assert.equal(rupiahKeCents("1500.00"), BigInt(150000));
});

test("pecahan sen ditolak, bukan dibulatkan", () => {
  for (const nilai of ["1500.5", "0.5", "1500.567"]) {
    assert.throws(() => rupiahKeCents(nilai), /bulat/i);
  }
  assert.throws(() => rupiahKeCents(""), /rupiah/i);
});
