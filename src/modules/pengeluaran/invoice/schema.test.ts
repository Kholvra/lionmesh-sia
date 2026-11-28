import assert from "node:assert/strict";
import test from "node:test";

import {
  parseBatalInvoice,
  parseCatatInvoice,
  parseKoreksiInvoice,
  parseSahkanInvoice,
} from "./schema.ts";

const PENERIMAAN = "11111111-1111-4111-8111-111111111111";
const ITEM_A = "22222222-2222-4222-8222-222222222222";
const ITEM_B = "33333333-3333-4333-8333-333333333333";
const INVOICE = "44444444-4444-4444-8444-444444444444";

function form(values: Record<string, string>, arrays: Record<string, string[]> = {}): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  for (const [key, list] of Object.entries(arrays)) {
    for (const value of list) data.append(key, value);
  }
  return data;
}

test("invoice menerima dua baris dengan koma desimal", () => {
  const parsed = parseCatatInvoice(
    form(
      {
        penerimaan_id: PENERIMAAN,
        nomor_invoice: "INV/2026/001",
        tanggal: "2026-11-27",
        termin_hari: "30",
        nomor_faktur_pajak: "",
        ppn_nilai: "110",
      },
      {
        penerimaan_item_id: [ITEM_A, ITEM_B],
        qty: ["2", "1,5"],
        harga_satuan_dpp: ["100", "200"],
      },
    ),
  );

  assert.equal(parsed.input?.baris.length, 2);
  assert.equal(parsed.input?.baris[1]?.qty, "1.5");
  assert.equal(parsed.input?.terminHari, 30);
  assert.equal(parsed.input?.nomorFakturPajak, null);
});

test("termin kosong ditolak", () => {
  const parsed = parseCatatInvoice(
    form(
      {
        penerimaan_id: PENERIMAAN,
        nomor_invoice: "INV/2026/001",
        tanggal: "2026-11-27",
        termin_hari: "",
        ppn_nilai: "0",
      },
      { penerimaan_item_id: [ITEM_A], qty: ["1"], harga_satuan_dpp: ["100"] },
    ),
  );
  assert.equal(parsed.input, null);
  assert.equal(parsed.message, "Termin invoice wajib diisi");
});

test("nomor invoice wajib dan qty nol ditolak", () => {
  const tanpaNomor = parseCatatInvoice(
    form(
      {
        penerimaan_id: PENERIMAAN,
        nomor_invoice: "  ",
        tanggal: "2026-11-27",
        termin_hari: "30",
        ppn_nilai: "0",
      },
      { penerimaan_item_id: [ITEM_A], qty: ["1"], harga_satuan_dpp: ["100"] },
    ),
  );
  assert.equal(tanpaNomor.message, "Nomor invoice wajib diisi");

  const qtyNol = parseCatatInvoice(
    form(
      {
        penerimaan_id: PENERIMAAN,
        nomor_invoice: "INV/2026/001",
        tanggal: "2026-11-27",
        termin_hari: "30",
        ppn_nilai: "0",
      },
      { penerimaan_item_id: [ITEM_A], qty: ["0"], harga_satuan_dpp: ["100"] },
    ),
  );
  assert.equal(qtyNol.message, "Qty harus lebih dari 0");
});

test("koreksi invoice memakai versi dan baris", () => {
  const parsed = parseKoreksiInvoice(
    form(
      { id: INVOICE, versi: "3", ppn_nilai: "110" },
      { penerimaan_item_id: [ITEM_A], qty: ["2"], harga_satuan_dpp: ["100"] },
    ),
  );
  assert.equal(parsed.input?.versi, 3);
  assert.equal(parsed.input?.baris.length, 1);
});

test("pengesahan butuh versi angka", () => {
  const parsed = parseSahkanInvoice(form({ id: INVOICE, versi: "x" }));
  assert.equal(parsed.input, null);
  assert.equal(parsed.message, "Data dokumen tidak valid");
});

test("pembatalan invoice tanpa alasan ditolak", () => {
  const parsed = parseBatalInvoice(form({ id: INVOICE, versi: "1", alasan: " " }));
  assert.equal(parsed.input, null);
  assert.equal(parsed.message, "Alasan pembatalan wajib diisi");
});
