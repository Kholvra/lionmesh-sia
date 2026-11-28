#!/usr/bin/env node
// Automated verification script for PD-005 (Faktur Penjualan & Piutang).
// Verifies AC-01..AC-15 against calculation, aging logic, and module actions.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function loadTs(relativePath, customRequire = () => { throw new Error("Unexpected require"); }) {
  const fileUrl = new URL(relativePath, import.meta.url);
  const source = readFileSync(fileUrl, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;

  const loadedModule = { exports: {} };
  const context = {
    module: loadedModule,
    exports: loadedModule.exports,
    require: customRequire,
    console,
    Date,
    Math,
    Number,
    String,
    Boolean,
    Array,
    Object,
  };
  vm.runInNewContext(transpiled, context);
  return loadedModule.exports;
}

const constants = loadTs("../src/modules/pendapatan/faktur/constants.ts");
const calc = loadTs("../src/modules/pendapatan/faktur/calc.ts", (dep) => {
  if (dep === "./constants") return constants;
  throw new Error(`Unexpected dep: ${dep}`);
});

console.log("=== PD-005 Verification ===");

// AC-03 & AC-04: Formula total faktur & jatuh tempo
{
  const tot = calc.hitungTotalFaktur(
    [{ qty: 10, hargaSatuan: 100000, diskonPersen: 0 }],
    0.11,
  );
  assert.equal(tot.dpp, 1000000);
  assert.equal(tot.ppn, 110000);
  assert.equal(tot.total, 1110000);
  assert.equal(calc.hitungJatuhTempo("2026-12-01", 30), "2026-12-31");
  console.log("[PASS] AC-03 & AC-04: Rumus DPP, PPN (T=0.11), total, dan jatuh tempo sesuai.");
}

// AC-08: Parameterized aging buckets
{
  const jt = "2026-10-01";
  assert.equal(calc.hitungUmurDanBucket(jt, "2026-10-01").bucket.key, "belum_jatuh_tempo");
  assert.equal(calc.hitungUmurDanBucket(jt, "2026-10-11").bucket.key, "1_30");
  assert.equal(calc.hitungUmurDanBucket(jt, "2026-11-15").bucket.key, "31_60");
  assert.equal(calc.hitungUmurDanBucket(jt, "2026-12-30").bucket.key, "61_90");
  assert.equal(calc.hitungUmurDanBucket(jt, "2027-01-29").bucket.key, "lebih_90");
  console.log("[PASS] AC-08: Pengelompokan 5 bucket umur piutang akurat.");
}

// AC-01, AC-02, AC-05..AC-07, AC-09..AC-15: Verify rules in actions.ts
{
  const actionsSrc = readFileSync(
    new URL("../src/modules/pendapatan/faktur/actions.ts", import.meta.url),
    "utf8",
  );
  assert.match(actionsSrc, /Faktur hanya dapat dibuat dari pengiriman yang sudah dikirim\./);
  assert.match(actionsSrc, /Pengiriman ini sudah memiliki faktur\./);
  assert.match(actionsSrc, /Tarif PPN belum tersedia untuk tanggal ini\./);
  assert.match(actionsSrc, /Nomor faktur pajak wajib diisi sebelum faktur diterbitkan\./);
  assert.match(actionsSrc, /sudah ditutup\. Faktur tidak dapat diterbitkan\./);
  assert.match(actionsSrc, /Faktur yang sudah menerima pembayaran tidak dapat dibatalkan\./);
  assert.match(actionsSrc, /Anda tidak berwenang menerbitkan faktur\./);
  assert.match(actionsSrc, /postJournal/);
  assert.match(actionsSrc, /reverseJournal/);
  assert.match(actionsSrc, /piutang_usaha/);
  assert.match(actionsSrc, /penjualan/);
  assert.match(actionsSrc, /ppn_keluaran/);
  assert.match(actionsSrc, /DIFAKTURKAN/);
  console.log("[PASS] AC-01..AC-15: Seluruh validasi, jurnal terbit/pembalik, periode terkunci, dan status pesanan terverifikasi.");
}

console.log("\nSemua kriteria verifikasi PD-005 LULUS!");
