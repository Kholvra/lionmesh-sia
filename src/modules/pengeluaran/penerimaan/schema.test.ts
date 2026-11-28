import assert from "node:assert/strict";
import test from "node:test";

import {
  parsePembatalanPenerimaan,
  parseTerimaPenerimaan,
  parseTutupException,
} from "./schema.ts";

const PO = "11111111-1111-4111-8111-111111111111";
const GUDANG = "22222222-2222-4222-8222-222222222222";
const PO_ITEM = "33333333-3333-4333-8333-333333333333";
const PENERIMAAN = "44444444-4444-4444-8444-444444444444";
const EXCEPTION = "55555555-5555-4555-8555-555555555555";

function form(values: Record<string, string>, arrays: Record<string, string[]> = {}): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  for (const [key, list] of Object.entries(arrays)) {
    for (const value of list) data.append(key, value);
  }
  return data;
}

test("penerimaan penuh menerima baris dengan koma desimal", () => {
  const parsed = parseTerimaPenerimaan(
    form(
      {
        po_id: PO,
        versi_po: "4",
        gudang_id: GUDANG,
        jenis: "PENUH",
        tanggal: "2026-11-27",
      },
      { po_item_id: [PO_ITEM], qty: ["2,5"] },
    ),
  );

  assert.equal(parsed.input?.jenis, "PENUH");
  assert.equal(parsed.input?.baris[0]?.qty, "2.5");
  assert.equal(parsed.input?.versiPo, 4);
});

test("qty nol dan negatif ditolak sebelum ke server", () => {
  for (const qty of ["0", "0.0", "-1", ""]) {
    const parsed = parseTerimaPenerimaan(
      form(
        {
          po_id: PO,
          versi_po: "1",
          gudang_id: GUDANG,
          jenis: "SEBAGIAN",
          tanggal: "2026-11-27",
        },
        { po_item_id: [PO_ITEM], qty: [qty] },
      ),
    );
    assert.equal(parsed.input, null, `qty ${qty} should be rejected`);
    assert.equal(parsed.message, "Qty harus lebih dari 0");
  }
});

test("jenis penerimaan hanya sebagian atau penuh", () => {
  const parsed = parseTerimaPenerimaan(
    form(
      {
        po_id: PO,
        versi_po: "1",
        gudang_id: GUDANG,
        jenis: "SEMUA",
        tanggal: "2026-11-27",
      },
      { po_item_id: [PO_ITEM], qty: ["1"] },
    ),
  );
  assert.equal(parsed.input, null);
  assert.ok(parsed.message);
});

test("penerimaan tanpa baris ditolak", () => {
  const parsed = parseTerimaPenerimaan(
    form({
      po_id: PO,
      versi_po: "1",
      gudang_id: GUDANG,
      jenis: "PENUH",
      tanggal: "2026-11-27",
    }),
  );
  assert.equal(parsed.input, null);
  assert.equal(parsed.message, "Penerimaan harus memuat minimal satu baris");
});

test("pembatalan penerimaan tanpa alasan ditolak", () => {
  const parsed = parsePembatalanPenerimaan(
    form({ id: PENERIMAAN, versi: "1", alasan: "  " }),
  );
  assert.equal(parsed.input, null);
  assert.equal(parsed.message, "Alasan pembatalan wajib diisi");
});

test("penutupan exception tanpa alasan ditolak", () => {
  const parsed = parseTutupException(form({ exception_id: EXCEPTION, alasan: "" }));
  assert.equal(parsed.input, null);
  assert.equal(parsed.message, "Alasan penutupan wajib diisi");
});
