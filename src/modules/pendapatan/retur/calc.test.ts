import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  hitungKreditMemoBaris,
  hitungNilaiMasukStok,
  hitungSisaBolehRetur,
  round2,
} from "./calc.ts";

describe("PD-007 calc — Kredit Memo, Nilai Stok Masuk & Sisa Retur", () => {
  it("rounds monetary values to 2 decimals", () => {
    assert.equal(round2(1234.565), 1234.57);
    assert.equal(round2(1234.564), 1234.56);
  });

  it("computes credit memo DPP, PPN (T=0.11), and total with line discount (AC-05)", () => {
    const res = hitungKreditMemoBaris({
      qtyLulus: 5,
      hargaSatuan: 100000,
      diskonPersen: 10,
      tarifPpn: 0.11,
    });
    assert.equal(res.dpp, 450000);
    assert.equal(res.ppn, 49500);
    assert.equal(res.total, 499500);
  });

  it("computes stock-in valuation at current harga_rata (AC-10)", () => {
    assert.equal(hitungNilaiMasukStok(200, 5000), 1000000);
    assert.equal(hitungNilaiMasukStok(0, 5000), 0);
  });

  it("computes remaining returnable qty per invoice line (AC-11)", () => {
    assert.equal(hitungSisaBolehRetur(200, 150), 50);
    assert.equal(hitungSisaBolehRetur(200, 220), 0);
  });
});
