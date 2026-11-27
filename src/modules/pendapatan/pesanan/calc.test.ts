import assert from "node:assert/strict";
import test from "node:test";

import {
  cekMelewatiBatasKredit,
  hitungBarisPesanan,
  hitungTotalPesanan,
} from "./calc.ts";

test("hitungBarisPesanan menghitung diskon, DPP, PPN, dan total dengan T=0.11 (AC-03)", () => {
  const res = hitungBarisPesanan(10, 100000, 10, 0.11);
  assert.equal(res.nilaiKotor, 1000000);
  assert.equal(res.diskonNilai, 100000);
  assert.equal(res.dpp, 900000);
  assert.equal(res.ppn, 99000);
  assert.equal(res.total, 999000);
});

test("hitungTotalPesanan menjumlahkan banyak baris dengan akurat", () => {
  const res = hitungTotalPesanan(
    [
      { qty: 10, hargaSatuan: 100000, diskonPersen: 10 },
      { qty: 5, hargaSatuan: 200000, diskonPersen: 0 },
    ],
    0.11,
  );
  assert.equal(res.nilaiKotor, 2000000);
  assert.equal(res.diskonTotal, 100000);
  assert.equal(res.dpp, 1900000);
  assert.equal(res.ppn, 209000);
  assert.equal(res.total, 2109000);
});

test("cekMelewatiBatasKredit menahan pesanan saat exposure > batas atau batas = 0 (AC-13, AC-14)", () => {
  // Batas 50jt, piutang + pesanan terbuka 45jt, pesanan baru 10jt -> 55jt > 50jt -> tahan
  assert.equal(cekMelewatiBatasKredit(45000000, 10000000, 50000000), true);

  // Batas 50jt, piutang + pesanan terbuka 45jt, pesanan baru 5jt -> 50jt == 50jt -> lolos
  assert.equal(cekMelewatiBatasKredit(45000000, 5000000, 50000000), false);

  // Batas 0 (tunai), pesanan total > 0 -> tahan
  assert.equal(cekMelewatiBatasKredit(0, 100000, 0), true);
  assert.equal(cekMelewatiBatasKredit(0, 0, 0), false);
});
