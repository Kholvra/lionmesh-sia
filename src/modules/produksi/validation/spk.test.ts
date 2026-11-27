import assert from "node:assert/strict";
import test from "node:test";

import {
  parseSpkCreateForm,
  PESAN_TANGGAL_TARGET,
  PESAN_TARGET,
} from "./spk.ts";

const PRODUK = "11111111-1111-4111-8111-111111111111";
const BOM = "22222222-2222-4222-8222-222222222222";
const GUDANG = "33333333-3333-4333-8333-333333333333";

function form(overrides: Record<string, string> = {}): FormData {
  const data = new FormData();
  const nilai = {
    produk_id: PRODUK,
    bom_versi_id: BOM,
    gudang_id: GUDANG,
    tanggal_perintah: "2026-11-01",
    tgl_target_selesai: "2026-11-05",
    target_qty: "12.5000",
    ...overrides,
  };
  for (const [kunci, isi] of Object.entries(nilai)) data.set(kunci, isi);
  return data;
}

test("SPK valid mempertahankan presisi target", () => {
  const hasil = parseSpkCreateForm(form());
  assert.ok(hasil.input);
  assert.equal(hasil.input.targetQty, "12.5000");
  assert.equal(hasil.input.produkId, PRODUK);
  assert.equal(hasil.input.keterangan, null);
});

test("target kosong, bukan angka, dan di luar rentang dibedakan", () => {
  const kosong = parseSpkCreateForm(form({ target_qty: "" }));
  assert.equal(kosong.fieldErrors.targetQty, "Target jumlah wajib diisi");

  const salah = parseSpkCreateForm(form({ target_qty: "1e3" }));
  assert.equal(salah.fieldErrors.targetQty, "Target jumlah harus berupa angka");

  const negatif = parseSpkCreateForm(form({ target_qty: "-1" }));
  assert.equal(negatif.fieldErrors.targetQty, PESAN_TARGET);

  const nol = parseSpkCreateForm(form({ target_qty: "0" }));
  assert.equal(nol.fieldErrors.targetQty, PESAN_TARGET);

  const presisi = parseSpkCreateForm(form({ target_qty: "1.00001" }));
  assert.equal(presisi.fieldErrors.targetQty, "Target jumlah maksimal 4 angka desimal");
});

test("tanggal target mundur dan tanggal perintah tidak valid ditolak", () => {
  const mundur = parseSpkCreateForm(
    form({ tanggal_perintah: "2026-11-10", tgl_target_selesai: "2026-11-09" }),
  );
  assert.equal(mundur.input, null);
  assert.equal(mundur.fieldErrors.tglTargetSelesai, PESAN_TANGGAL_TARGET);

  const invalid = parseSpkCreateForm(form({ tanggal_perintah: "2026-02-30" }));
  assert.equal(invalid.fieldErrors.tanggalPerintah, "Tanggal perintah tidak valid");
});

test("identitas produk, BOM, dan gudang wajib serta berbentuk UUID", () => {
  assert.equal(
    parseSpkCreateForm(form({ produk_id: "" })).fieldErrors.produkId,
    "Produk wajib dipilih",
  );
  assert.equal(
    parseSpkCreateForm(form({ bom_versi_id: "bukan-uuid" })).fieldErrors.bomVersiId,
    "Versi BOM tidak valid",
  );
  assert.equal(
    parseSpkCreateForm(form({ gudang_id: "" })).fieldErrors.gudangId,
    "Gudang wajib dipilih",
  );
});
