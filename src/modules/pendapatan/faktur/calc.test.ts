import assert from "node:assert/strict";
import test from "node:test";

import {
  hitungBarisFaktur,
  hitungJatuhTempo,
  hitungTotalFaktur,
  hitungUmurDanBucket,
} from "./calc.ts";

test("hitungBarisFaktur & hitungTotalFaktur menghitung DPP, PPN (T=0.11), dan total (AC-03)", () => {
  const row = hitungBarisFaktur(10, 100000, 0, 0.11);
  assert.equal(row.dpp, 1000000);
  assert.equal(row.ppn, 110000);
  assert.equal(row.total, 1110000);

  const tot = hitungTotalFaktur(
    [{ qty: 10, hargaSatuan: 100000, diskonPersen: 0 }],
    0.11,
  );
  assert.equal(tot.dpp, 1000000);
  assert.equal(tot.ppn, 110000);
  assert.equal(tot.total, 1110000);
});

test("hitungJatuhTempo menambahkan termin hari ke tanggal faktur (AC-04)", () => {
  assert.equal(hitungJatuhTempo("2026-12-01", 30), "2026-12-31");
  assert.equal(hitungJatuhTempo("2026-01-31", 30), "2026-03-02");
});

test("hitungUmurDanBucket menempatkan faktur ke 5 bucket umur sesuai parameter (AC-08)", () => {
  const jt = "2026-10-01";
  assert.equal(hitungUmurDanBucket(jt, "2026-10-01").bucket.key, "belum_jatuh_tempo");
  assert.equal(hitungUmurDanBucket(jt, "2026-10-11").bucket.key, "1_30");
  assert.equal(hitungUmurDanBucket(jt, "2026-11-15").bucket.key, "31_60");
  assert.equal(hitungUmurDanBucket(jt, "2026-12-30").bucket.key, "61_90");
  assert.equal(hitungUmurDanBucket(jt, "2027-01-29").bucket.key, "lebih_90");
});
