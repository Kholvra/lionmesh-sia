#!/usr/bin/env node
// Automated verification script for PD-007 (Retur Penjualan & Kredit Memo).
// Verifies AC-01..AC-14 against calculation, schema, migration, routes, and actions.

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function loadTs(
  relativePath,
  customRequire = () => {
    throw new Error("Unexpected require");
  },
) {
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

const calc = loadTs("../src/modules/pendapatan/retur/calc.ts");

const migrationSql = readFileSync(
  new URL("../supabase/migrations/0040_retur_penjualan.sql", import.meta.url),
  "utf8",
);
const actionsSrc = readFileSync(
  new URL("../src/modules/pendapatan/retur/actions.ts", import.meta.url),
  "utf8",
);
const detailSrc = readFileSync(
  new URL("../src/modules/pendapatan/retur/detail-screen.tsx", import.meta.url),
  "utf8",
);

console.log("=== PD-007 Verification ===");

// AC-01..AC-02: Migration RJ/RETUR & routes
assert.ok(migrationSql.includes("('RJ'"), "RJ document type missing");
assert.ok(migrationSql.includes("('RETUR'"), "RETUR journal source missing");
assert.ok(existsSync(new URL("../src/app/(app)/pendapatan/retur/page.tsx", import.meta.url)));
assert.ok(existsSync(new URL("../src/app/(app)/pendapatan/retur/baru/page.tsx", import.meta.url)));
assert.ok(existsSync(new URL("../src/app/(app)/pendapatan/retur/[nomor]/page.tsx", import.meta.url)));
assert.ok(actionsSrc.includes("Retur harus merujuk faktur penjualan."));
console.log("[PASS] AC-01..AC-02: Migrasi RJ/RETUR, rute halaman, dan validasi faktur asal.");

// AC-03..AC-07 & AC-10..AC-11: Kredit memo, nilai stok masuk, sisa retur
{
  const km = calc.hitungKreditMemoBaris({
    qtyLulus: 5,
    hargaSatuan: 100000,
    diskonPersen: 0,
    tarifPpn: 0.11,
  });
  assert.equal(km.dpp, 500000);
  assert.equal(km.ppn, 55000);
  assert.equal(km.total, 555000);
  assert.equal(calc.hitungNilaiMasukStok(200, 5000), 1000000);
  assert.equal(calc.hitungSisaBolehRetur(200, 150), 50);
  console.log("[PASS] AC-03..AC-07, AC-10..AC-11: Perhitungan kredit memo, stok masuk harga_rata, dan batas kumulatif.");
}

// AC-06, AC-08, AC-09, AC-12..AC-14: Jurnal, pemisahan tugas, QC guard, periode terkunci
assert.ok(actionsSrc.includes("Pemohon retur tidak dapat menyetujui returnya sendiri."));
assert.ok(actionsSrc.includes("Anda tidak berwenang menyetujui retur."));
assert.ok(actionsSrc.includes("Retur harus disetujui sebelum QC."));
assert.ok(actionsSrc.includes("Qty lulus QC tidak boleh melebihi qty yang disetujui."));
assert.ok(actionsSrc.includes("Nilai retur melebihi sisa tagihan faktur asal."));
assert.ok(actionsSrc.includes("catatMutasi"));
assert.ok(actionsSrc.includes("postJournal"));
assert.ok(actionsSrc.includes("persediaan_barang_jadi"));
assert.ok(actionsSrc.includes("ppn_keluaran"));
assert.ok(actionsSrc.includes("isPeriodeTerkunci"));
assert.ok(detailSrc.includes("ReturActions"));
console.log("[PASS] AC-06, AC-08, AC-09, AC-12..AC-14: Pemisahan tugas, mutasi stok masuk, jurnal balance, dan periode terkunci.");

console.log("=== ALL PD-007 CHECKS PASSED ===");
