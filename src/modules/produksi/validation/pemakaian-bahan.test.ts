import assert from "node:assert/strict";
import test from "node:test";

import {
  parseMaterialIssueForm,
  parseMaterialReturnForm,
  PESAN_JUMLAH_KELUAR,
  PESAN_JUMLAH_PEMAKAIAN,
} from "./pemakaian-bahan.ts";

const WO = "11111111-1111-4111-8111-111111111111";
const BAHAN = "22222222-2222-4222-8222-222222222222";
const SATUAN = "33333333-3333-4333-8333-333333333333";
const GUDANG = "44444444-4444-4444-8444-444444444444";
const PENGELUARAN = "55555555-5555-4555-8555-555555555555";

function form(overrides: Record<string, string> = {}): FormData {
  const data = new FormData();
  const nilai = {
    wo_id: WO,
    produk_id: BAHAN,
    satuan_id: SATUAN,
    gudang_id: GUDANG,
    qty_keluar: "2.5000",
    tanggal: "2026-11-20T08:30:00Z",
    ...overrides,
  };
  for (const [kunci, isi] of Object.entries(nilai)) data.set(kunci, isi);
  return data;
}

function formReturn(overrides: Record<string, string> = {}): FormData {
  const data = new FormData();
  const nilai = {
    wo_id: WO,
    pengeluaran_id: PENGELUARAN,
    qty_terpakai: "2.0000",
    qty_sisa: "0.4000",
    qty_scrap: "0.1000",
    ...overrides,
  };
  for (const [kunci, isi] of Object.entries(nilai)) data.set(kunci, isi);
  return data;
}

test("pengeluaran bahan valid mempertahankan qty empat desimal", () => {
  const hasil = parseMaterialIssueForm(form());
  assert.ok(hasil.input);
  assert.equal(hasil.input.qtyKeluar, "2.5000");
  assert.equal(hasil.input.woId, WO);
});

test("qty keluar kosong, bukan angka, dan nol memakai pesan berbeda", () => {
  assert.equal(
    parseMaterialIssueForm(form({ qty_keluar: "" })).fieldErrors.qtyKeluar,
    "Jumlah keluar wajib diisi",
  );
  assert.equal(
    parseMaterialIssueForm(form({ qty_keluar: "2,5 kg" })).fieldErrors.qtyKeluar,
    "Jumlah keluar harus berupa angka",
  );
  assert.equal(
    parseMaterialIssueForm(form({ qty_keluar: "0" })).fieldErrors.qtyKeluar,
    PESAN_JUMLAH_KELUAR,
  );
  assert.equal(
    parseMaterialIssueForm(form({ qty_keluar: "-1" })).fieldErrors.qtyKeluar,
    PESAN_JUMLAH_KELUAR,
  );
});

test("tanggal mutasi harus berupa timestamp ISO yang sah", () => {
  assert.equal(
    parseMaterialIssueForm(form({ tanggal: "" })).fieldErrors.tanggal,
    "Tanggal mutasi wajib diisi",
  );
  assert.equal(
    parseMaterialIssueForm(form({ tanggal: "2026-02-30T08:00:00Z" })).fieldErrors
      .tanggal,
    "Tanggal mutasi tidak valid",
  );
});

test("konfirmasi pemakaian diterima bila terpakai + sisa + scrap sama dengan keluar", () => {
  const hasil = parseMaterialReturnForm(formReturn(), "2.5000");
  assert.ok(hasil.input);
  assert.equal(hasil.input.qtyTerpakai, "2.0000");
  assert.equal(hasil.input.qtySisa, "0.4000");
});

test("jumlah pemakaian yang tidak cocok ditolak dengan pesan invariant", () => {
  const hasil = parseMaterialReturnForm(formReturn({ qty_sisa: "0.5000" }), "2.5000");
  assert.equal(hasil.input, null);
  assert.equal(hasil.fieldErrors.qtyTerpakai, PESAN_JUMLAH_PEMAKAIAN);
});

test("komponen pemakaian negatif dan kosong dibedakan", () => {
  const negatif = parseMaterialReturnForm(formReturn({ qty_scrap: "-0.1" }), "2.5000");
  assert.equal(negatif.fieldErrors.qtyScrap, "Jumlah scrap tidak boleh negatif.");

  const kosong = parseMaterialReturnForm(formReturn({ qty_terpakai: "" }), "2.5000");
  assert.equal(kosong.fieldErrors.qtyTerpakai, "Jumlah terpakai wajib diisi");
});
