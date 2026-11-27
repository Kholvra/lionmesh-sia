import assert from "node:assert/strict";
import test from "node:test";

import {
  bomVersiCreateSchema,
  PESAN_KOMPONEN_DUPLIKAT,
  PESAN_KOMPONEN_KOSONG,
  PESAN_REJECT,
  PESAN_SCRAP,
  parseBomVersiCreateForm,
} from "./bom-versi.ts";

const PRODUK = "11111111-1111-4111-8111-111111111111";
const BAHAN_A = "22222222-2222-4222-8222-222222222222";
const BAHAN_B = "44444444-4444-4444-8444-444444444444";
const SATUAN = "33333333-3333-4333-8333-333333333333";

function input(overrides: Record<string, unknown> = {}) {
  return {
    produkId: PRODUK,
    berlakuDari: "2026-11-01",
    toleransiScrap: "1.5000",
    toleransiReject: "0",
    komponen: [
      {
        komponenProdukId: BAHAN_A,
        satuanId: SATUAN,
        qtyPerUnit: "35.2500",
        urutan: 1,
      },
    ],
    keterangan: null,
    ...overrides,
  };
}

function form(overrides: Record<string, string | string[]> = {}): FormData {
  const data = new FormData();
  const nilai: Record<string, string | string[]> = {
    produk_id: PRODUK,
    berlaku_dari: "2026-11-01",
    toleransi_scrap: "1.5000",
    toleransi_reject: "0",
    komponen_produk_id: [BAHAN_A],
    satuan_id: [SATUAN],
    qty_per_unit: ["35.2500"],
    urutan: ["1"],
    ...overrides,
  };
  for (const [kunci, isi] of Object.entries(nilai)) {
    if (Array.isArray(isi)) for (const item of isi) data.append(kunci, item);
    else data.set(kunci, isi);
  }
  return data;
}

test("versi BOM valid mempertahankan empat desimal dan dua komponen", () => {
  const hasil = parseBomVersiCreateForm(
    form({
      komponen_produk_id: [BAHAN_A, BAHAN_B],
      satuan_id: [SATUAN, SATUAN],
      qty_per_unit: ["35.2500", "1.0001"],
      urutan: ["1", "2"],
    }),
  );
  assert.ok(hasil.input);
  assert.equal(hasil.input.komponen.length, 2);
  assert.equal(hasil.input.komponen[1]?.qtyPerUnit, "1.0001");
  assert.equal(hasil.input.toleransiScrap, "1.5000");
});

test("versi tanpa komponen dan qty tidak valid ditolak", () => {
  const kosong = bomVersiCreateSchema.safeParse(input({ komponen: [] }));
  assert.equal(kosong.success, false);
  if (!kosong.success) {
    assert.equal(kosong.error.issues[0]?.message, PESAN_KOMPONEN_KOSONG);
  }

  const nol = parseBomVersiCreateForm(form({ qty_per_unit: ["0"] }));
  assert.equal(
    nol.fieldErrors["komponen.0.qtyPerUnit"],
    "Jumlah komponen harus lebih dari nol.",
  );

  const salah = parseBomVersiCreateForm(form({ qty_per_unit: ["1e3"] }));
  assert.equal(
    salah.fieldErrors["komponen.0.qtyPerUnit"],
    "Jumlah komponen harus berupa angka",
  );
});

test("toleransi scrap dan reject harus antara 0 dan kurang dari 100", () => {
  for (const nilai of ["-1", "100", "100.0001"]) {
    const hasil = parseBomVersiCreateForm(form({ toleransi_scrap: nilai }));
    assert.equal(hasil.fieldErrors.toleransiScrap, PESAN_SCRAP, nilai);
  }
  assert.equal(
    parseBomVersiCreateForm(form({ toleransi_reject: "101" })).fieldErrors
      .toleransiReject,
    PESAN_REJECT,
  );
  assert.equal(
    parseBomVersiCreateForm(form({ toleransi_reject: "" })).fieldErrors
      .toleransiReject,
    "Toleransi reject wajib diisi",
  );
});

test("komponen dan urutan duplikat ditolak", () => {
  const hasil = parseBomVersiCreateForm(
    form({
      komponen_produk_id: [BAHAN_A, BAHAN_A],
      satuan_id: [SATUAN, SATUAN],
      qty_per_unit: ["1", "2"],
      urutan: ["1", "1"],
    }),
  );
  assert.equal(hasil.input, null);
  assert.equal(
    hasil.fieldErrors["komponen.1.komponenProdukId"],
    PESAN_KOMPONEN_DUPLIKAT,
  );
  assert.equal(hasil.fieldErrors["komponen.1.urutan"], "Urutan komponen tidak boleh sama.");
});

test("tanggal berlaku wajib dan harus tanggal yang benar", () => {
  assert.equal(
    parseBomVersiCreateForm(form({ berlaku_dari: "" })).fieldErrors.berlakuDari,
    "Tanggal berlaku wajib diisi",
  );
  assert.equal(
    parseBomVersiCreateForm(form({ berlaku_dari: "2026-13-01" })).fieldErrors
      .berlakuDari,
    "Tanggal berlaku tidak valid",
  );
});
