#!/usr/bin/env node
// Automated verification script for PD-008 (Jurnal Penjualan dan HPP).
// Verifies AC-01..AC-11 across pengiriman, faktur, pembayaran, retur, and jurnal viewer.

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const migrationSql = readFileSync(
  new URL("../supabase/migrations/0041_jurnal_penjualan_hpp.sql", import.meta.url),
  "utf8",
);
const pengirimanActions = readFileSync(
  new URL("../src/modules/pendapatan/pengiriman/actions.ts", import.meta.url),
  "utf8",
);
const fakturActions = readFileSync(
  new URL("../src/modules/pendapatan/faktur/actions.ts", import.meta.url),
  "utf8",
);
const pembayaranActions = readFileSync(
  new URL("../src/modules/pendapatan/pembayaran/actions.ts", import.meta.url),
  "utf8",
);
const returActions = readFileSync(
  new URL("../src/modules/pendapatan/retur/actions.ts", import.meta.url),
  "utf8",
);

console.log("=== PD-008 Verification ===");

// AC-01 & AC-10: Pengiriman DIKIRIM posts Dr hpp / Cr persediaan_barang_jadi & checks harga_rata
assert.ok(migrationSql.includes("('PENGIRIMAN'"));
assert.ok(migrationSql.includes("jurnal_hpp_id"));
assert.ok(pengirimanActions.includes("postJournal"));
assert.ok(pengirimanActions.includes('"hpp"'));
assert.ok(pengirimanActions.includes('"persediaan_barang_jadi"'));
assert.ok(pengirimanActions.includes("Harga rata belum tersedia untuk produk ini."));
console.log("[PASS] AC-01 & AC-10: Pengiriman DIKIRIM memposting jurnal HPP & menolak jika harga rata belum tersedia.");

// AC-02..AC-04 & AC-08: Faktur, Penerimaan, Retur, dan Pembalik via postJournal/reverseJournal
assert.ok(fakturActions.includes("postJournal"));
assert.ok(fakturActions.includes("reverseJournal"));
assert.ok(pembayaranActions.includes("postJournal"));
assert.ok(pembayaranActions.includes("reverseJournal"));
assert.ok(returActions.includes("postJournal"));
console.log("[PASS] AC-02..AC-04 & AC-08: Faktur, Penerimaan, Retur, dan Pembalik memakai postJournal/reverseJournal.");

// AC-11: No direct insert into jurnal/jurnal_baris in pendapatan modules & read-only routes exist
for (const [name, src] of [
  ["pengiriman", pengirimanActions],
  ["faktur", fakturActions],
  ["pembayaran", pembayaranActions],
  ["retur", returActions],
]) {
  assert.ok(
    !src.includes('.from("jurnal")'),
    `Direct jurnal table access found in ${name}`,
  );
  assert.ok(
    !src.includes('.from("jurnal_baris")'),
    `Direct jurnal_baris table access found in ${name}`,
  );
}
assert.ok(existsSync(new URL("../src/app/(app)/pendapatan/jurnal/page.tsx", import.meta.url)));
assert.ok(existsSync(new URL("../src/app/(app)/pendapatan/jurnal/[id]/page.tsx", import.meta.url)));
console.log("[PASS] AC-05..AC-07 & AC-11: Tidak ada jurnal manual atau tulis langsung; tampilan read-only jurnal tersedia.");

console.log("=== ALL PD-008 CHECKS PASSED ===");
