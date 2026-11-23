import assert from "node:assert/strict";
import test from "node:test";

import {
  petaBarisPenerimaan,
  petaBarisPO,
  petaBarisPermintaan,
  petaBarisQC,
  validasiAlasan,
  validasiBarisPenerimaan,
  validasiBarisPO,
  validasiBarisPermintaan,
  validasiBarisQC,
  validasiJenisPenerimaan,
  validasiVersi,
} from "./rules.ts";

test("PR tanpa baris ditolak dengan pesan yang bisa dibaca", () => {
  assert.equal(
    validasiBarisPermintaan([]),
    "Permintaan harus memuat minimal satu barang.",
  );
});

test("qty PR nol, negatif, dan bukan angka ditolak dengan nomor baris", () => {
  for (const qty of ["0", "-2", "abc", "1,5", "1.23456", ""]) {
    assert.equal(
      validasiBarisPermintaan([
        { produkId: "p", satuanId: "s", qty: "1" },
        { produkId: "p", satuanId: "s", qty },
      ]),
      "Qty baris 2 harus lebih dari 0 dan maksimal 4 angka desimal.",
    );
  }
});

test("qty PR valid diterima tanpa membulatkan", () => {
  assert.equal(
    validasiBarisPermintaan([{ produkId: "p", satuanId: "s", qty: "2.5000" }]),
    null,
  );
  assert.deepEqual(
    petaBarisPermintaan([{ produkId: "p", satuanId: "s", qty: "2.5000" }]),
    [{ produk_id: "p", satuan_id: "s", qty: "2.5000" }],
  );
});

test("PO tanpa baris dan harga negatif ditolak", () => {
  assert.equal(validasiBarisPO([]), "PO harus memuat minimal satu barang.");
  assert.equal(
    validasiBarisPO([{ produkId: "p", qty: "1", hargaSatuan: "-1" }]),
    "Harga satuan baris 1 tidak boleh negatif.",
  );
  assert.equal(
    validasiBarisPO([{ produkId: "p", qty: "1", hargaSatuan: "1", ppnPersen: "101" }]),
    "PPN baris 1 harus antara 0 dan 100.",
  );
});

test("PPN kosong menjadi nol, bukan nilai acak", () => {
  assert.deepEqual(
    petaBarisPO([{ produkId: "p", qty: "10", hargaSatuan: "1500.5" }]),
    [{ produk_id: "p", qty: "10", harga_satuan: "1500.5", ppn_persen: "0" }],
  );
  assert.deepEqual(
    petaBarisPO([{ produkId: "p", qty: "10", hargaSatuan: "1500.5", ppnPersen: "11" }]),
    [{ produk_id: "p", qty: "10", harga_satuan: "1500.5", ppn_persen: "11" }],
  );
});

test("penerimaan menolak jenis yang tidak sah", () => {
  assert.equal(
    validasiJenisPenerimaan("PENUH_SEBAGIAN"),
    "Jenis penerimaan harus SEBAGIAN atau PENUH.",
  );
  assert.equal(validasiJenisPenerimaan("PENUH"), null);
  assert.equal(validasiJenisPenerimaan("SEBAGIAN"), null);
});

test("penerimaan tanpa baris dan qty tidak sah ditolak", () => {
  assert.equal(
    validasiBarisPenerimaan([]),
    "Penerimaan harus memuat minimal satu baris.",
  );
  assert.equal(
    validasiBarisPenerimaan([{ poItemId: "i", qtyDiterima: "0" }]),
    "Qty diterima baris 1 harus lebih dari 0 dan maksimal 4 angka desimal.",
  );
  assert.deepEqual(
    petaBarisPenerimaan([{ poItemId: "i", qtyDiterima: "4" }]),
    [{ po_item_id: "i", qty_diterima: "4" }],
  );
});

test("QC menerima qty lulus nol tetapi menolak negatif", () => {
  assert.equal(validasiBarisQC([]), "QC harus memuat minimal satu baris.");
  assert.equal(validasiBarisQC([{ penerimaanItemId: "i", qtyLulus: "-1" }]),
    "Qty lulus baris 1 tidak boleh negatif dan maksimal 4 angka desimal.");
  assert.equal(validasiBarisQC([{ penerimaanItemId: "i", qtyLulus: "0" }]), null);
  assert.deepEqual(
    petaBarisQC([{ penerimaanItemId: "i", qtyLulus: "0" }]),
    [{ penerimaan_item_id: "i", qty_lulus: "0" }],
  );
});

test("alasan pembatalan wajib diisi", () => {
  assert.equal(validasiAlasan("   "), "Alasan pembatalan wajib diisi.");
  assert.equal(validasiAlasan(null), "Alasan pembatalan wajib diisi.");
  assert.equal(validasiAlasan("salah input"), null);
});

test("versi dokumen harus bilangan bulat tidak negatif", () => {
  for (const versi of [-1, 1.5, Number.NaN]) {
    assert.equal(validasiVersi(versi), "Versi dokumen tidak valid.");
  }
  assert.equal(validasiVersi(0), null);
});
