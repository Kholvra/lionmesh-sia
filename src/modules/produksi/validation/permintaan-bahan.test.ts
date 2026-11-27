import assert from "node:assert/strict";
import test from "node:test";

import {
  keAjukanPRInput,
  parsePermintaanBahanForm,
  PESAN_BARIS_KOSONG,
  PESAN_WO_WAJIB,
} from "./permintaan-bahan.ts";

const WO = "11111111-1111-4111-8111-111111111111";
const GUDANG = "22222222-2222-4222-8222-222222222222";
const PRODUK = "33333333-3333-4333-8333-333333333333";
const SATUAN = "44444444-4444-4444-8444-444444444444";
const AKTOR = "55555555-5555-4555-8555-555555555555";

function form(overrides: Record<string, string | string[]> = {}): FormData {
  const data = new FormData();
  const nilai: Record<string, string | string[]> = {
    wo_id: WO,
    gudang_id: GUDANG,
    tanggal_butuh: "2026-12-01",
    produk_id: [PRODUK],
    satuan_id: [SATUAN],
    qty: ["2.5000"],
    ...overrides,
  };
  for (const [kunci, isi] of Object.entries(nilai)) {
    if (Array.isArray(isi)) for (const item of isi) data.append(kunci, item);
    else data.set(kunci, isi);
  }
  return data;
}

test("PR bahan valid memetakan seluruh input ke ajukanPR termasuk wo_id", () => {
  const hasil = parsePermintaanBahanForm(form());
  assert.ok(hasil.input);
  assert.equal(hasil.input.baris[0]?.qty, "2.5000");

  const inputAjukan = keAjukanPRInput(hasil.input, AKTOR);
  assert.equal(inputAjukan.woId, WO);
  assert.equal(inputAjukan.gudangId, GUDANG);
  assert.equal(inputAjukan.tanggalButuh, "2026-12-01");
  assert.equal(inputAjukan.actorId, AKTOR);
  assert.deepEqual(inputAjukan.baris, [
    { produkId: PRODUK, satuanId: SATUAN, qty: "2.5000" },
  ]);
  assert.equal("actor_id" in inputAjukan, false);
});

test("referensi WO wajib dan harus UUID", () => {
  assert.equal(
    parsePermintaanBahanForm(form({ wo_id: "" })).fieldErrors.woId,
    PESAN_WO_WAJIB,
  );
  assert.equal(
    parsePermintaanBahanForm(form({ wo_id: "WO-1" })).fieldErrors.woId,
    "Referensi perintah produksi tidak valid",
  );
});

test("permintaan tanpa baris dan qty tidak sah ditolak", () => {
  const kosong = parsePermintaanBahanForm(
    form({ produk_id: [], satuan_id: [], qty: [] }),
  );
  assert.equal(kosong.input, null);
  assert.equal(kosong.fieldErrors.baris, PESAN_BARIS_KOSONG);

  assert.equal(
    parsePermintaanBahanForm(form({ qty: ["0"] })).fieldErrors["baris.0.qty"],
    "Qty harus lebih dari nol",
  );
  assert.equal(
    parsePermintaanBahanForm(form({ qty: ["1e3"] })).fieldErrors["baris.0.qty"],
    "Qty harus berupa angka",
  );
});

test("tanggal butuh dan gudang wajib diisi", () => {
  assert.equal(
    parsePermintaanBahanForm(form({ tanggal_butuh: "" })).fieldErrors
      .tanggalButuh,
    "Tanggal butuh wajib diisi",
  );
  assert.equal(
    parsePermintaanBahanForm(form({ gudang_id: "salah" })).fieldErrors.gudangId,
    "Gudang tidak valid",
  );
});
