import assert from "node:assert/strict";
import test from "node:test";

import {
  parseBatalRetur,
  parseQc,
  parsePutusan,
  parseRetur,
} from "./schema.ts";

const PENERIMAAN = "11111111-1111-4111-8111-111111111111";
const ITEM_A = "22222222-2222-4222-8222-222222222222";
const ITEM_B = "33333333-3333-4333-8333-333333333333";
const RETUR = "44444444-4444-4444-8444-444444444444";

function form(values: Record<string, string>, arrays: Record<string, string[]> = {}): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  for (const [key, list] of Object.entries(arrays)) {
    for (const value of list) data.append(key, value);
  }
  return data;
}

test("QC menerima qty lulus nol untuk satu baris dan koma desimal", () => {
  const parsed = parseQc(
    form(
      { penerimaan_id: PENERIMAAN, versi: "2" },
      { penerimaan_item_id: [ITEM_A, ITEM_B], qty_lulus: ["0", "2,5"] },
    ),
  );

  assert.equal(parsed.input?.baris.length, 2);
  assert.equal(parsed.input?.baris[0]?.qtyLulus, "0");
  assert.equal(parsed.input?.baris[1]?.qtyLulus, "2.5");
});

test("QC menolak qty negatif dan bukan angka", () => {
  for (const qty of ["-1", "abc", "1.23456"]) {
    const parsed = parseQc(
      form(
        { penerimaan_id: PENERIMAAN, versi: "2" },
        { penerimaan_item_id: [ITEM_A], qty_lulus: [qty] },
      ),
    );
    assert.equal(parsed.input, null, `qty ${qty} should be rejected`);
    assert.ok(parsed.message);
  }
});

test("QC tanpa baris ditolak", () => {
  const parsed = parseQc(form({ penerimaan_id: PENERIMAAN, versi: "2" }));
  assert.equal(parsed.input, null);
  assert.equal(parsed.message, "QC harus memuat minimal satu baris");
});

test("retur mengabaikan baris tanpa qty dan nol", () => {
  const parsed = parseRetur(
    form(
      { penerimaan_id: PENERIMAAN, alasan: "penyok" },
      { penerimaan_item_id: [ITEM_A, ITEM_B], qty: ["0", "1,5"] },
    ),
  );

  assert.equal(parsed.input?.baris.length, 1);
  assert.equal(parsed.input?.baris[0]?.penerimaanItemId, ITEM_B);
  assert.equal(parsed.input?.baris[0]?.qty, "1.5");
  assert.equal(parsed.input?.alasan, "penyok");
});

test("retur tanpa baris terisi ditolak dengan pesan referensi", () => {
  const parsed = parseRetur(
    form(
      { penerimaan_id: PENERIMAAN, alasan: "" },
      { penerimaan_item_id: [ITEM_A], qty: [""] },
    ),
  );
  assert.equal(parsed.input, null);
  assert.equal(parsed.message, "Retur harus merujuk minimal satu baris penerimaan");
});

test("penolakan retur wajib alasan, persetujuan tidak", () => {
  const tolak = parsePutusan(
    form({ id: RETUR, versi: "1", setuju: "false", alasan: "  " }),
  );
  assert.equal(tolak.input, null);
  assert.equal(tolak.message, "Alasan penolakan wajib diisi");

  const setuju = parsePutusan(form({ id: RETUR, versi: "1", setuju: "true", alasan: "" }));
  assert.equal(setuju.input?.setuju, true);
});

test("pembatalan retur tanpa alasan ditolak", () => {
  const parsed = parseBatalRetur(form({ id: RETUR, versi: "1", alasan: "" }));
  assert.equal(parsed.input, null);
  assert.equal(parsed.message, "Alasan pembatalan wajib diisi");
});
