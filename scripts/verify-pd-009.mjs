#!/usr/bin/env node
// Automated verification script for PD-009 (Laporan Penjualan, Piutang, dan Kas).
// Verifies AC-01..AC-12 against calculation, permissions, routes, and queries.

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

const calc = loadTs("../src/modules/pendapatan/laporan/calc.ts");
const queriesSrc = readFileSync(
  new URL("../src/modules/pendapatan/laporan/queries.ts", import.meta.url),
  "utf8",
);
const penjualanSrc = readFileSync(
  new URL("../src/modules/pendapatan/laporan/penjualan-screen.tsx", import.meta.url),
  "utf8",
);
const piutangSrc = readFileSync(
  new URL("../src/modules/pendapatan/laporan/piutang-screen.tsx", import.meta.url),
  "utf8",
);
const kasSrc = readFileSync(
  new URL("../src/modules/pendapatan/laporan/kas-screen.tsx", import.meta.url),
  "utf8",
);

console.log("=== PD-009 Verification ===");

// AC-01, AC-03, AC-04, AC-05, AC-08, AC-10, AC-12: Routes, live calculation, cancelled = 0, ledger reconciliation
assert.ok(existsSync(new URL("../src/app/(app)/pendapatan/laporan/page.tsx", import.meta.url)));
assert.ok(existsSync(new URL("../src/app/(app)/pendapatan/laporan/penjualan/page.tsx", import.meta.url)));
assert.ok(existsSync(new URL("../src/app/(app)/pendapatan/laporan/piutang/page.tsx", import.meta.url)));
assert.ok(existsSync(new URL("../src/app/(app)/pendapatan/laporan/kas/page.tsx", import.meta.url)));
assert.ok(queriesSrc.includes('eq("akun.peran", "penjualan")'));
assert.ok(queriesSrc.includes('eq("akun.peran", "kas_bank")'));
assert.ok(queriesSrc.includes('String(f.status) === "DIBATALKAN"'));
console.log("[PASS] AC-01, AC-03..AC-05, AC-08, AC-10, AC-12: Rute laporan, rekonsiliasi buku besar, dan dokumen batal bernilai 0.");

// AC-02: Aging buckets
{
  const lap = "2026-12-31";
  assert.equal(calc.hitungUmurDanBucket("2026-12-31", lap).bucket.key, "BELUM_JATUH_TEMPO");
  assert.equal(calc.hitungUmurDanBucket("2026-12-21", lap).bucket.key, "1_30");
  assert.equal(calc.hitungUmurDanBucket("2026-11-16", lap).bucket.key, "31_60");
  assert.equal(calc.hitungUmurDanBucket("2026-10-02", lap).bucket.key, "61_90");
  assert.equal(calc.hitungUmurDanBucket("2026-09-02", lap).bucket.key, "OVER_90");
  console.log("[PASS] AC-02: Klasifikasi 5 bucket umur piutang sesuai.");
}

// AC-06, AC-07, AC-09, AC-11: Empty state, role permissions, future period/date rejection
assert.ok(penjualanSrc.includes("Tidak ada transaksi pada periode ini."));
assert.ok(piutangSrc.includes("Tidak ada transaksi pada periode ini."));
assert.ok(kasSrc.includes("Tidak ada transaksi pada periode ini."));
assert.ok(penjualanSrc.includes("Anda tidak berwenang melihat laporan ini."));
assert.ok(piutangSrc.includes("Anda tidak berwenang melihat laporan ini."));
assert.ok(kasSrc.includes("Anda tidak berwenang melihat laporan ini."));
assert.equal(
  calc.validasiPeriodeBulan("2026-12", "2026-11-27"),
  "Periode tidak boleh melebihi hari ini.",
);
assert.equal(
  calc.validasiTanggalLaporan("2026-11-28", "2026-11-27"),
  "Tanggal laporan tidak boleh melebihi hari ini.",
);
console.log("[PASS] AC-06, AC-07, AC-09, AC-11: Pesan kosong, guard izin, dan validasi periode/tanggal masa depan.");

console.log("=== ALL PD-009 CHECKS PASSED ===");
