import assert from "node:assert/strict";
import test from "node:test";

import {
  parseEstimasiNilai,
  parseKeputusanApproval,
  parsePenolakan,
  parsePermintaanForm,
  PESAN_WO_WAJIB,
} from "./schema.ts";

const GUDANG = "33333333-3333-4333-8333-333333333333";
const PRODUK = "11111111-1111-4111-8111-111111111111";
const SATUAN = "22222222-2222-4222-8222-222222222222";

function form(values: Record<string, string | string[]>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) {
    if (Array.isArray(value)) {
      for (const item of value) data.append(key, item);
    } else {
      data.set(key, value);
    }
  }
  return data;
}

test("permintaan valid menerima dua baris", () => {
  const parsed = parsePermintaanForm(
    form({
      gudang_id: GUDANG,
      tanggal_butuh: "2026-12-01",
      produk_id: [PRODUK, PRODUK],
      satuan_id: [SATUAN, SATUAN],
      qty: ["2", "3.5"],
    }),
  );

  assert.ok(parsed.input);
  assert.equal(parsed.input.baris.length, 2);
  assert.equal(parsed.input.baris[1]?.qty, "3.5");
});

test("permintaan tanpa baris ditolak", () => {
  const parsed = parsePermintaanForm(
    form({ gudang_id: GUDANG, tanggal_butuh: "2026-12-01" }),
  );
  assert.equal(parsed.input, null);
  assert.equal(parsed.fieldErrors.baris, "Permintaan harus memuat minimal satu barang");
});

test("qty nol dan notasi aneh ditolak per baris", () => {
  for (const qty of ["0", "-1", "1e3", "1.23456"]) {
    const parsed = parsePermintaanForm(
      form({
        gudang_id: GUDANG,
        tanggal_butuh: "2026-12-01",
        produk_id: [PRODUK],
        satuan_id: [SATUAN],
        qty: [qty],
      }),
    );
    assert.equal(parsed.input, null, `qty ${qty} should be rejected`);
    assert.ok(parsed.fieldErrors.baris_0);
  }
});

test("tanggal butuh wajib", () => {
  const parsed = parsePermintaanForm(
    form({
      gudang_id: GUDANG,
      produk_id: [PRODUK],
      satuan_id: [SATUAN],
      qty: ["1"],
    }),
  );
  assert.equal(parsed.input, null);
  assert.equal(parsed.fieldErrors.tanggal_butuh, "Tanggal butuh wajib diisi");
});

test("estimasi nilai kosong dibaca sebagai nol", () => {
  const parsed = parseEstimasiNilai(form({ nilai: "" }));
  assert.equal(parsed.nilai, "0");
  assert.equal(parsed.message, null);
});

test("estimasi nilai menerima koma desimal dan spasi", () => {
  const parsed = parseEstimasiNilai(form({ nilai: " 1500000,5 " }));
  assert.equal(parsed.nilai, "1500000.5");
});

test("estimasi nilai menolak angka negatif, notasi eksponen, dan lebih dari 2 desimal", () => {
  for (const nilai of ["-5", "1e3", "1.234", "abc"]) {
    const parsed = parseEstimasiNilai(form({ nilai }));
    assert.equal(parsed.nilai, null, `nilai ${nilai} should be rejected`);
    assert.ok(parsed.message);
  }
});

test("keputusan approval butuh id dan versi yang sah", () => {
  const valid = parseKeputusanApproval(form({ id: PRODUK, versi: "3" }));
  assert.deepEqual(valid.input, { dokumenId: PRODUK, versi: 3 });

  const tanpaVersi = parseKeputusanApproval(form({ id: PRODUK }));
  assert.equal(tanpaVersi.input, null);
  assert.equal(tanpaVersi.message, "Data permintaan tidak valid");
});

test("penolakan tanpa alasan ditolak", () => {
  const parsed = parsePenolakan(form({ id: PRODUK, versi: "1", alasan: "   " }));
  assert.equal(parsed.input, null);
  assert.equal(parsed.message, "Alasan penolakan wajib diisi");
});
test("pemohon Produksi wajib mengisi referensi perintah produksi", () => {
  const parsed = parsePermintaanForm(
    form({
      gudang_id: GUDANG,
      tanggal_butuh: "2026-12-01",
      produk_id: [PRODUK],
      satuan_id: [SATUAN],
      qty: ["2"],
    }),
    { requireWo: true },
  );

  assert.equal(parsed.input, null);
  assert.equal(parsed.fieldErrors.wo_id, PESAN_WO_WAJIB);
});

test("referensi perintah produksi malformed memakai pesan lama", () => {
  const parsed = parsePermintaanForm(
    form({
      gudang_id: GUDANG,
      wo_id: "bukan-uuid",
      tanggal_butuh: "2026-12-01",
      produk_id: [PRODUK],
      satuan_id: [SATUAN],
      qty: ["2"],
    }),
    { requireWo: true },
  );

  assert.equal(parsed.input, null);
  assert.equal(parsed.fieldErrors.wo_id, "Referensi perintah produksi tidak valid");
});

test("pemohon selain Produksi boleh tanpa referensi perintah produksi", () => {
  const parsed = parsePermintaanForm(
    form({
      gudang_id: GUDANG,
      tanggal_butuh: "2026-12-01",
      produk_id: [PRODUK],
      satuan_id: [SATUAN],
      qty: ["2"],
    }),
    { requireWo: false },
  );

  assert.ok(parsed.input);
  assert.equal(parsed.input.woId, null);
  assert.equal(parsed.fieldErrors.wo_id, undefined);
});
