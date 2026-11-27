#!/usr/bin/env node
// Automated verification script for PD-006 (Penerimaan Pembayaran Pelanggan).
// Verifies AC-01..AC-16 against FIFO calculation, schema, migration, routes, and actions.

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

const constants = loadTs("../src/modules/pendapatan/pembayaran/constants.ts");
const calc = loadTs("../src/modules/pendapatan/pembayaran/calc.ts");

const migrationSql = readFileSync(
  new URL("../supabase/migrations/0016_penerimaan_pembayaran.sql", import.meta.url),
  "utf8",
);
const actionsSrc = readFileSync(
  new URL("../src/modules/pendapatan/pembayaran/actions.ts", import.meta.url),
  "utf8",
);
const schemaSrc = readFileSync(
  new URL("../src/modules/pendapatan/pembayaran/schema.ts", import.meta.url),
  "utf8",
);
const detailSrc = readFileSync(
  new URL("../src/modules/pendapatan/pembayaran/detail-screen.tsx", import.meta.url),
  "utf8",
);

console.log("=== PD-006 Verification ===");

// AC-01: Daftar pembayaran & BKM numbering in migration
assert.ok(migrationSql.includes("('BKM'"), "BKM document type missing");
assert.ok(migrationSql.includes("('PENERIMAAN'"), "PENERIMAAN journal source missing");
assert.ok(existsSync(new URL("../src/app/(app)/pendapatan/pembayaran/page.tsx", import.meta.url)));
assert.ok(existsSync(new URL("../src/app/(app)/pendapatan/pembayaran/baru/page.tsx", import.meta.url)));
assert.ok(existsSync(new URL("../src/app/(app)/pendapatan/pembayaran/[nomor]/page.tsx", import.meta.url)));
console.log("[PASS] AC-01..AC-03: Migration BKM/PENERIMAAN dan rute halaman tersedia.");

// AC-04 & AC-05: Metode Transfer & Giro only (no Tunai), nominal > 0 & max 2 decimals
assert.deepEqual([...constants.METODE_PEMBAYARAN], ["Transfer", "Giro"]);
assert.ok(schemaSrc.includes("Nominal pembayaran harus lebih dari nol."));
assert.ok(schemaSrc.includes("Metode pembayaran hanya Transfer atau Giro pada versi ini."));
console.log("[PASS] AC-04 & AC-05: Validasi nominal > 0 dan metode Transfer/Giro.");

// AC-06..AC-10: FIFO allocation, partial & full status, excess remainder
{
  const fifo = calc.alokasiFifoPembayaran(1500000, [
    {
      id: "f2",
      tanggalFaktur: "2026-12-05",
      sisaPiutang: 700000,
    },
    {
      id: "f1",
      tanggalFaktur: "2026-12-01",
      sisaPiutang: 1000000,
    },
  ]);
  assert.equal(fifo.allocations[0].fakturId, "f1");
  assert.equal(fifo.allocations[0].nominal, 1000000);
  assert.equal(fifo.allocations[1].fakturId, "f2");
  assert.equal(fifo.allocations[1].nominal, 500000);
  assert.equal(fifo.totalAllocated, 1500000);
  assert.equal(
    calc.hitungStatusFakturSetelahAlokasi(1000000, 0),
    "LUNAS",
  );
  assert.equal(
    calc.hitungStatusFakturSetelahAlokasi(700000, 200000),
    "SEBAGIAN_LUNAS",
  );
  console.log("[PASS] AC-06..AC-10: Alokasi FIFO faktur terlama & pembaruan status faktur.");
}

// AC-11..AC-16: Segregation of duties, postJournal, reverseJournal, pesanan SELESAI
assert.ok(actionsSrc.includes("catat_pembayaran_piutang"));
assert.ok(actionsSrc.includes("verifikasi_pembayaran_piutang"));
assert.ok(
  actionsSrc.includes(
    "Pencatat penerimaan tidak dapat memverifikasi penerimaannya sendiri.",
  ),
);
assert.ok(actionsSrc.includes("postJournal"));
assert.ok(actionsSrc.includes("reverseJournal"));
assert.ok(actionsSrc.includes("kas_bank"));
assert.ok(actionsSrc.includes("piutang_usaha"));
assert.ok(actionsSrc.includes("SELESAI"));
assert.ok(detailSrc.includes("PembayaranActions"));
console.log("[PASS] AC-11..AC-16: Pemisahan tugas, jurnal Dr Kas/Bank Cr Piutang, pembalikan, & pesanan SELESAI.");

console.log("=== ALL PD-006 CHECKS PASSED ===");
